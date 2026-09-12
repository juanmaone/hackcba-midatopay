// NDWI (Normalized Difference Water Index). Formula and scale factor per
// docs/SATELLITE_MODULE.md §2.

export function calculateNDWI(green: Uint16Array, nir: Uint16Array): Float32Array {
  const ndwi = new Float32Array(green.length);

  for (let i = 0; i < green.length; i++) {
    const greenVal = green[i] / 10000;
    const nirVal = nir[i] / 10000;

    const denominator = greenVal + nirVal;
    ndwi[i] = denominator === 0 ? 0 : (greenVal - nirVal) / denominator;
  }

  return ndwi;
}

export function classifyNDWI(ndwi: number): string {
  if (ndwi > 0.3) return 'water_body';
  if (ndwi > 0.1) return 'high_moisture';
  if (ndwi > -0.1) return 'adequate_moisture';
  if (ndwi > -0.3) return 'moisture_stress';
  return 'severe_stress';
}
