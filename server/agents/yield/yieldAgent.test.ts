// server/agents/yield/yieldAgent.test.ts
import { describe, expect, it } from 'vitest';
import { calculateYieldScore } from './yieldScoring.js';
import { runYieldAgent } from './yieldAgent.js';

describe('calculateYieldScore', () => {
  it('applies no penalty for low volatility and no drought years', () => {
    expect(calculateYieldScore({ yieldVolatility: 15, droughtYears: 1 })).toBe(70);
  });

  it('penalizes high volatility and repeated drought years', () => {
    expect(calculateYieldScore({ yieldVolatility: 30, droughtYears: 3 })).toBe(48); // 70 - 12 - 10
  });
});

describe('runYieldAgent', () => {
  it('looks up maiz in MAGYP_DATA and returns a consistent AgentResult', async () => {
    const result = await runYieldAgent({
      caseId: 'AG-test',
      applicant: { cuit: '30-71284539-9', name: 'Test' },
      field: { lat: -32.69, lng: -62.1, hectares: 300, crop: 'maiz', campaign: '2026/27' },
      loan: { requestedAmount: 100_000_000, termMonths: 12 },
    });

    expect(result.agentId).toBe('yield');
    expect(result.data.cropType).toBe('maiz');
    expect(result.data.region).toBe('Cordoba');
    expect(result.data.expectedYield).toBe(8.2);
    expect(result.data.stressYield).toBeCloseTo(8.2 * 0.7, 5);
    expect(result.sources[0].provider).toBe('MAGyP');
  });

  it('falls back to a generic regional default for an unknown crop', async () => {
    const result = await runYieldAgent({
      caseId: 'AG-test',
      applicant: { cuit: '30-71284539-9', name: 'Test' },
      field: { lat: -32.69, lng: -62.1, hectares: 300, crop: 'girasol', campaign: '2026/27' },
      loan: { requestedAmount: 100_000_000, termMonths: 12 },
    });

    expect(result.data.cropType).toBe('girasol');
    expect(result.data.expectedYield).toBeGreaterThan(0);
  });
});
