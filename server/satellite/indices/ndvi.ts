// NDVI (Normalized Difference Vegetation Index). Formula and scale factor per
// docs/SATELLITE_MODULE.md §2.

export function calculateNDVI(nir: Uint16Array, red: Uint16Array): Float32Array {
  const ndvi = new Float32Array(nir.length);

  for (let i = 0; i < nir.length; i++) {
    const nirVal = nir[i] / 10000;
    const redVal = red[i] / 10000;

    const denominator = nirVal + redVal;
    ndvi[i] = denominator === 0 ? 0 : (nirVal - redVal) / denominator;
  }

  return ndvi;
}

export function classifyNDVI(ndvi: number): string {
  if (ndvi < 0) return 'water';
  if (ndvi < 0.1) return 'bare_soil';
  if (ndvi < 0.2) return 'sparse_vegetation';
  if (ndvi < 0.4) return 'moderate_vegetation';
  if (ndvi < 0.6) return 'dense_vegetation';
  return 'very_dense_vegetation';
}
