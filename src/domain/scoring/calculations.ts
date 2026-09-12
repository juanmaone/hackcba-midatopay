import type { ScenarioKey, StressScenario, UnderwritingCase } from '../../types/underwriting';

export const calculateExpectedRevenue = (hectares: number, yieldPerHa: number, pricePerTon = 178_000) => hectares * yieldPerHa * pricePerTon;
export const calculateStressRevenue = (hectares: number, yieldPerHa: number, pricePerTon = 178_000) => hectares * yieldPerHa * pricePerTon;
export const calculateDSCR = (revenue: number, operatingCost: number, debtService: number) => (revenue - operatingCost) / debtService;
export const calculateRecommendedExposure = (requested: number, dscr: number, threshold = 1.2) => Math.round(requested * Math.min(1, dscr / threshold));
export const calculateProductiveScore = (soil: number, stability: number, climateResilience: number) => Math.round(soil * .35 + stability * .4 + climateResilience * .25);
export const calculateAgroScore = (financial: number, productive: number) => Math.round(financial * .35 + productive * .65);

export const calculateStressScenario = (key: ScenarioKey, scenarios: StressScenario[]) => scenarios.find((scenario) => scenario.key === key) ?? scenarios[0];

export const getScoreTone = (score: number) => score >= 75 ? 'positive' : score >= 60 ? 'watch' : 'negative';

export const getProductiveResilience = (key: ScenarioKey) =>
  key === 'combined' ? 69 : key === 'drought' ? 78 : key === 'price' ? 84 : 87;

export const getBaseDecision = (caseData: UnderwritingCase) => caseData.loan.requestedAmount <= caseData.underwriting.recommendedExposure ? 'APPROVE' : 'APPROVE WITH LIMIT';
