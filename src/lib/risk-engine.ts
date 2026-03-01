// src/lib/risk-engine.ts
// Pure deterministic risk scoring engine
// All formulas match spec exactly; fully unit-testable

export interface HygieneInputs {
  uses2FA: boolean;
  reusesPasswords: boolean;
  usesPasswordManager: boolean;
}

export interface SignalSnapshot {
  breachCount: number;
  mostRecentBreachDate: string | null;
  hasPassword: boolean;
  hasPasswordHash: boolean;
  hasName: boolean;
  hasPhone: boolean;
  hasAddress: boolean;
  hasDOB: boolean;
  hasGravatar: boolean;
  isDisposableDomain: boolean;
  isPredictableEmailPattern: boolean;
  hygiene: HygieneInputs;
}

export interface RiskDimensions {
  takeover: number;
  theft: number;
  phishing: number;
  exposure: number;
}

export interface ScoreBundle {
  finalScore: number;
  level: 'low' | 'moderate' | 'high';
  confidence: 'low' | 'medium' | 'high';
  dimensions: RiskDimensions;
}

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

function monthsAgo(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

export function computeTakeover(s: SignalSnapshot): number {
  let score = 0;
  if (s.hasPassword)                                         score += 40;
  if (s.hasPasswordHash)                                     score += 30;
  score += Math.min(s.breachCount * 10, 60);
  if (s.mostRecentBreachDate && monthsAgo(s.mostRecentBreachDate) < 24) score += 20;
  if (s.hygiene.reusesPasswords)                             score += 30;
  if (!s.hygiene.uses2FA)                                    score += 20;
  if (s.hygiene.usesPasswordManager)                         score -= 15;
  return clamp(score);
}

export function computeTheft(s: SignalSnapshot): number {
  let score = 0;
  if (s.hasName)    score += 20;
  if (s.hasPhone)   score += 25;
  if (s.hasAddress) score += 30;
  if (s.hasDOB)     score += 35;
  return clamp(score);
}

export function computePhishing(s: SignalSnapshot): number {
  let score = 0;
  if (s.hasName)                                                               score += 20;
  if (s.hasGravatar)                                                           score += 15;
  if (s.mostRecentBreachDate && monthsAgo(s.mostRecentBreachDate) < 24)       score += 15;
  if (s.breachCount > 3)                                                       score += 10;
  if (s.isDisposableDomain)                                                    score += 10;
  return clamp(score);
}

export function computeExposure(s: SignalSnapshot): number {
  let score = 0;
  if (s.hasGravatar)              score += 20;
  if (s.isPredictableEmailPattern)score += 20;
  if (s.isDisposableDomain)       score += 15;
  if (s.breachCount > 0)          score += 15;
  if (s.breachCount > 3)          score += 10;
  return clamp(score);
}

export function computeScore(s: SignalSnapshot): ScoreBundle {
  const takeover = computeTakeover(s);
  const theft    = computeTheft(s);
  const phishing = computePhishing(s);
  const exposure = computeExposure(s);

  const finalScore = Math.round(
    0.35 * takeover +
    0.25 * theft    +
    0.20 * phishing +
    0.20 * exposure
  );

  const level: ScoreBundle['level'] =
    finalScore < 35 ? 'low' :
    finalScore < 65 ? 'moderate' : 'high';

  // Coverage-based confidence
  const totalSignals = 11;
  let available = 0;
  if (s.breachCount !== undefined) available++;
  if (s.mostRecentBreachDate !== null) available++;
  if (s.hasPassword !== undefined)    available++;
  if (s.hasPasswordHash !== undefined)available++;
  if (s.hasName !== undefined)        available++;
  if (s.hasPhone !== undefined)       available++;
  if (s.hasAddress !== undefined)     available++;
  if (s.hasDOB !== undefined)         available++;
  if (s.hasGravatar !== undefined)    available++;
  if (s.isDisposableDomain !== undefined) available++;
  if (s.isPredictableEmailPattern !== undefined) available++;

  const coverage = available / totalSignals;
  const confidence: ScoreBundle['confidence'] =
    coverage >= 0.70 ? 'high' :
    coverage >= 0.40 ? 'medium' : 'low';

  return { finalScore, level, confidence, dimensions: { takeover, theft, phishing, exposure } };
}

// Exposure velocity
export function computeVelocity(breachCount: number, earliestBreachYear?: number): number {
  const currentYear = new Date().getFullYear();
  const yearsActive = Math.max(1, currentYear - (earliestBreachYear ?? currentYear) + 1);
  return breachCount / yearsActive;
}

// Trend analysis
export function computeTrend(breachDates: string[]): 'increasing' | 'stable' | 'declining' {
  const now = new Date();
  const cutoff = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
  const cutoff4 = new Date(now.getFullYear() - 4, now.getMonth(), now.getDate());

  const recent = breachDates.filter(d => new Date(d) >= cutoff).length;
  const prior  = breachDates.filter(d => new Date(d) >= cutoff4 && new Date(d) < cutoff).length;

  if (recent > prior)  return 'increasing';
  if (recent < prior)  return 'declining';
  return 'stable';
}

export function computeAverageBreachIntervalMonths(breachDates: string[]): number | null {
  if (breachDates.length < 2) return null;
  const sorted = breachDates
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const months = (curr.getFullYear() - prev.getFullYear()) * 12 + (curr.getMonth() - prev.getMonth());
    if (months > 0) intervals.push(months);
  }

  if (intervals.length === 0) return null;
  return intervals.reduce((sum, n) => sum + n, 0) / intervals.length;
}

export function computeBreachForecast(
  velocityPerYear: number,
  trend: 'increasing' | 'stable' | 'declining'
): number {
  const trendMultiplier = trend === 'increasing' ? 1.15 : trend === 'declining' ? 0.85 : 1;
  return Math.max(0, Math.round(velocityPerYear * trendMultiplier));
}

export function explainTrend(trend: 'increasing' | 'stable' | 'declining'): string {
  if (trend === 'increasing') {
    return 'More breaches were found in the last 24 months than in the prior 24 months.';
  }
  if (trend === 'declining') {
    return 'Fewer breaches were found in the last 24 months than in the prior 24 months.';
  }
  return 'Recent and prior 24-month breach counts are about the same.';
}

export function computeBreachMomentum(
  velocityPerYear: number,
  trend: 'increasing' | 'stable' | 'declining',
  mostRecentBreachDate: string | null
): number {
  const velocityScore = clamp(velocityPerYear * 18, 0, 70);
  const trendBonus = trend === 'increasing' ? 20 : trend === 'declining' ? -10 : 0;
  const recencyBonus =
    mostRecentBreachDate && monthsAgo(mostRecentBreachDate) <= 18 ? 12 :
    mostRecentBreachDate && monthsAgo(mostRecentBreachDate) <= 36 ? 6 : 0;
  return clamp(Math.round(velocityScore + trendBonus + recencyBonus), 0, 100);
}

export function computeExpectedNextBreachWindowMonths(
  averageIntervalMonths: number | null,
  trend: 'increasing' | 'stable' | 'declining'
): { min: number; max: number } | null {
  if (!averageIntervalMonths || averageIntervalMonths <= 0) return null;
  const multiplier = trend === 'increasing' ? 0.8 : trend === 'declining' ? 1.2 : 1;
  const center = Math.max(1, averageIntervalMonths * multiplier);
  const min = Math.max(1, Math.round(center * 0.75));
  const max = Math.max(min + 1, Math.round(center * 1.25));
  return { min, max };
}

export function hasBreachClustering(
  breachDates: string[],
  averageIntervalMonths: number | null
): boolean {
  if (breachDates.length < 3 || !averageIntervalMonths) return false;
  return averageIntervalMonths <= 8;
}

// Simulate score delta for mitigation toggles
export function simulateScore(
  baseline: SignalSnapshot,
  toggles: {
    enable2FA?: boolean;
    stopReuse?: boolean;
    removeGravatar?: boolean;
    usePasswordManager?: boolean;
  }
): ScoreBundle {
  const modified: SignalSnapshot = {
    ...baseline,
    hasGravatar: toggles.removeGravatar ? false : baseline.hasGravatar,
    hygiene: {
      uses2FA:            toggles.enable2FA        ?? baseline.hygiene.uses2FA,
      reusesPasswords:    toggles.stopReuse        ? false : baseline.hygiene.reusesPasswords,
      usesPasswordManager: toggles.usePasswordManager ?? baseline.hygiene.usesPasswordManager,
    },
  };
  return computeScore(modified);
}
