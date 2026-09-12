// Contrato de POST /api/assessment. Ver docs/INTEGRATION_GUIDE.md.
// Es el unico acople "duro" entre Track A (backend/agentes) y Track B (frontend/satelital):
// ambos tracks deben poder construir/consumir este shape sin depender de que el otro
// este corriendo (Track B usa src/data/mockAssessmentResponse.ts como fixture).

import type {
  ClimateAgentResult,
  FinancialAgentResult,
  NewsAgentResult,
  RiskSynthesisOutput,
  ScenarioKey,
  SoilAgentResult,
  YieldAgentResult,
} from './agent.js';

export interface AssessmentRequest {
  cuit: string;
  applicant: {
    name: string;
  };
  field: {
    lat: number;
    lng: number;
    hectares: number;
    crop: string;
    campaign: string;
    polygon: Array<[number, number]>; // [lng, lat], convencion GeoJSON
  };
  loan: {
    requestedAmount: number;
    termMonths: number;
  };
}

export interface ScenarioResult {
  score: number;
  exposure: number;
  dscr: number;
  risk: 'low' | 'medium' | 'high';
}

export interface AssessmentResponse {
  caseId: string;
  timestamp: string; // ISO 8601
  agents: {
    financial: FinancialAgentResult;
    climate: ClimateAgentResult;
    yield: YieldAgentResult;
    soil: SoilAgentResult;
    news: NewsAgentResult;
  };
  synthesis: RiskSynthesisOutput;
  scenarios: Record<ScenarioKey, ScenarioResult>;
}
