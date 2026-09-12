import { describe, expect, it } from 'vitest';
import { calculateNDVI, classifyNDVI } from './ndvi.js';

describe('calculateNDVI', () => {
  it('returns values in [-1, 1] for typical Sentinel-2 reflectance', () => {
    const nir = new Uint16Array([4000, 3500, 5000]);
    const red = new Uint16Array([800, 1200, 400]);

    const ndvi = calculateNDVI(nir, red);

    expect(ndvi).toHaveLength(3);
    for (const value of ndvi) {
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
    expect(ndvi[0]).toBeCloseTo((4000 - 800) / (4000 + 800), 5);
  });

  it('returns 0 instead of NaN when both bands are 0', () => {
    const ndvi = calculateNDVI(new Uint16Array([0]), new Uint16Array([0]));
    expect(ndvi[0]).toBe(0);
  });
});

describe('classifyNDVI', () => {
  it('classifies across the documented thresholds', () => {
    expect(classifyNDVI(-0.2)).toBe('water');
    expect(classifyNDVI(0.05)).toBe('bare_soil');
    expect(classifyNDVI(0.15)).toBe('sparse_vegetation');
    expect(classifyNDVI(0.3)).toBe('moderate_vegetation');
    expect(classifyNDVI(0.5)).toBe('dense_vegetation');
    expect(classifyNDVI(0.8)).toBe('very_dense_vegetation');
  });
});
