// Composite drought index. Weights and normalization ranges per docs/SATELLITE_MODULE.md §2
// ("Drought Index (Compuesto)"): 0 = severe drought, 1 = optimal (see shared/types/satellite.ts).

function mean(values: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < values.length; i++) sum += values[i];
  return values.length === 0 ? 0 : sum / values.length;
}

export function calculateDroughtIndex(ndvi: Float32Array, ndwi: Float32Array, precipitationAnomaly: number): number {
  const ndviWeight = 0.4;
  const ndwiWeight = 0.35;
  const precipWeight = 0.25;

  // NDVI typical range -0.1 to 0.8 -> normalize to 0-1
  const ndviNormalized = Math.max(0, Math.min(1, (mean(ndvi) + 0.1) / 0.9));
  // NDWI typical range -0.5 to 0.5 -> normalize to 0-1
  const ndwiNormalized = Math.max(0, Math.min(1, (mean(ndwi) + 0.5) / 1.0));
  // Precipitation anomaly -50% to +50% -> normalize to 0-1
  const precipNormalized = Math.max(0, Math.min(1, (precipitationAnomaly + 50) / 100));

  return ndviNormalized * ndviWeight + ndwiNormalized * ndwiWeight + precipNormalized * precipWeight;
}
