import type { NewsAgentResult } from '../../../shared/types/agent.js';
import { buildNewsAlerts, calculateNewsScore } from './newsScoring.js';

const data: NewsAgentResult['data'] = {
  articleCount: 45,
  avgSentiment: -0.15,
  positiveShare: 0.35,
  negativeShare: 0.4,
  topThemes: ['sequía', 'exportación'],
  riskEvents: [],
};

export const newsMock: NewsAgentResult = {
  agentId: 'news',
  timestamp: new Date().toISOString(),
  confidence: 0.6,
  score: calculateNewsScore({ avgSentiment: data.avgSentiment, riskKeywordCount: 0 }),
  data,
  metrics: { primary: calculateNewsScore({ avgSentiment: data.avgSentiment, riskKeywordCount: 0 }), secondary: data.articleCount, trend: 'stable', volatility: 0.15 },
  alerts: buildNewsAlerts({ avgSentiment: data.avgSentiment, negativeShare: data.negativeShare, articleCount: data.articleCount }),
  sources: [{ provider: 'Mock', endpoint: 'mock', lastUpdated: new Date().toISOString(), reliability: 1.0 }],
};
