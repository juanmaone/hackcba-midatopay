// Reference implementation per docs/SATELLITE_MODULE.md §3 ("Vegetation Health Analysis").

import { calculateTrend, mean, std } from './stats.js';

export interface VegetationHealthResult {
  health: 'excellent' | 'good' | 'stressed' | 'critical';
  deviation: number;
  trend: 'improving' | 'stable' | 'declining';
}

export function analyzeVegetationHealth(ndvi: Float32Array, historicalNdvi: Float32Array[]): VegetationHealthResult {
  const currentMean = mean(ndvi);
  const historicalYearMeans = historicalNdvi.map(mean);
  const historicalMean = mean(historicalYearMeans);
  const historicalStd = std(historicalYearMeans);

  // A flat historical record (std = 0) would otherwise divide by zero; treat it as no
  // deviation rather than propagating NaN into the health classification below.
  const deviation = historicalStd === 0 ? 0 : (currentMean - historicalMean) / historicalStd;

  let health: VegetationHealthResult['health'];
  if (deviation > 1) health = 'excellent';
  else if (deviation > 0) health = 'good';
  else if (deviation > -1) health = 'stressed';
  else health = 'critical';

  const recentYears = historicalNdvi.slice(-3);
  const trend = calculateTrend(recentYears.map(mean));

  return { health, deviation, trend };
}
