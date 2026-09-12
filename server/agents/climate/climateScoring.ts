// server/agents/climate/climateScoring.ts
// Point deltas per docs/AGENT_SPECIFICATION.md §2 "Scoring Logic". The docs only give deltas, not
// a base value — this plan uses 70 (see plan "Deviations from the docs" #4).
import type { Alert, ClimateAgentResult } from '../../../shared/types/agent.js';

type ClimateData = ClimateAgentResult['data'];

const BASE_SCORE = 70;

export function calculateClimateScore(data: ClimateData): number {
  let score = BASE_SCORE;

  if (data.rainfallAnomaly < -20) score -= 15;
  else if (data.rainfallAnomaly <= -10) score -= 8;

  if (data.consecutiveDryDays > 30) score -= 10;
  if (data.temperatureAnomaly > 2) score -= 5;

  return Math.max(0, Math.min(100, score));
}

export function classifyDroughtRisk(rainfallAnomaly: number): ClimateData['droughtRisk'] {
  if (rainfallAnomaly < -20) return 'high';
  if (rainfallAnomaly <= -10) return 'medium';
  return 'low';
}

export function buildClimateAlerts(data: ClimateData): Alert[] {
  const alerts: Alert[] = [];

  if (data.rainfallAnomaly < -30 || data.consecutiveDryDays > 45) {
    alerts.push({
      level: 'critical',
      message: `Anomalía de lluvia ${data.rainfallAnomaly}% con ${data.consecutiveDryDays} días secos consecutivos`,
      metric: 'rainfallAnomaly',
      value: data.rainfallAnomaly,
      threshold: -30,
      recommendation: 'Evaluar riesgo de sequía severa antes de aprobar el límite solicitado.',
    });
  } else if (data.rainfallAnomaly < -15 || data.consecutiveDryDays > 20) {
    alerts.push({
      level: 'warning',
      message: `Anomalía de lluvia ${data.rainfallAnomaly}% por debajo de lo normal`,
      metric: 'rainfallAnomaly',
      value: data.rainfallAnomaly,
      threshold: -15,
      recommendation: 'Monitorear la evolución de las próximas semanas.',
    });
  }

  return alerts;
}
