// server/agents/yield/yieldScoring.ts
// Point deltas per docs/AGENT_SPECIFICATION.md §3 "Scoring Logic" that this mock-only agent can
// actually produce (yieldVolatility, droughtYears — expectedYield-vs-regional-average and
// positive-trend deltas need real historical data this build doesn't have, so they're omitted
// rather than faked). Base 70, see plan "Deviations from the docs" #4.
const BASE_SCORE = 70;

export function calculateYieldScore(input: { yieldVolatility: number; droughtYears: number }): number {
  let score = BASE_SCORE;

  if (input.yieldVolatility > 25) score -= 12;
  if (input.droughtYears >= 2) score -= 10;

  return Math.max(0, Math.min(100, score));
}
