// server/agents/news/newsAgent.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculateNewsScore, buildNewsAlerts } from './newsScoring.js';
import { newsMock } from './newsMock.js';
import { runNewsAgent } from './newsAgent.js';

describe('calculateNewsScore', () => {
  it('rewards clearly positive sentiment', () => {
    expect(calculateNewsScore({ avgSentiment: 0.5, riskKeywordCount: 0 })).toBe(60); // 50 + 10
  });

  it('penalizes clearly negative sentiment and caps keyword penalties at -20', () => {
    expect(calculateNewsScore({ avgSentiment: -0.4, riskKeywordCount: 10 })).toBe(20); // 50 - 10 - 20 (capped)
  });
});

describe('buildNewsAlerts', () => {
  it('produces a critical alert for very negative sentiment', () => {
    const alerts = buildNewsAlerts({ avgSentiment: -0.6, negativeShare: 0.3, articleCount: 50 });
    expect(alerts.some((a) => a.level === 'critical')).toBe(true);
  });
});

describe('runNewsAgent', () => {
  const input = {
    caseId: 'AG-test',
    applicant: { cuit: '30-71284539-9', name: 'Test' },
    field: { lat: -32.69, lng: -62.1, hectares: 300, crop: 'maiz', campaign: '2026/27' },
    loan: { requestedAmount: 100_000_000, termMonths: 12 },
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses a successful GDELT response into NewsAgentResult', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          articles: [
            { url: 'https://a.com/1', title: 'Buena cosecha de maíz en Córdoba', seendate: '20260901T120000Z', domain: 'a.com', language: 'Spanish', tone: 3.2 },
            { url: 'https://a.com/2', title: 'Sequía preocupa a productores', seendate: '20260905T120000Z', domain: 'a.com', language: 'Spanish', tone: -4.1 },
          ],
        }),
      })),
    );

    const result = await runNewsAgent(input);

    expect(result.agentId).toBe('news');
    expect(result.data.articleCount).toBe(2);
    expect(result.sources[0].provider).toBe('GDELT');
  });

  it('falls back to the mock when the fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })),
    );

    const result = await runNewsAgent(input);

    expect(result.data).toEqual(newsMock.data);
  });
});
