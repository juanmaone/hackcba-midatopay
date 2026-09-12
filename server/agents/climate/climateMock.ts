// server/agents/climate/climateMock.ts
import type { ClimateAgentResult } from '../../../shared/types/agent.js';
import { calculateClimateScore, buildClimateAlerts } from './climateScoring.js';

const data: ClimateAgentResult['data'] = {
  historicalRainfall: 645,
  rainfallAnomaly: -12,
  droughtRisk: 'medium',
  temperatureAnomaly: 1.5,
  rainyDays: 45,
  consecutiveDryDays: 18,
};

export const climateMock: ClimateAgentResult = {
  agentId: 'climate',
  timestamp: new Date().toISOString(),
  confidence: 0.6,
  score: calculateClimateScore(data),
  data,
  metrics: {
    primary: calculateClimateScore(data),
    secondary: 40,
    trend: 'stable',
    volatility: 0.2,
  },
  alerts: buildClimateAlerts(data),
  sources: [{ provider: 'Mock', endpoint: 'mock', lastUpdated: new Date().toISOString(), reliability: 1.0 }],
};
