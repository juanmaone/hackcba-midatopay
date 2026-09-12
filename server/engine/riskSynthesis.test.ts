// server/engine/riskSynthesis.test.ts
// Golden-path numbers are hand-computed for THIS plan's exact inputs below, not copied from
// docs/INTEGRATION_GUIDE.md's example — that example doesn't reconcile with its own documented
// formula (see plan "Deviations from the docs" #2). Every number here can be re-derived from the
// formulas in riskSynthesis.ts by hand.
import { describe, expect, it } from 'vitest';
import type { RiskSynthesisInput } from '../../shared/types/agent.js';
import { calculateRecommendedExposure, getDecision, getRating, synthesizeRisk } from './riskSynthesis.js';

function makeInput(): RiskSynthesisInput {
  return {
    field: { lat: -32.69, lng: -62.1, hectares: 300, crop: 'maiz', campaign: '2026/27' },
    loan: { requestedAmount: 100_000_000, termMonths: 12 },
    financial: { agentId: 'financial', timestamp: 't', confidence: 0.9, score: 60, data: { totalDebt: 0, delinquencyStatus: 1, daysOverdue: 0, rejectedChecks: 0, entities: [] }, metrics: { primary: 60, secondary: 0, trend: 'stable', volatility: 0 }, alerts: [], sources: [] },
    climate: { agentId: 'climate', timestamp: 't', confidence: 0.9, score: 70, data: { historicalRainfall: 600, rainfallAnomaly: -5, droughtRisk: 'low', temperatureAnomaly: 0, rainyDays: 50, consecutiveDryDays: 5 }, metrics: { primary: 70, secondary: 0, trend: 'stable', volatility: 0 }, alerts: [], sources: [] },
    yield: { agentId: 'yield', timestamp: 't', confidence: 0.9, score: 80, data: { historicalYield: [8.2, 8.2, 8.2, 8.2, 8.2], expectedYield: 8.2, stressYield: 5.7, yieldVolatility: 15, cropType: 'maiz', region: 'Cordoba', droughtYears: 1 }, metrics: { primary: 80, secondary: 0, trend: 'stable', volatility: 0 }, alerts: [], sources: [] },
    soil: { agentId: 'soil', timestamp: 't', confidence: 0.9, score: 90, data: { ph: 6.5, organicCarbon: 21, clayContent: 28, sandContent: 42, soilScore: 90, textureClass: 'Loam', drainageClass: 'Bien drenado' }, metrics: { primary: 90, secondary: 0, trend: 'stable', volatility: 0 }, alerts: [], sources: [] },
    news: { agentId: 'news', timestamp: 't', confidence: 0.9, score: 60, data: { articleCount: 10, avgSentiment: 0.1, positiveShare: 0.5, negativeShare: 0.3, topThemes: [], riskEvents: [] }, metrics: { primary: 60, secondary: 0, trend: 'stable', volatility: 0 }, alerts: [], sources: [] },
  };
}

describe('synthesizeRisk', () => {
  it('matches the hand-computed golden path for this plan\'s fixture input', () => {
    const output = synthesizeRisk(makeInput());

    // productiveScore = round(80*0.40 + 90*0.35 + 70*0.25) = round(32 + 31.5 + 17.5) = round(81) = 81
    expect(output.productiveResilience).toBe(81);
    // agroScore = round(60*0.35 + 81*0.65) = round(21 + 52.65) = round(73.65) = 74
    // newsAdjustment = round((60-50)*0.2) = 2 -> adjusted = 76
    expect(output.agroScore).toBe(76);
    expect(output.financialCapacity).toBe(60);
    expect(output.rating).toBe('B+');
    expect(output.decision).toBe('APPROVE WITH LIMIT');
    // revenue = 300*8.2*178000 = 437,880,000; operatingCost = 65% of that = 284,622,000
    // debtService = (100,000,000/12)*12 = 100,000,000
    // dscr.base = (437,880,000 - 284,622,000)/100,000,000 = 1.53
    expect(output.dscr.base).toBeCloseTo(1.53, 2);
    // stressRevenue = 300*5.7*178000 = 304,380,000; dscr.stress = (304,380,000-284,622,000)/100,000,000 = 0.20
    expect(output.dscr.stress).toBeCloseTo(0.2, 2);
    // recommendedExposure = 100,000,000 * min(1, 1.53/1.2) = 100,000,000 * 1 (capped)
    expect(output.recommendedExposure).toBe(100_000_000);
    expect(output.breakdown).toEqual({ financialWeight: 0.35, productiveWeight: 0.65 });
  });
});

describe('getRating', () => {
  it('maps score ranges to the documented rating table', () => {
    expect(getRating(95)).toBe('A+');
    expect(getRating(85)).toBe('A');
    expect(getRating(75)).toBe('B+');
    expect(getRating(65)).toBe('B');
    expect(getRating(55)).toBe('C+');
    expect(getRating(45)).toBe('C');
    expect(getRating(30)).toBe('D');
  });
});

describe('getDecision', () => {
  it('approves outright only when score >= 80 AND stress DSCR >= 1.2', () => {
    expect(getDecision(85, 1.3)).toBe('APPROVE');
    expect(getDecision(85, 1.0)).toBe('APPROVE WITH LIMIT');
    expect(getDecision(60, 0.5)).toBe('APPROVE WITH LIMIT');
    expect(getDecision(30, 0.5)).toBe('REJECT / RESTRUCTURE');
  });
});

describe('calculateRecommendedExposure', () => {
  it('clamps the ratio to [0, 1] so exposure is never negative or over-requested', () => {
    expect(calculateRecommendedExposure(100_000_000, 2.4)).toBe(100_000_000); // ratio capped at 1
    expect(calculateRecommendedExposure(100_000_000, -0.5)).toBe(0); // ratio clamped at 0, not negative
    expect(calculateRecommendedExposure(100_000_000, 0.6)).toBe(50_000_000); // 0.6/1.2 = 0.5
  });
});
