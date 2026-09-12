// server/agents/index.test.ts
import { describe, expect, it } from 'vitest';
import { runAllAgents } from './index.js';

const input = {
  caseId: 'AG-test',
  applicant: { cuit: '30-71284539-9', name: 'Test' },
  field: { lat: -32.69, lng: -62.1, hectares: 300, crop: 'maiz', campaign: '2026/27' },
  loan: { requestedAmount: 100_000_000, termMonths: 12 },
};

describe('runAllAgents', () => {
  it('returns all 5 agent results keyed by agentId', async () => {
    const result = await runAllAgents(input);

    expect(result.financial.agentId).toBe('financial');
    expect(result.climate.agentId).toBe('climate');
    expect(result.yield.agentId).toBe('yield');
    expect(result.soil.agentId).toBe('soil');
    expect(result.news.agentId).toBe('news');
  }, 90000);

  it('calls onAgentComplete once per agent as each resolves', async () => {
    const completed: string[] = [];
    await runAllAgents(input, (result) => completed.push(result.agentId));

    expect(completed.sort()).toEqual(['climate', 'financial', 'news', 'soil', 'yield']);
  }, 90000);
});
