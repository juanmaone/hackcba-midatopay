// Small stats helpers shared by the analysis modules. Not defined in docs/SATELLITE_MODULE.md's
// reference snippets (it calls mean/std/calculateTrend without showing them) — implemented here
// so vegetationHealth.ts and moistureStress.ts don't each reinvent them.

export function mean(values: Float32Array | number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < values.length; i++) sum += values[i];
  return sum / values.length;
}

export function std(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// Small deltas between years are noise, not a real trend — hence the threshold rather than
// reacting to any nonzero slope.
const TREND_THRESHOLD = 0.02;

export function calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' {
  if (values.length < 2) return 'stable';
  const delta = values[values.length - 1] - values[0];
  if (delta > TREND_THRESHOLD) return 'improving';
  if (delta < -TREND_THRESHOLD) return 'declining';
  return 'stable';
}
