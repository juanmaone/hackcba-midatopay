// Contrato compartido entre server/agents/* y server/engine/*.
// Ver docs/AGENT_SPECIFICATION.md — cualquier cambio de forma debe reflejarse ahi.

export type ScenarioKey = 'base' | 'drought' | 'price' | 'combined';

export interface AgentMetrics {
  primary: number; // Metrica principal (0-100)
  secondary: number; // Metrica de soporte
  trend: 'improving' | 'stable' | 'declining';
  volatility: number; // 0-1 (0 = estable, 1 = muy volatil)
}

export interface Alert {
  level: 'info' | 'warning' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  recommendation: string;
}

export interface DataSource {
  provider: string; // e.g. "Open-Meteo", "BCRA", "Mock"
  endpoint: string;
  lastUpdated: string; // ISO 8601
  reliability: number; // 0-1
}

export interface AgentResult {
  agentId: string;
  timestamp: string; // ISO 8601
  confidence: number; // 0-1
  score: number; // 0-100
  data: Record<string, unknown>;
  metrics: AgentMetrics;
  alerts: Alert[];
  sources: DataSource[];
}

export interface AgentInput {
  caseId: string;
  applicant: {
    cuit: string;
    name: string;
  };
  field: {
    lat: number;
    lng: number;
    hectares: number;
    crop: string;
    campaign: string;
    polygon?: Array<[number, number]>;
  };
  loan: {
    requestedAmount: number;
    termMonths: number;
  };
  stressScenario?: ScenarioKey;
}

export interface FinancialAgentResult extends AgentResult {
  agentId: 'financial';
  data: {
    totalDebt: number;
    delinquencyStatus: number; // 1-5
    daysOverdue: number;
    rejectedChecks: number;
    entities: Array<{ name: string; status: number; amount: number }>;
  };
}

export interface ClimateAgentResult extends AgentResult {
  agentId: 'climate';
  data: {
    historicalRainfall: number; // mm
    rainfallAnomaly: number; // %
    droughtRisk: 'low' | 'medium' | 'high';
    temperatureAnomaly: number; // C
    rainyDays: number;
    consecutiveDryDays: number;
  };
}

export interface YieldAgentResult extends AgentResult {
  agentId: 'yield';
  data: {
    historicalYield: number[]; // tn/ha, ultimos 5 anos
    expectedYield: number; // tn/ha
    stressYield: number; // tn/ha
    yieldVolatility: number; // %
    cropType: string;
    region: string;
    droughtYears: number;
  };
}

export interface SoilAgentResult extends AgentResult {
  agentId: 'soil';
  data: {
    ph: number;
    organicCarbon: number; // g/kg
    clayContent: number; // %
    sandContent: number; // %
    soilScore: number; // 0-100
    textureClass: string;
    drainageClass: string;
  };
}

export interface NewsAgentResult extends AgentResult {
  agentId: 'news';
  data: {
    articleCount: number;
    avgSentiment: number; // -1 a 1
    positiveShare: number; // 0-1
    negativeShare: number; // 0-1
    topThemes: string[];
    riskEvents: Array<{ title: string; sentiment: number; source: string; date: string }>;
  };
}

export interface RiskSynthesisInput {
  field: AgentInput['field'];
  loan: AgentInput['loan'];
  financial: FinancialAgentResult;
  climate: ClimateAgentResult;
  yield: YieldAgentResult;
  soil: SoilAgentResult;
  news: NewsAgentResult;
}

export interface RiskSynthesisOutput {
  agroScore: number; // 0-100
  financialCapacity: number; // 0-100
  productiveResilience: number; // 0-100
  recommendedExposure: number; // ARS
  dscr: {
    base: number;
    stress: number;
  };
  rating: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  decision: 'APPROVE' | 'APPROVE WITH LIMIT' | 'REJECT / RESTRUCTURE';
  breakdown: {
    financialWeight: number; // 0.35
    productiveWeight: number; // 0.65
  };
}
