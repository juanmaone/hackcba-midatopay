import { describe, expect, it } from 'vitest';
import { analyzeVegetationHealth } from './vegetationHealth.js';

const flat = (value: number, length = 5) => new Float32Array(Array(length).fill(value));

describe('analyzeVegetationHealth', () => {
  it('reports excellent health when current NDVI is well above the historical mean', () => {
    const historical = [flat(0.4), flat(0.42), flat(0.38), flat(0.41), flat(0.39)];
    const result = analyzeVegetationHealth(flat(0.6), historical);

    expect(result.health).toBe('excellent');
    expect(result.deviation).toBeGreaterThan(1);
  });

  it('reports critical health when current NDVI is well below the historical mean', () => {
    const historical = [flat(0.4), flat(0.42), flat(0.38), flat(0.41), flat(0.39)];
    const result = analyzeVegetationHealth(flat(0.1), historical);

    expect(result.health).toBe('critical');
    expect(result.deviation).toBeLessThan(-1);
  });

  it('does not throw or return NaN when the historical record is perfectly flat', () => {
    const historical = [flat(0.4), flat(0.4), flat(0.4)];
    const result = analyzeVegetationHealth(flat(0.5), historical);

    expect(Number.isNaN(result.deviation)).toBe(false);
  });

  it('detects an improving trend across the most recent 3 years', () => {
    const historical = [flat(0.3), flat(0.35), flat(0.4), flat(0.45), flat(0.5)];
    const result = analyzeVegetationHealth(flat(0.5), historical);

    expect(result.trend).toBe('improving');
  });
});
