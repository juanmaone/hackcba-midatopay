export type RiskLevel = 'low' | 'medium' | 'high';

export type ScenarioKey = 'base' | 'drought' | 'price' | 'combined';

export interface UnderwritingCase {
  applicant: { cuit: string; name: string };
  field: {
    hectares: number;
    province: string;
    department: string;
    crop: string;
    campaign: string;
    polygon: Array<[number, number]>;
  };
  loan: { requestedAmount: number; termMonths: number };
  financial: { score: number; currentDebt: number; delinquencyStatus: number };
  production: { expectedYield: number; stressYield: number; yieldVolatility: number };
  climate: { historicalRainfall: number; rainfallAnomaly: number; droughtRisk: RiskLevel };
  soil: { score: number; ph: number; organicCarbon: number };
  underwriting: {
    productiveScore: number;
    agroScore: number;
    recommendedExposure: number;
    baseDSCR: number;
    stressDSCR: number;
    rating: string;
  };
}

export interface StressScenario {
  key: ScenarioKey;
  label: string;
  shortLabel: string;
  score: number;
  yield: number;
  dscr: number;
  exposure: number;
  risk: RiskLevel;
  decision: string;
  overlay: string;
}

export interface HistoricalYield { year: number; yield: number; drought?: boolean }
