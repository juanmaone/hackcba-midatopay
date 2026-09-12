// Contrato compartido del modulo satelital. Ver docs/SATELLITE_MODULE.md.

export interface SatelliteImage {
  id: string;
  date: string; // ISO 8601
  bbox: [number, number, number, number]; // [west, south, east, north]
  cloudCover: number; // 0-100%
  bands: {
    B02: Uint16Array; // Blue (10m)
    B03: Uint16Array; // Green (10m)
    B04: Uint16Array; // Red (10m)
    B08: Uint16Array; // NIR (10m)
    B8A: Uint16Array; // Narrow NIR (20m)
    B11: Uint16Array; // SWIR (20m)
  };
}

export interface SpectralIndexMetadata {
  min: number;
  max: number;
  mean: number;
  std: number;
  timestamp: string;
}

export interface SpectralIndex {
  name: string; // e.g. "NDVI"
  values: Float32Array; // -1 a 1
  metadata: SpectralIndexMetadata;
}

export type VegetationHealth = 'excellent' | 'good' | 'stressed' | 'critical';
export type MoistureStatus = 'optimal' | 'adequate' | 'deficient' | 'critical';
export type CropStage = 'planting' | 'vegetative' | 'flowering' | 'grain_fill' | 'harvest';

export interface SatelliteAlert {
  type: 'vegetation_decline' | 'moisture_stress' | 'drought_detected' | 'frost_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedArea: number; // % del campo
  recommendation: string;
}

export interface VegetationAnalysis {
  ndvi: SpectralIndex;
  ndwi: SpectralIndex;
  evi: SpectralIndex;
  droughtIndex: number; // 0-1 (0 = sequia severa, 1 = optimo)
  vegetationHealth: VegetationHealth;
  moistureStatus: MoistureStatus;
  cropStage: CropStage;
  alerts: SatelliteAlert[];
  confidence: number; // 0-1
}

export interface FieldWithSatellite {
  caseId: string;
  field: {
    lat: number;
    lng: number;
    hectares: number;
    polygon: Array<[number, number]>;
  };
  satellite: VegetationAnalysis;
  lastImageDate: string;
  imageCount: number;
}
