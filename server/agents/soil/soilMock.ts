import type { SoilAgentResult } from '../../../shared/types/agent.js';
import { buildSoilAlerts, calculateSoilScore, classifyDrainage, classifyTexture } from './soilScoring.js';

const core = { ph: 6.2, organicCarbon: 21.0, clayContent: 28, sandContent: 42 };

const data: SoilAgentResult['data'] = {
  ...core,
  soilScore: calculateSoilScore(core),
  textureClass: classifyTexture(core.clayContent, core.sandContent),
  drainageClass: classifyDrainage(core.sandContent),
};

export const soilMock: SoilAgentResult = {
  agentId: 'soil',
  timestamp: new Date().toISOString(),
  confidence: 0.6,
  score: data.soilScore,
  data,
  metrics: { primary: data.soilScore, secondary: 60, trend: 'stable', volatility: 0.05 },
  alerts: buildSoilAlerts(core),
  sources: [{ provider: 'Mock', endpoint: 'mock', lastUpdated: new Date().toISOString(), reliability: 1.0 }],
};
