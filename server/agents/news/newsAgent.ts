import type { AgentInput, NewsAgentResult } from '../../../shared/types/agent.js';
import { buildNewsAlerts, calculateNewsScore } from './newsScoring.js';
import { newsMock } from './newsMock.js';

const GDELT_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';
const RISK_KEYWORDS = ['drought', 'sequía', 'crisis', 'default', 'cesación de pagos'];
const THEME_KEYWORDS = ['sequía', 'exportación', 'cosecha', 'precio', 'clima'];

interface GdeltArticle {
  url: string;
  title: string;
  seendate: string;
  domain: string;
  language: string;
  tone: number;
}

interface GdeltResponse {
  articles: GdeltArticle[];
}

function parseGdeltDate(seendate: string): string {
  // "20260905T120000Z" -> "2026-09-05T12:00:00Z"
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(seendate);
  if (!m) return new Date().toISOString();
  const [, y, mo, d, h, mi, s] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
}

export async function runNewsAgent(input: AgentInput): Promise<NewsAgentResult> {
  try {
    const params = new URLSearchParams({
      query: `agriculture Argentina ${input.field.crop}`,
      mode: 'artlist',
      maxrecords: '50',
      format: 'json',
      sort: 'DateDesc',
    });

    const url = `${GDELT_URL}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GDELT request failed: ${res.status}`);
    const json = (await res.json()) as GdeltResponse;
    const articles = json.articles ?? [];

    const sentiments = articles.map((a) => a.tone / 10);
    const avgSentiment = sentiments.length === 0 ? 0 : Math.round((sentiments.reduce((a, b) => a + b, 0) / sentiments.length) * 100) / 100;
    const positiveShare = sentiments.length === 0 ? 0 : Math.round((sentiments.filter((s) => s > 0).length / sentiments.length) * 100) / 100;
    const negativeShare = sentiments.length === 0 ? 0 : Math.round((sentiments.filter((s) => s < 0).length / sentiments.length) * 100) / 100;

    const topThemes = THEME_KEYWORDS.filter((keyword) => articles.some((a) => a.title.toLowerCase().includes(keyword)));

    const riskEvents = articles
      .filter((a) => a.tone / 10 < -0.3)
      .slice(0, 5)
      .map((a) => ({ title: a.title, sentiment: Math.round((a.tone / 10) * 100) / 100, source: a.domain, date: parseGdeltDate(a.seendate) }));

    const riskKeywordCount = articles.filter((a) => RISK_KEYWORDS.some((k) => a.title.toLowerCase().includes(k))).length;

    const data: NewsAgentResult['data'] = {
      articleCount: articles.length,
      avgSentiment,
      positiveShare,
      negativeShare,
      topThemes,
      riskEvents,
    };

    const score = calculateNewsScore({ avgSentiment, riskKeywordCount });

    return {
      agentId: 'news',
      timestamp: new Date().toISOString(),
      confidence: articles.length > 0 ? 0.75 : 0.4,
      score,
      data,
      metrics: { primary: score, secondary: articles.length, trend: 'stable', volatility: 0.15 },
      alerts: buildNewsAlerts({ avgSentiment, negativeShare, articleCount: articles.length }),
      sources: [{ provider: 'GDELT', endpoint: url, lastUpdated: new Date().toISOString(), reliability: 0.7 }],
    };
  } catch {
    return { ...newsMock, timestamp: new Date().toISOString() };
  }
}
