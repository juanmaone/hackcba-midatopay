// EVI (Enhanced Vegetation Index). Formula and scale factor per docs/TRACK_B_PLAN.md §4
// Tarea 7: EVI = 2.5 * (B08 - B04) / (B08 + 6*B04 - 7.5*B02 + 1).

export function calculateEVI(nir: Uint16Array, red: Uint16Array, blue: Uint16Array): Float32Array {
  const evi = new Float32Array(nir.length);

  for (let i = 0; i < nir.length; i++) {
    const nirVal = nir[i] / 10000;
    const redVal = red[i] / 10000;
    const blueVal = blue[i] / 10000;

    const denominator = nirVal + 6 * redVal - 7.5 * blueVal + 1;
    evi[i] = denominator === 0 ? 0 : (2.5 * (nirVal - redVal)) / denominator;
  }

  return evi;
}
