import type { RiskLevel, ScenarioKey, StressScenario, UnderwritingCase } from '../../types/underwriting';

export const calculateExpectedRevenue = (hectares: number, yieldPerHa: number, pricePerTon = 178_000) => hectares * yieldPerHa * pricePerTon;
export const calculateStressRevenue = (hectares: number, yieldPerHa: number, pricePerTon = 178_000) => hectares * yieldPerHa * pricePerTon;
export const calculateDSCR = (revenue: number, operatingCost: number, debtService: number) => (revenue - operatingCost) / debtService;
// Clamped to a [0, 1] ratio, not just <= 1: a negative DSCR (severe combined stress) without the
// lower clamp produces a negative recommended exposure. Mirrors the same fix already applied
// server-side, server/engine/riskSynthesis.ts's calculateRecommendedExposure — this client copy
// was missing it (latent bug, never hit by the 4 static demo scenarios, but hit by any real/custom
// stress severe enough to push DSCR negative, e.g. the interactive scenario builder).
export const calculateRecommendedExposure = (requested: number, dscr: number, threshold = 1.2) => Math.round(requested * Math.max(0, Math.min(1, dscr / threshold)));
export const calculateProductiveScore = (soil: number, stability: number, climateResilience: number) => Math.round(soil * .35 + stability * .4 + climateResilience * .25);
export const calculateAgroScore = (financial: number, productive: number) => Math.round(financial * .35 + productive * .65);

export const calculateStressScenario = (key: ScenarioKey, scenarios: StressScenario[]) => scenarios.find((scenario) => scenario.key === key) ?? scenarios[0];

export const getScoreTone = (score: number) => score >= 75 ? 'positive' : score >= 60 ? 'watch' : 'negative';

export const getProductiveResilience = (key: ScenarioKey) =>
  key === 'combined' ? 69 : key === 'drought' ? 78 : key === 'price' ? 84 : 87;

export const getBaseDecision = (caseData: UnderwritingCase) => caseData.loan.requestedAmount <= caseData.underwriting.recommendedExposure ? 'APROBAR' : 'APROBAR CON LÍMITE';

export const classifyScenarioRisk = (dscr: number): RiskLevel => (dscr >= 1.5 ? 'low' : dscr >= 1.0 ? 'medium' : 'high');

export const getScenarioDecision = (risk: RiskLevel) => (risk === 'high' ? 'RECHAZAR / REESTRUCTURAR' : 'APROBAR CON LÍMITE');

export interface ScenarioParams { yieldMultiplier: number; priceMultiplier: number; requestedAmount: number; termMonths: number }
export interface ScenarioCalcResult { score: number; dscr: number; exposure: number; risk: RiskLevel; decision: string }

/**
 * Client-side mirror of server/engine/stressScenarios.ts + riskSynthesis.ts's DSCR/exposure/score
 * formulas, generalized from the server's 4 fixed multiplier pairs to arbitrary continuous
 * multipliers (for the interactive exposure slider and Constructor de escenarios). Duplicated
 * rather than imported for the same reason as src/domain/satellite/ndvi.ts: src/ and server/ are
 * separate TS projects (different tsconfig/moduleResolution). Keep in sync with the server formula
 * if it changes — pinned by calculations.test.ts against known server outputs.
 */
export function calculateScenario(caseData: UnderwritingCase, params: ScenarioParams, baseAgroScore = caseData.underwriting.agroScore): ScenarioCalcResult {
  const { yieldMultiplier, priceMultiplier, requestedAmount, termMonths } = params;
  // operatingCost is 65% of the UNSTRESSED base revenue, not the stressed one — mirrors
  // server/engine/stressScenarios.ts, which computes baseRevenue/operatingCost once outside its
  // per-scenario loop (operating costs don't shrink just because price or yield drops).
  const baseRevenue = calculateExpectedRevenue(caseData.field.hectares, caseData.production.expectedYield);
  const operatingCost = baseRevenue * 0.65;
  const stressRevenue = calculateExpectedRevenue(caseData.field.hectares, caseData.production.expectedYield * yieldMultiplier, 178_000 * priceMultiplier);
  const debtService = (requestedAmount / termMonths) * 12;
  const dscr = Math.round(calculateDSCR(stressRevenue, operatingCost, debtService) * 100) / 100;
  const exposure = calculateRecommendedExposure(requestedAmount, dscr);
  const score = Math.max(0, Math.min(100, Math.round(baseAgroScore * yieldMultiplier * priceMultiplier)));
  const risk = classifyScenarioRisk(dscr);
  return { score, dscr, exposure, risk, decision: getScenarioDecision(risk) };
}
