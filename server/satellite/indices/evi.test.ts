import { describe, expect, it } from 'vitest';
import { calculateEVI } from './evi.js';

describe('calculateEVI', () => {
  it('returns values in [-1, 1] for typical Sentinel-2 reflectance', () => {
    const nir = new Uint16Array([4000, 3500, 5000]);
    const red = new Uint16Array([800, 1200, 400]);
    const blue = new Uint16Array([400, 600, 300]);

    const evi = calculateEVI(nir, red, blue);

    expect(evi).toHaveLength(3);
    for (const value of evi) {
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
    const nirVal = 4000 / 10000;
    const redVal = 800 / 10000;
    const blueVal = 400 / 10000;
    const expected = (2.5 * (nirVal - redVal)) / (nirVal + 6 * redVal - 7.5 * blueVal + 1);
    expect(evi[0]).toBeCloseTo(expected, 5);
  });

  it('returns 0 instead of NaN when the denominator is 0', () => {
    // nir + 6*red - 7.5*blue + 1 = 0  =>  nir=0, red=0, blue=1/7.5 (scaled: blue=10000/7.5)
    const evi = calculateEVI(new Uint16Array([0]), new Uint16Array([0]), new Uint16Array([Math.round(10000 / 7.5)]));
    expect(evi[0]).toBe(0);
  });
});
