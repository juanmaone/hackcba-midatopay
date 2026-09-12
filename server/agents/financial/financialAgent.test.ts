import { describe, expect, it } from 'vitest';
import { runFinancialAgent } from './financialAgent.js';

describe('runFinancialAgent', () => {
  it('returns the mock result with agentId financial and score 61', async () => {
    const result = await runFinancialAgent({
      caseId: 'AG-test',
      applicant: { cuit: '30-71284539-9', name: 'Test' },
      field: { lat: -32.69, lng: -62.1, hectares: 300, crop: 'maiz', campaign: '2026/27' },
      loan: { requestedAmount: 100_000_000, termMonths: 12 },
    });

    expect(result.agentId).toBe('financial');
    expect(result.score).toBe(61);
    expect(result.data.delinquencyStatus).toBe(1);
    expect(result.alerts).toEqual([]);
  });

  it('stamps a fresh ISO timestamp on every call', async () => {
    const before = Date.now();
    const result = await runFinancialAgent({
      caseId: 'AG-test',
      applicant: { cuit: '30-71284539-9', name: 'Test' },
      field: { lat: -32.69, lng: -62.1, hectares: 300, crop: 'maiz', campaign: '2026/27' },
      loan: { requestedAmount: 100_000_000, termMonths: 12 },
    });
    expect(new Date(result.timestamp).getTime()).toBeGreaterThanOrEqual(before);
  });
});
