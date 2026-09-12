import { describe, expect, it } from 'vitest';
import { analyzeMoistureStress } from './moistureStress.js';

describe('analyzeMoistureStress', () => {
  it('reports optimal status for high NDWI, high soil moisture, and normal rainfall', () => {
    const ndwi = new Float32Array([0.4, 0.45, 0.42]);
    const result = analyzeMoistureStress(ndwi, 0.9, 10);

    expect(result.status).toBe('optimal');
    expect(result.stressLevel).toBeGreaterThanOrEqual(0);
    expect(result.stressLevel).toBeLessThanOrEqual(1);
    expect(result.riskAreas).toBe(0);
  });

  it('reports critical status for low NDWI, low soil moisture, and a rainfall deficit', () => {
    const ndwi = new Float32Array([-0.4, -0.35, -0.3]);
    const result = analyzeMoistureStress(ndwi, 0.1, -40);

    expect(result.status).toBe('critical');
    expect(result.riskAreas).toBe(100);
  });

  it('computes riskAreas as the percentage of pixels below the -0.1 NDWI threshold', () => {
    const ndwi = new Float32Array([0.2, -0.2, 0.3, -0.15]);
    const result = analyzeMoistureStress(ndwi, 0.5, 0);

    expect(result.riskAreas).toBe(50);
  });
});
