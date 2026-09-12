import { describe, expect, it } from 'vitest';
import { calculateDroughtIndex } from './droughtIndex.js';
import { calculateNDVI } from './ndvi.js';
import { calculateNDWI } from './ndwi.js';

describe('calculateDroughtIndex', () => {
  it('returns a value in [0, 1] for a healthy field with normal rainfall', () => {
    const ndvi = calculateNDVI(new Uint16Array([4000, 4200]), new Uint16Array([800, 750]));
    const ndwi = calculateNDWI(new Uint16Array([1200, 1300]), new Uint16Array([4000, 4200]));

    const droughtIndex = calculateDroughtIndex(ndvi, ndwi, 0);

    expect(droughtIndex).toBeGreaterThanOrEqual(0);
    expect(droughtIndex).toBeLessThanOrEqual(1);
  });

  it('returns a lower value for a stressed field than a healthy one, same precipitation', () => {
    const healthyNdvi = calculateNDVI(new Uint16Array([4000]), new Uint16Array([800]));
    const healthyNdwi = calculateNDWI(new Uint16Array([1200]), new Uint16Array([4000]));
    const stressedNdvi = calculateNDVI(new Uint16Array([1800]), new Uint16Array([1600]));
    const stressedNdwi = calculateNDWI(new Uint16Array([600]), new Uint16Array([1800]));

    const healthy = calculateDroughtIndex(healthyNdvi, healthyNdwi, 0);
    const stressed = calculateDroughtIndex(stressedNdvi, stressedNdwi, 0);

    expect(stressed).toBeLessThan(healthy);
  });

  it('clamps extreme normalized inputs into [0, 1]', () => {
    const extremeNdvi = new Float32Array([-1]);
    const extremeNdwi = new Float32Array([-1]);
    const droughtIndex = calculateDroughtIndex(extremeNdvi, extremeNdwi, -100);

    expect(droughtIndex).toBeGreaterThanOrEqual(0);
    expect(droughtIndex).toBeLessThanOrEqual(1);
  });
});
