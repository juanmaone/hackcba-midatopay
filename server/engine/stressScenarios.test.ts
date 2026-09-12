// server/engine/stressScenarios.test.ts
// Golden numbers hand-computed for the same fixture input as riskSynthesis.test.ts, with
// agroScore=76 (this task's function takes the already-adjusted agroScore as an input, it doesn't
// recompute synthesis). See plan "Deviations from the docs" #5 for the score/risk formulas used
// here (undocumented in the source docs, defined for this plan).
import { describe, expect, it } from 'vitest';
import type { RiskSynthesisInput } from '../../shared/types/agent.js';
import { calculateStressScenarios } from './stressScenarios.js';

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

describe('calculateStressScenarios', () => {
  it('matches the hand-computed golden path for base/drought/price/combined', () => {
    const scenarios = calculateStressScenarios(makeInput(), 76);

    // baseRevenue = 300*8.2*178000 = 437,880,000; operatingCost = 284,622,000; debtService = 100,000,000
    // BASE: revenue*1*1 -> dscr = 1.53 -> risk 'low' (>=1.5) -> exposure capped at requested -> score = round(76*1*1)
    expect(scenarios.base).toEqual({ score: 76, exposure: 100_000_000, dscr: 1.53, risk: 'low' });

    // DROUGHT: revenue*0.7 = 306,516,000 -> dscr = (306,516,000-284,622,000)/100,000,000 = 0.22 -> risk 'high'
    // exposure = 100,000,000 * min(1, 0.22/1.2=0.18) = 18,000,000 (rounded to nearest 1,000,000)
    // score = round(76*0.7*1) = 53
    expect(scenarios.drought).toEqual({ score: 53, exposure: 18_000_000, dscr: 0.22, risk: 'high' });

    // PRICE: revenue*0.8 = 350,304,000 -> dscr = (350,304,000-284,622,000)/100,000,000 = 0.66 -> risk 'high'
    // exposure = 100,000,000 * min(1, 0.66/1.2=0.55) = 55,000,000
    // score = round(76*1*0.8) = 61
    expect(scenarios.price).toEqual({ score: 61, exposure: 55_000_000, dscr: 0.66, risk: 'high' });

    // COMBINED: revenue*0.7*0.8 = 245,212,800 -> dscr = (245,212,800-284,622,000)/100,000,000 = -0.39 -> risk 'high'
    // exposure = 100,000,000 * max(0, min(1, -0.39/1.2)) = 0
    // score = round(76*0.7*0.8) = 43
    expect(scenarios.combined).toEqual({ score: 43, exposure: 0, dscr: -0.39, risk: 'high' });
  });
});
