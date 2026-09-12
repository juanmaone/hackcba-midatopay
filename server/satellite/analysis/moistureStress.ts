// Reference implementation per docs/SATELLITE_MODULE.md §3 ("Moisture Stress Analysis").

import { mean } from './stats.js';

export interface MoistureStressResult {
  status: 'optimal' | 'adequate' | 'deficient' | 'critical';
  stressLevel: number;
  riskAreas: number;
}

export function analyzeMoistureStress(ndwi: Float32Array, soilMoisture: number, rainfallAnomaly: number): MoistureStressResult {
  const ndwiMean = mean(ndwi);

  const ndwiScore = (ndwiMean + 0.5) / 1.0;
  const soilScore = soilMoisture;
  const rainScore = Math.max(0, Math.min(1, (rainfallAnomaly + 50) / 100));

  const stressLevel = 1 - (ndwiScore * 0.4 + soilScore * 0.35 + rainScore * 0.25);

  const riskPixels = ndwi.filter((v) => v < -0.1).length;
  const riskAreas = (riskPixels / ndwi.length) * 100;

  let status: MoistureStressResult['status'];
  if (stressLevel < 0.2) status = 'optimal';
  else if (stressLevel < 0.4) status = 'adequate';
  else if (stressLevel < 0.6) status = 'deficient';
  else status = 'critical';

  return { status, stressLevel, riskAreas };
}
