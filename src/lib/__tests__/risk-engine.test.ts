// src/lib/__tests__/risk-engine.test.ts
import {
  computeScore, computeTakeover, computeTheft, computePhishing, computeExposure,
  computeVelocity, computeTrend, simulateScore, SignalSnapshot,
  computeAverageBreachIntervalMonths, computeBreachForecast, explainTrend,
  computeBreachMomentum, computeExpectedNextBreachWindowMonths, hasBreachClustering
} from '../risk-engine';

const BASE: SignalSnapshot = {
  breachCount: 0,
  mostRecentBreachDate: null,
  hasPassword: false,
  hasPasswordHash: false,
  hasName: false,
  hasPhone: false,
  hasAddress: false,
  hasDOB: false,
  hasGravatar: false,
  isDisposableDomain: false,
  isPredictableEmailPattern: false,
  hygiene: { uses2FA: true, reusesPasswords: false, usesPasswordManager: true },
};

const HIGH_RISK: SignalSnapshot = {
  breachCount: 8,
  mostRecentBreachDate: new Date().toISOString().split('T')[0], // today
  hasPassword: true,
  hasPasswordHash: true,
  hasName: true,
  hasPhone: true,
  hasAddress: true,
  hasDOB: true,
  hasGravatar: true,
  isDisposableDomain: true,
  isPredictableEmailPattern: true,
  hygiene: { uses2FA: false, reusesPasswords: true, usesPasswordManager: false },
};

describe('computeTakeover', () => {
  it('returns 0 for baseline safe signal', () => {
    expect(computeTakeover(BASE)).toBe(0);
  });

  it('caps at 100 for max risk', () => {
    expect(computeTakeover(HIGH_RISK)).toBe(100);
  });

  it('applies password manager deduction', () => {
    const s = { ...BASE, hasPassword: true, hygiene: { uses2FA: false, reusesPasswords: false, usesPasswordManager: true } };
    expect(computeTakeover(s)).toBe(Math.max(0, 40 + 20 - 15)); // 45
  });

  it('never goes below 0', () => {
    const s = { ...BASE, hygiene: { uses2FA: true, reusesPasswords: false, usesPasswordManager: true } };
    expect(computeTakeover(s)).toBeGreaterThanOrEqual(0);
  });
});

describe('computeTheft', () => {
  it('returns 0 with no PII', () => {
    expect(computeTheft(BASE)).toBe(0);
  });

  it('adds correct values for each data class', () => {
    expect(computeTheft({ ...BASE, hasName: true })).toBe(20);
    expect(computeTheft({ ...BASE, hasPhone: true })).toBe(25);
    expect(computeTheft({ ...BASE, hasAddress: true })).toBe(30);
    expect(computeTheft({ ...BASE, hasDOB: true })).toBe(35);
  });

  it('caps at 100', () => {
    expect(computeTheft(HIGH_RISK)).toBe(100);
  });
});

describe('computeScore', () => {
  it('produces low level for minimal risk', () => {
    const result = computeScore(BASE);
    expect(result.level).toBe('low');
    expect(result.finalScore).toBeLessThan(35);
  });

  it('produces high level for max risk', () => {
    const result = computeScore(HIGH_RISK);
    expect(result.level).toBe('high');
    expect(result.finalScore).toBeGreaterThanOrEqual(65);
  });

  it('applies correct weighted formula', () => {
    const t = computeTakeover(HIGH_RISK);
    const th = computeTheft(HIGH_RISK);
    const p = computePhishing(HIGH_RISK);
    const e = computeExposure(HIGH_RISK);
    const expected = Math.round(0.35*t + 0.25*th + 0.20*p + 0.20*e);
    expect(computeScore(HIGH_RISK).finalScore).toBe(expected);
  });

  it('confidence boundaries — high >= 0.70 coverage', () => {
    const result = computeScore(HIGH_RISK);
    expect(result.confidence).toBe('high');
  });
});

describe('computeVelocity', () => {
  it('handles zero breaches', () => {
    expect(computeVelocity(0)).toBe(0);
  });

  it('calculates correctly', () => {
    const year = new Date().getFullYear() - 5;
    const velocity = computeVelocity(6, year);
    expect(velocity).toBeCloseTo(1, 1); // 6 breaches / 6 years
  });
});

describe('computeTrend', () => {
  it('returns stable for empty input', () => {
    expect(computeTrend([])).toBe('stable');
  });

  it('returns increasing when recent window > prior', () => {
    const recentDate = new Date();
    recentDate.setMonth(recentDate.getMonth() - 6);
    expect(computeTrend([recentDate.toISOString().split('T')[0]])).toBe('increasing');
  });

  it('returns declining when recent window < prior', () => {
    const priorDate = new Date();
    priorDate.setFullYear(priorDate.getFullYear() - 3);
    expect(computeTrend([priorDate.toISOString().split('T')[0]])).toBe('declining');
  });
});

describe('simulateScore', () => {
  it('reduces score when mitigations applied', () => {
    const baseline = computeScore(HIGH_RISK);
    const simulated = simulateScore(HIGH_RISK, {
      enable2FA: true,
      stopReuse: true,
      removeGravatar: true,
      usePasswordManager: true,
    });
    expect(simulated.finalScore).toBeLessThan(baseline.finalScore);
  });
});

describe('time-series helpers', () => {
  it('computes average months between breaches', () => {
    expect(computeAverageBreachIntervalMonths(['2023-01-01', '2023-04-01', '2023-10-01'])).toBeCloseTo(4.5, 1);
  });

  it('returns null when not enough breach dates', () => {
    expect(computeAverageBreachIntervalMonths(['2023-01-01'])).toBeNull();
  });

  it('forecasts by trend multiplier', () => {
    expect(computeBreachForecast(4, 'increasing')).toBe(5);
    expect(computeBreachForecast(4, 'stable')).toBe(4);
    expect(computeBreachForecast(4, 'declining')).toBe(3);
  });

  it('explains trend in plain language', () => {
    expect(explainTrend('declining')).toMatch(/Fewer breaches/);
  });

  it('computes breach momentum score', () => {
    expect(computeBreachMomentum(2, 'increasing', new Date().toISOString().split('T')[0])).toBeGreaterThan(40);
  });

  it('computes expected next breach window', () => {
    expect(computeExpectedNextBreachWindowMonths(10, 'increasing')).toEqual({ min: 6, max: 10 });
  });

  it('detects clustering from short intervals', () => {
    expect(hasBreachClustering(['2024-01-01', '2024-04-01', '2024-07-01'], 3)).toBe(true);
  });
});
