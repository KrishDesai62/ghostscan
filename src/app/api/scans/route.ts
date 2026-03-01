// src/app/api/scans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { checkBreaches, checkGravatar, isDisposableDomain, isPredictablePattern, extractSignals } from '@/lib/hibp';
import {
  computeScore, computeVelocity, computeTrend, computeAverageBreachIntervalMonths, computeBreachForecast,
  explainTrend, computeBreachMomentum, computeExpectedNextBreachWindowMonths, hasBreachClustering
} from '@/lib/risk-engine';

const ScanRequestSchema = z.object({
  verificationSessionId: z.string().uuid(),
  hygieneInputs: z.object({
    uses2FA:            z.boolean(),
    reusesPasswords:    z.boolean(),
    usesPasswordManager:z.boolean(),
  }),
});

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  // ── Auth check ──────────────────────────────────────────────
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // ── Rate limit check (simplified — see rate-limit.ts for full impl) ──
  // TODO: plug in Upstash ratelimit here

  // ── Parse & validate request ────────────────────────────────
  let body;
  try {
    body = ScanRequestSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request', details: err }, { status: 400 });
  }

  // ── Fetch user ──────────────────────────────────────────────
  const { data: user } = await supabase.from('users').select('email').eq('id', session.user.id).single();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // ── Verify session belongs to user ──────────────────────────
  const { data: verSession } = await supabase
    .from('verification_sessions')
    .select('*')
    .eq('id', body.verificationSessionId)
    .eq('user_id', session.user.id)
    .single();
  if (!verSession) return NextResponse.json({ error: 'Verification session not found' }, { status: 404 });

  const email = user.email;
  const reportType = verSession.liveness_status === 'passed' ? 'verified_full' : 'limited_fallback';

  // ── Breach lookup ────────────────────────────────────────────
  const [{ breaches, degraded, source }, hasGravatar] = await Promise.all([
    checkBreaches(email),
    checkGravatar(email),
  ]);

  // ── Build signal snapshot ────────────────────────────────────
  const breachSignals = extractSignals(breaches);
  const breachDates = breaches.map(b => b.BreachDate).filter(Boolean);
  const mostRecentBreachDate = breachDates.sort().reverse()[0] ?? null;
  const earliestBreachYear = breachDates.length > 0
    ? Math.min(...breachDates.map(d => new Date(d).getFullYear()))
    : undefined;

  const signalSnapshot = {
    breachCount:              breaches.length,
    mostRecentBreachDate,
    ...breachSignals,
    hasGravatar,
    isDisposableDomain:       isDisposableDomain(email),
    isPredictableEmailPattern:isPredictablePattern(email),
    hygiene:                  body.hygieneInputs,
  };

  // ── Score ────────────────────────────────────────────────────
  let scoreBundle = computeScore(signalSnapshot);

  // Force confidence <= medium for limited fallback
  if (reportType === 'limited_fallback' && scoreBundle.confidence === 'high') {
    scoreBundle = { ...scoreBundle, confidence: 'medium' };
  }

  const velocity = computeVelocity(breaches.length, earliestBreachYear);
  const trend = computeTrend(breachDates);
  const averageIntervalMonths = computeAverageBreachIntervalMonths(breachDates);
  const forecastNext12Months = computeBreachForecast(velocity, trend);
  const trendExplanation = explainTrend(trend);
  const momentumScore = computeBreachMomentum(velocity, trend, mostRecentBreachDate);
  const expectedWindow = computeExpectedNextBreachWindowMonths(averageIntervalMonths, trend);
  const clusteredExposure = hasBreachClustering(breachDates, averageIntervalMonths);

  // ── Attack graph data ─────────────────────────────────────────
  const graphData = {
    nodes: [
      { id: 'email', label: email.split('@')[0], type: 'email' },
      ...breaches.map(b => ({ id: b.Name, label: b.Name, type: 'breach' })),
      ...Array.from(new Set(breaches.flatMap(b => b.DataClasses)))
               .map(dc => ({ id: dc, label: dc, type: 'data_class' })),
    ],
    edges: [
      ...breaches.map(b => ({ from: 'email', to: b.Name, label: 'Leaked In' })),
      ...breaches.flatMap(b => b.DataClasses.map(dc => ({ from: b.Name, to: dc, label: 'Contains' }))),
    ],
  };

  // ── Persist scan ─────────────────────────────────────────────
  const { data: scan, error: scanError } = await supabase
    .from('scans')
    .insert({
      user_id:                  session.user.id,
      verification_session_id:  body.verificationSessionId,
      report_type:              reportType,
      risk_score:               scoreBundle.finalScore,
      risk_level:               scoreBundle.level,
      confidence:               scoreBundle.confidence,
      takeover_risk:            scoreBundle.dimensions.takeover,
      theft_risk:               scoreBundle.dimensions.theft,
      phishing_risk:            scoreBundle.dimensions.phishing,
      exposure_risk:            scoreBundle.dimensions.exposure,
      signal_snapshot:          signalSnapshot,
      mitigation_baseline:      scoreBundle.dimensions,
      exposure_velocity:        velocity,
      trend,
    })
    .select()
    .single();

  if (scanError) {
    console.error('[Scan] DB error:', scanError);
    return NextResponse.json({ error: 'Failed to save scan' }, { status: 500 });
  }

  // ── Persist breaches ─────────────────────────────────────────
  if (breaches.length > 0) {
    await supabase.from('breaches').insert(
      breaches.map(b => ({
        scan_id:       scan.id,
        breach_name:   b.Name,
        breach_domain: b.Domain,
        breach_date:   b.BreachDate || null,
        pwn_count:     b.PwnCount,
        data_classes:  b.DataClasses,
        is_verified:   b.IsVerified,
        is_sensitive:  b.IsSensitive,
      }))
    );
  }

  return NextResponse.json({
    scanId:      scan.id,
    reportType,
    scoreBundle,
    breaches:    breaches.map(b => ({
      id:          b.Name,
      breach_name: b.Name,
      breach_domain: b.Domain,
      breach_date: b.BreachDate,
      pwn_count:   b.PwnCount,
      data_classes:b.DataClasses,
      is_verified: b.IsVerified,
      is_sensitive:b.IsSensitive,
    })),
    graphData,
    velocity,
    trend,
    degraded,
    dataSource: source,
    timeSeries: {
      averageIntervalMonths,
      forecastNext12Months,
    },
    analytics: {
      trendExplanation,
      momentumScore,
      expectedWindow,
      clusteredExposure,
    },
    legalContext: {
      email,
      reportType,
      scanId: scan.id,
    },
  });
}

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: scans } = await supabase
    .from('scans')
    .select('*, breaches(*)')
    .eq('user_id', session.user.id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  return NextResponse.json({ scans: scans ?? [] });
}
