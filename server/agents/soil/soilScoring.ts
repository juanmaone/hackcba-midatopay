// Point deltas per docs/AGENT_SPECIFICATION.md §4 "Scoring Logic". Base 70, see plan
// "Deviations from the docs" #4. textureClass/drainageClass have no formula in the docs — simple
// documented heuristics from clay/sand content.
import type { Alert, SoilAgentResult } from '../../../shared/types/agent.js';

type SoilCore = { ph: number; organicCarbon: number; clayContent: number; sandContent: number };

const BASE_SCORE = 70;

export function calculateSoilScore(soil: SoilCore): number {
  let score = BASE_SCORE;

  if (soil.ph >= 6.0 && soil.ph <= 7.0) score += 10;
  else if (soil.ph < 5.5 || soil.ph > 7.5) score -= 10;

  if (soil.organicCarbon > 15) score += 8;
  else if (soil.organicCarbon < 5) score -= 8;

  return Math.max(0, Math.min(100, score));
}

export function classifyTexture(clayContent: number, sandContent: number): SoilAgentResult['data']['textureClass'] {
  if (clayContent >= 40) return 'Clay';
  if (clayContent >= 27) return 'Clay Loam';
  if (sandContent >= 70) return 'Sandy';
  return 'Loam';
}

export function classifyDrainage(sandContent: number): SoilAgentResult['data']['drainageClass'] {
  if (sandContent >= 50) return 'Bien drenado';
  if (sandContent >= 30) return 'Moderadamente drenado';
  return 'Pobremente drenado';
}

export function buildSoilAlerts(soil: SoilCore): Alert[] {
  const alerts: Alert[] = [];

  if (soil.ph < 4.5 || soil.ph > 8.5 || soil.organicCarbon < 3) {
    alerts.push({
      level: 'critical',
      message: `pH ${soil.ph} / carbono orgánico ${soil.organicCarbon} g/kg fuera de rango seguro`,
      metric: 'ph',
      value: soil.ph,
      threshold: soil.ph < 4.5 ? 4.5 : 8.5,
      recommendation: 'Recomendar análisis de suelo detallado antes de aprobar.',
    });
  } else if (soil.ph < 5.0 || soil.ph > 8.0 || soil.organicCarbon < 8) {
    alerts.push({
      level: 'warning',
      message: `pH ${soil.ph} / carbono orgánico ${soil.organicCarbon} g/kg subóptimo`,
      metric: 'ph',
      value: soil.ph,
      threshold: soil.ph < 5.0 ? 5.0 : 8.0,
      recommendation: 'Considerar enmienda de suelo en la próxima campaña.',
    });
  }

  return alerts;
}
