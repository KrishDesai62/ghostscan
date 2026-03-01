import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkBreaches, checkGravatar, isDisposableDomain, isPredictablePattern, extractSignals } from '@/lib/hibp';
import {
  computeScore, computeVelocity, computeTrend, computeBreachForecast, computeAverageBreachIntervalMonths,
  explainTrend, computeBreachMomentum, computeExpectedNextBreachWindowMonths, hasBreachClustering
} from '@/lib/risk-engine';

const PreviewSchema = z.object({
  email: z.string().email(),
  livenessPassed: z.boolean(),
  hygieneInputs: z.object({
    uses2FA: z.boolean(),
    reusesPasswords: z.boolean(),
    usesPasswordManager: z.boolean(),
  }),
});

export async function POST(req: NextRequest) {
  let body;
  try {
    body = PreviewSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const [{ breaches, degraded, source }, hasGravatar] = await Promise.all([
    checkBreaches(body.email),
    checkGravatar(body.email),
  ]);

  const breachSignals = extractSignals(breaches);
  const breachDates = breaches.map((b) => b.BreachDate).filter(Boolean);
  const mostRecentBreachDate = breachDates.sort().reverse()[0] ?? null;
  const earliestBreachYear = breachDates.length > 0
    ? Math.min(...breachDates.map((d) => new Date(d).getFullYear()))
    : undefined;

  const signalSnapshot = {
    breachCount: breaches.length,
    mostRecentBreachDate,
    ...breachSignals,
    hasGravatar,
    isDisposableDomain: isDisposableDomain(body.email),
    isPredictableEmailPattern: isPredictablePattern(body.email),
    hygiene: body.hygieneInputs,
  };

  let scoreBundle = computeScore(signalSnapshot);
  const reportType = body.livenessPassed ? 'verified_full' : 'limited_fallback';
  if (!body.livenessPassed && scoreBundle.confidence === 'high') {
    scoreBundle = { ...scoreBundle, confidence: 'medium' };
  }

  const velocity = computeVelocity(breaches.length, earliestBreachYear);
  const trend = computeTrend(breachDates);

  const graphData = {
    nodes: [
      { id: 'email', label: body.email.split('@')[0], type: 'email', color: '#00ff9d' },
      ...breaches.map((b) => ({ id: b.Name, label: b.Name, type: 'breach', color: '#ff3b5c' })),
      ...Array.from(new Set(breaches.flatMap((b) => b.DataClasses)))
        .map((dc) => ({ id: dc, label: dc, type: 'data_class', color: '#4cc9f0' })),
    ],
    edges: [
      ...breaches.map((b) => ({ source: 'email', target: b.Name, label: 'Leaked In' })),
      ...breaches.flatMap((b) => b.DataClasses.map((dc) => ({ source: b.Name, target: dc, label: 'Contains' }))),
    ],
  };

  const averageIntervalMonths = computeAverageBreachIntervalMonths(breachDates);
  const forecastNext12Months = computeBreachForecast(velocity, trend);
  const trendExplanation = explainTrend(trend);
  const momentumScore = computeBreachMomentum(velocity, trend, mostRecentBreachDate);
  const expectedWindow = computeExpectedNextBreachWindowMonths(averageIntervalMonths, trend);
  const clusteredExposure = hasBreachClustering(breachDates, averageIntervalMonths);

  return NextResponse.json({
    scanId: `preview-scan-${Date.now()}`,
    email: body.email,
    reportType,
    scoreBundle,
    breaches: breaches.map((b) => ({
      id: b.Name,
      breach_name: b.Name,
      breach_domain: b.Domain,
      breach_date: b.BreachDate,
      pwn_count: b.PwnCount,
      data_classes: b.DataClasses,
      is_verified: b.IsVerified,
      is_sensitive: b.IsSensitive,
    })),
    graphData,
    velocity,
    trend,
    degraded,
    dataSource: source,
    hygiene: body.hygieneInputs,
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
  });
}
