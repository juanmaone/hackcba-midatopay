// Unlike vegetationHealth.ts/moistureStress.ts, docs/SATELLITE_MODULE.md has no reference
// implementation for crop stage detection. NDVI alone can't reliably separate flowering from
// grain_fill (both read as sustained high NDVI), so this also takes days since planting —
// thresholds follow typical maize phenology (the crop in the demo case, docs/TRACK_B_PLAN.md).

import type { CropStage } from '../../../shared/types/satellite.js';
import { mean } from './stats.js';

export function detectCropStage(ndvi: Float32Array, daysSincePlanting: number): CropStage {
  const ndviMean = mean(ndvi);

  if (daysSincePlanting < 15) return 'planting';
  // NDVI only disambiguates within the first ~60 days (a slow-starting planting vs. an
  // already-greening canopy) — beyond that, days since planting alone drives the stage, since
  // NDVI naturally falls again during grain fill/harvest and would otherwise loop back here.
  if (daysSincePlanting < 60) return ndviMean < 0.3 ? 'planting' : 'vegetative';
  if (daysSincePlanting < 90) return 'flowering';
  if (daysSincePlanting < 130) return 'grain_fill';
  return 'harvest';
}
