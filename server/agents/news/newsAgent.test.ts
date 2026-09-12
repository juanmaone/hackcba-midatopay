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

  it('parses a successful GDELT response without tone field (real API)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          articles: [
            { url: 'https://a.com/1', title: 'Buena cosecha de maíz en Córdoba', seendate: '20260901T120000Z', domain: 'a.com', language: 'Spanish' },
            { url: 'https://a.com/2', title: 'Sequía preocupa a productores', seendate: '20260905T120000Z', domain: 'a.com', language: 'Spanish' },
          ],
        }),
      })),
    );

    const result = await runNewsAgent(input);

    expect(result.agentId).toBe('news');
    expect(result.data.articleCount).toBe(2);
    expect(result.data.avgSentiment).toBe(0);
    expect(result.data.positiveShare).toBe(0);
    expect(result.data.negativeShare).toBe(0);
    expect(result.confidence).toBe(0.4);
    expect(result.sources[0].provider).toBe('GDELT');
  });

  it('computes sentiment only from articles with tone field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          articles: [
            { url: 'https://a.com/1', title: 'Buena cosecha', seendate: '20260901T120000Z', domain: 'a.com', language: 'Spanish', tone: 3.2 },
            { url: 'https://a.com/2', title: 'Sequía preocupa', seendate: '20260905T120000Z', domain: 'a.com', language: 'Spanish' },
            { url: 'https://a.com/3', title: 'Crisis agrícola', seendate: '20260903T120000Z', domain: 'a.com', language: 'Spanish', tone: -4.1 },
          ],
        }),
      })),
    );

    const result = await runNewsAgent(input);

    expect(result.data.articleCount).toBe(3);
    // Only 2 articles have tone: (3.2 - 4.1) / 2 / 10 = -0.045, rounds to -0.04
    expect(result.data.avgSentiment).toBe(-0.04);
    expect(result.data.positiveShare).toBe(0.5);
    expect(result.data.negativeShare).toBe(0.5);
    expect(result.confidence).toBe(0.75);
  });

  it('defaults sentiment to zero when no articles have tone', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          articles: [
            { url: 'https://a.com/1', title: 'Noticia 1', seendate: '20260901T120000Z', domain: 'a.com', language: 'Spanish' },
            { url: 'https://a.com/2', title: 'Noticia 2', seendate: '20260902T120000Z', domain: 'a.com', language: 'Spanish' },
          ],
        }),
      })),
    );

    const result = await runNewsAgent(input);

    expect(result.data.articleCount).toBe(2);
    expect(result.data.avgSentiment).toBe(0);
    expect(result.data.positiveShare).toBe(0);
    expect(result.data.negativeShare).toBe(0);
    expect(result.confidence).toBe(0.4);
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
