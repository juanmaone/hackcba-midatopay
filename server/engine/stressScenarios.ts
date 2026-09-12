// server/engine/stressScenarios.ts
// Multipliers per docs/AGENT_SPECIFICATION.md "Stress Scenarios" table. Score/risk formulas are
// this plan's own (undocumented in the source docs) — see plan "Deviations from the docs" #5.
import type { RiskSynthesisInput, ScenarioKey } from '../../shared/types/agent.js';
import type { ScenarioResult } from '../../shared/types/assessment.js';
import { calculateRecommendedExposure } from './riskSynthesis.js';

const PRICE_PER_TON_ARS = 178_000;

const SCENARIO_MULTIPLIERS: Record<ScenarioKey, { yieldMultiplier: number; priceMultiplier: number }> = {
  base: { yieldMultiplier: 1.0, priceMultiplier: 1.0 },
  drought: { yieldMultiplier: 0.7, priceMultiplier: 1.0 },
  price: { yieldMultiplier: 1.0, priceMultiplier: 0.8 },
  combined: { yieldMultiplier: 0.7, priceMultiplier: 0.8 },
};

function classifyRisk(dscr: number): ScenarioResult['risk'] {
  if (dscr >= 1.5) return 'low';
  if (dscr >= 1.0) return 'medium';
  return 'high';
}

export function calculateStressScenarios(input: RiskSynthesisInput, agroScore: number): Record<ScenarioKey, ScenarioResult> {
  const { field, loan, yield: yieldAgent } = input;
  const baseRevenue = field.hectares * yieldAgent.data.expectedYield * PRICE_PER_TON_ARS;
  const operatingCost = baseRevenue * 0.65;
  const debtService = (loan.requestedAmount / loan.termMonths) * 12;

  const result = {} as Record<ScenarioKey, ScenarioResult>;

  for (const key of Object.keys(SCENARIO_MULTIPLIERS) as ScenarioKey[]) {
    const { yieldMultiplier, priceMultiplier } = SCENARIO_MULTIPLIERS[key];
    const stressRevenue = field.hectares * yieldAgent.data.expectedYield * yieldMultiplier * PRICE_PER_TON_ARS * priceMultiplier;
    const dscr = Math.round(((stressRevenue - operatingCost) / debtService) * 100) / 100;
    const exposure = calculateRecommendedExposure(loan.requestedAmount, dscr);
    const score = Math.max(0, Math.min(100, Math.round(agroScore * yieldMultiplier * priceMultiplier)));

    result[key] = { score, exposure, dscr, risk: classifyRisk(dscr) };
  }

  return result;
}
