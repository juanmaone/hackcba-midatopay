import type { VegetationAnalysis } from '../../../shared/types/satellite.js';

export const mockSatelliteAnalysis: VegetationAnalysis = {
  ndvi: {
    name: 'NDVI',
    values: new Float32Array([0.65, 0.72, 0.68, 0.71, 0.69]),
    metadata: { min: 0.65, max: 0.72, mean: 0.69, std: 0.03, timestamp: new Date().toISOString() },
  },
  ndwi: {
    name: 'NDWI',
    values: new Float32Array([0.12, 0.15, 0.11, 0.14, 0.13]),
    metadata: { min: 0.11, max: 0.15, mean: 0.13, std: 0.02, timestamp: new Date().toISOString() },
  },
  evi: {
    name: 'EVI',
    values: new Float32Array([0.45, 0.52, 0.48, 0.51, 0.49]),
    metadata: { min: 0.45, max: 0.52, mean: 0.49, std: 0.03, timestamp: new Date().toISOString() },
  },
  droughtIndex: 0.78,
  vegetationHealth: 'good',
  moistureStatus: 'adequate',
  cropStage: 'vegetative',
  alerts: [],
  confidence: 0.92,
};

export const mockDroughtAnalysis: VegetationAnalysis = {
  ...mockSatelliteAnalysis,
  ndvi: {
    ...mockSatelliteAnalysis.ndvi,
    values: new Float32Array([0.35, 0.42, 0.38, 0.41, 0.39]),
    metadata: { min: 0.35, max: 0.42, mean: 0.39, std: 0.03, timestamp: new Date().toISOString() },
  },
  droughtIndex: 0.32,
  vegetationHealth: 'stressed',
  moistureStatus: 'deficient',
  alerts: [
    {
      type: 'moisture_stress',
      severity: 'high',
      message: 'Significant moisture stress detected across 65% of field',
      affectedArea: 65,
      recommendation: 'Irrigation recommended within 48 hours',
    },
  ],
  confidence: 0.88,
};
