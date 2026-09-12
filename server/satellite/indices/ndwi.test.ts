import { describe, expect, it } from 'vitest';
import { calculateNDWI, classifyNDWI } from './ndwi.js';

describe('calculateNDWI', () => {
  it('returns values in [-1, 1] for typical Sentinel-2 reflectance', () => {
    const green = new Uint16Array([1200, 900, 1500]);
    const nir = new Uint16Array([4000, 3500, 5000]);

    const ndwi = calculateNDWI(green, nir);

    expect(ndwi).toHaveLength(3);
    for (const value of ndwi) {
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
    expect(ndwi[0]).toBeCloseTo((1200 - 4000) / (1200 + 4000), 5);
  });

  it('returns 0 instead of NaN when both bands are 0', () => {
    const ndwi = calculateNDWI(new Uint16Array([0]), new Uint16Array([0]));
    expect(ndwi[0]).toBe(0);
  });
});

describe('classifyNDWI', () => {
  it('classifies across the documented thresholds', () => {
    expect(classifyNDWI(0.4)).toBe('water_body');
    expect(classifyNDWI(0.2)).toBe('high_moisture');
    expect(classifyNDWI(0)).toBe('adequate_moisture');
    expect(classifyNDWI(-0.2)).toBe('moisture_stress');
    expect(classifyNDWI(-0.4)).toBe('severe_stress');
  });
});
