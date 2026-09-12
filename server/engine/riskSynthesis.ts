// server/engine/riskSynthesis.ts
// Weights and formulas per docs/AGENT_SPECIFICATION.md "Risk Engine Aggregation" and
// docs/INTEGRATION_GUIDE.md "Risk Engine Implementation". See plan "Deviations from the docs"
// #1 (financialScore = financial.score directly, not recomputed), #3 (calculateNewsAdjustment
// formula), and #6 (recommendedExposure clamped to >= 0).
import type { RiskSynthesisInput, RiskSynthesisOutput } from '../../shared/types/agent.js';

const PRICE_PER_TON_ARS = 178_000; // default maize price, per docs/AGENT_SPECIFICATION.md
const DSCR_THRESHOLD = 1.2;

export function calculateProductiveScore(input: Pick<RiskSynthesisInput, 'climate' | 'yield' | 'soil'>): number {
  const yieldScore = input.yield.score * 0.4;
  const soilScore = input.soil.score * 0.35;
  const climateScore = input.climate.score * 0.25;
  return Math.round(yieldScore + soilScore + climateScore);
}

export function calculateNewsAdjustment(newsScore: number): number {
  return Math.round((newsScore - 50) * 0.2);
}

export function calculateDSCR(input: RiskSynthesisInput): { base: number; stress: number } {
  const { field, loan, yield: yieldAgent } = input;
  const revenue = field.hectares * yieldAgent.data.expectedYield * PRICE_PER_TON_ARS;
  const stressRevenue = field.hectares * yieldAgent.data.stressYield * PRICE_PER_TON_ARS;
  const operatingCost = revenue * 0.65;
  const debtService = (loan.requestedAmount / loan.termMonths) * 12;

  return {
    base: Math.round(((revenue - operatingCost) / debtService) * 100) / 100,
    stress: Math.round(((stressRevenue - operatingCost) / debtService) * 100) / 100,
  };
}

export function calculateRecommendedExposure(requested: number, dscrBase: number): number {
  const ratio = Math.max(0, Math.min(1, dscrBase / DSCR_THRESHOLD));
  return Math.round((requested * ratio) / 1_000_000) * 1_000_000;
}

export function getRating(score: number): RiskSynthesisOutput['rating'] {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  return 'D';
}

export function getDecision(score: number, stressDscr: number): RiskSynthesisOutput['decision'] {
  if (score >= 80 && stressDscr >= DSCR_THRESHOLD) return 'APPROVE';
  if (score >= 50) return 'APPROVE WITH LIMIT';
  return 'REJECT / RESTRUCTURE';
}

export function synthesizeRisk(input: RiskSynthesisInput): RiskSynthesisOutput {
  const financialScore = input.financial.score;
  const productiveScore = calculateProductiveScore(input);
  const agroScore = Math.round(financialScore * 0.35 + productiveScore * 0.65);
  const newsAdjustment = calculateNewsAdjustment(input.news.score);
  const adjustedScore = Math.max(0, Math.min(100, agroScore + newsAdjustment));

  const dscr = calculateDSCR(input);
  const recommendedExposure = calculateRecommendedExposure(input.loan.requestedAmount, dscr.base);
  const rating = getRating(adjustedScore);
  const decision = getDecision(adjustedScore, dscr.stress);

  return {
    agroScore: adjustedScore,
    financialCapacity: financialScore,
    productiveResilience: productiveScore,
    recommendedExposure,
    dscr,
    rating,
    decision,
    breakdown: { financialWeight: 0.35, productiveWeight: 0.65 },
  };
}
