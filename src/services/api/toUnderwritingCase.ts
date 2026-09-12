import type { AssessmentResponse } from '../../../shared/types';
import type { ScenarioKey, StressScenario, UnderwritingCase } from '../../types/underwriting';

const SCENARIO_ORDER: ScenarioKey[] = ['base', 'drought', 'price', 'combined'];

const SCENARIO_COPY: Record<ScenarioKey, { label: string; shortLabel: string }> = {
  base: { label: 'BASE CASE', shortLabel: 'Base' },
  drought: { label: 'DROUGHT -30%', shortLabel: 'Drought' },
  price: { label: 'PRICE -20%', shortLabel: 'Price' },
  combined: { label: 'DROUGHT + PRICE', shortLabel: 'Combined' },
};

// AssessmentResponse.scenarios (shared/types/assessment.ts) only carries score/exposure/dscr/risk
// per scenario — no per-scenario yield. Only the drought leg of a scenario stresses the physical
// yield (the price leg only stresses the sale price), so drought/combined use the yield agent's
// stressYield and base/price use its expectedYield — mirrors the values already used in
// src/data/demoCase.ts (price yield === base yield, combined yield === drought yield).
const isYieldStressed = (key: ScenarioKey) => key === 'drought' || key === 'combined';

const scenarioDecision = (risk: StressScenario['risk']) => (risk === 'high' ? 'REJECT / RESTRUCTURE' : 'APPROVE WITH LIMIT');

/**
 * AssessmentResponse (shared/types/assessment.ts) carries only the computed/scored fields —
 * applicant identity, field geometry, and loan terms are request-time inputs, not part of the
 * response contract. `identity` supplies those from the case the request was built from.
 */
export function toUnderwritingCase(
  response: AssessmentResponse,
  identity: Pick<UnderwritingCase, 'applicant' | 'field' | 'loan'>,
): UnderwritingCase {
  return {
    ...identity,
    financial: {
      score: response.agents.financial.score,
      currentDebt: response.agents.financial.data.totalDebt,
      delinquencyStatus: response.agents.financial.data.delinquencyStatus,
    },
    production: {
      expectedYield: response.agents.yield.data.expectedYield,
      stressYield: response.agents.yield.data.stressYield,
      yieldVolatility: response.agents.yield.data.yieldVolatility,
    },
    climate: {
      historicalRainfall: response.agents.climate.data.historicalRainfall,
      rainfallAnomaly: response.agents.climate.data.rainfallAnomaly,
      droughtRisk: response.agents.climate.data.droughtRisk,
    },
    soil: {
      score: response.agents.soil.score,
      ph: response.agents.soil.data.ph,
      organicCarbon: response.agents.soil.data.organicCarbon,
    },
    underwriting: {
      productiveScore: response.synthesis.productiveResilience,
      agroScore: response.synthesis.agroScore,
      recommendedExposure: response.synthesis.recommendedExposure,
      baseDSCR: response.synthesis.dscr.base,
      stressDSCR: response.synthesis.dscr.stress,
      rating: response.synthesis.rating,
    },
  };
}

export function toStressScenarios(response: AssessmentResponse): StressScenario[] {
  const { expectedYield, stressYield } = response.agents.yield.data;
  return SCENARIO_ORDER.map((key) => {
    const result = response.scenarios[key];
    const copy = SCENARIO_COPY[key];
    return {
      key,
      label: copy.label,
      shortLabel: copy.shortLabel,
      score: result.score,
      yield: isYieldStressed(key) ? stressYield : expectedYield,
      dscr: result.dscr,
      exposure: result.exposure,
      risk: result.risk,
      decision: scenarioDecision(result.risk),
      overlay: key,
    };
  });
}
