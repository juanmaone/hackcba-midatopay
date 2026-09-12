import { describe, expect, it } from 'vitest';
import { detectCropStage } from './cropGrowth.js';

const flat = (value: number) => new Float32Array([value, value, value]);

describe('detectCropStage', () => {
  it('detects planting for low NDVI shortly after planting', () => {
    expect(detectCropStage(flat(0.15), 5)).toBe('planting');
  });

  it('detects vegetative for rising NDVI mid-season', () => {
    expect(detectCropStage(flat(0.45), 40)).toBe('vegetative');
  });

  it('detects flowering for high NDVI around 70 days', () => {
    expect(detectCropStage(flat(0.65), 70)).toBe('flowering');
  });

  it('detects grain_fill for sustained high NDVI around 100 days', () => {
    expect(detectCropStage(flat(0.7), 100)).toBe('grain_fill');
  });

  it('detects harvest late in the season', () => {
    expect(detectCropStage(flat(0.4), 140)).toBe('harvest');
  });
});
