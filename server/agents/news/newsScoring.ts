// server/agents/news/newsScoring.ts
// Point deltas per docs/AGENT_SPECIFICATION.md §5 "Scoring Logic". Base 50 — the docs explicitly
// say news's primary metric is "0-100, 50=neutral". Keyword penalty capped at -20, mirroring the
// financial agent's "-5 each, max -20" pattern for rejected checks.
import type { Alert } from '../../../shared/types/agent.js';

const BASE_SCORE = 50;

export function calculateNewsScore(input: { avgSentiment: number; riskKeywordCount: number }): number {
  let score = BASE_SCORE;

  if (input.avgSentiment > 0.3) score += 10;
  else if (input.avgSentiment < -0.3) score -= 10;

  score -= Math.min(20, input.riskKeywordCount * 5);

  return Math.max(0, Math.min(100, score));
}

export function buildNewsAlerts(input: { avgSentiment: number; negativeShare: number; articleCount: number }): Alert[] {
  const alerts: Alert[] = [];

  if (input.avgSentiment < -0.5 || (input.articleCount > 200 && input.negativeShare > 0.5)) {
    alerts.push({
      level: 'critical',
      message: `Sentimiento promedio ${input.avgSentiment.toFixed(2)} en noticias agropecuarias`,
      metric: 'avgSentiment',
      value: input.avgSentiment,
      threshold: -0.5,
      recommendation: 'Revisar eventos de riesgo recientes antes de decidir.',
    });
  } else if (input.avgSentiment < -0.2 || input.negativeShare > 0.6) {
    alerts.push({
      level: 'warning',
      message: `Sentimiento negativo (${(input.negativeShare * 100).toFixed(0)}% de artículos) en noticias agropecuarias`,
      metric: 'negativeShare',
      value: input.negativeShare,
      threshold: 0.6,
      recommendation: 'Monitorear cobertura de noticias en las próximas semanas.',
    });
  }

  return alerts;
}
