// Cross-checks calculateScenario against server/engine/stressScenarios.test.ts's own golden
// numbers for the identical input (hectares=300, expectedYield=8.2, requestedAmount=100M,
// termMonths=12, agroScore=76) — same fixture, same formula, two independent implementations
// (see the "Duplicated rather than imported" note on calculateScenario). If these ever diverge,
// the client formula has drifted from the server's real risk engine.
import { describe, expect, it } from 'vitest';
import type { UnderwritingCase } from '../../types/underwriting';
import { calculateScenario } from './calculations';

function makeCase(overrides: Partial<UnderwritingCase['underwriting']> = {}): UnderwritingCase {
  return {
    applicant: { cuit: '20-00000000-0', name: 'Test' },
    field: { hectares: 300, province: 'Córdoba', department: 'Test', crop: 'Maíz', campaign: '2026/27', polygon: [] },
    loan: { requestedAmount: 100_000_000, termMonths: 12 },
    financial: { score: 60, currentDebt: 0, delinquencyStatus: 1 },
    production: { expectedYield: 8.2, stressYield: 5.7, yieldVolatility: 15 },
    climate: { historicalRainfall: 600, rainfallAnomaly: -5, droughtRisk: 'low' },
    soil: { score: 90, ph: 6.5, organicCarbon: 21 },
    underwriting: { productiveScore: 81, agroScore: 76, recommendedExposure: 100_000_000, baseDSCR: 1.53, stressDSCR: 0.2, rating: 'B+', ...overrides },
  };
}

describe('calculateScenario', () => {
  it('matches server stressScenarios "base" (no stress)', () => {
    const result = calculateScenario(makeCase(), { yieldMultiplier: 1, priceMultiplier: 1, requestedAmount: 100_000_000, termMonths: 12 });
    expect(result).toEqual({ score: 76, exposure: 100_000_000, dscr: 1.53, risk: 'low', decision: 'APROBAR CON LÍMITE' });
  });

  it('matches server stressScenarios "drought" (yield x0.7)', () => {
    const result = calculateScenario(makeCase(), { yieldMultiplier: 0.7, priceMultiplier: 1, requestedAmount: 100_000_000, termMonths: 12 });
    // exposure: 18,333,333 here vs the server's 18,000,000 — calculateRecommendedExposure rounds
    // to the nearest peso client-side vs. nearest million server-side (pre-existing difference,
    // not introduced by calculateScenario). Both display identically as "ARS 18M".
    expect(result).toEqual({ score: 53, exposure: 18_333_333, dscr: 0.22, risk: 'high', decision: 'RECHAZAR / REESTRUCTURAR' });
  });

  it('matches server stressScenarios "price" (price x0.8)', () => {
    const result = calculateScenario(makeCase(), { yieldMultiplier: 1, priceMultiplier: 0.8, requestedAmount: 100_000_000, termMonths: 12 });
    expect(result).toEqual({ score: 61, exposure: 55_000_000, dscr: 0.66, risk: 'high', decision: 'RECHAZAR / REESTRUCTURAR' });
  });

  it('matches server stressScenarios "combined" (yield x0.7, price x0.8) — negative DSCR clamps exposure to 0, not negative', () => {
    const result = calculateScenario(makeCase(), { yieldMultiplier: 0.7, priceMultiplier: 0.8, requestedAmount: 100_000_000, termMonths: 12 });
    expect(result).toEqual({ score: 43, exposure: 0, dscr: -0.39, risk: 'high', decision: 'RECHAZAR / REESTRUCTURAR' });
  });

  it('halving the requested amount only moves DSCR/exposure, never the score', () => {
    const full = calculateScenario(makeCase(), { yieldMultiplier: 1, priceMultiplier: 1, requestedAmount: 100_000_000, termMonths: 12 });
    const half = calculateScenario(makeCase(), { yieldMultiplier: 1, priceMultiplier: 1, requestedAmount: 50_000_000, termMonths: 12 });
    expect(half.score).toBe(full.score);
    expect(half.dscr).toBeGreaterThan(full.dscr);
  });
});
