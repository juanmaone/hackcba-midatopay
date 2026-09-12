// server/agents/yield/yieldAgent.ts
import type { AgentInput, YieldAgentResult } from '../../../shared/types/agent.js';
import { calculateYieldScore } from './yieldScoring.js';
import { DEFAULT_YIELD, MAGYP_DATA } from './yieldMock.js';

const YIELD_VOLATILITY = 15; // % — static mock figure, no real multi-year series in this build
const DROUGHT_YEARS = 1; // static mock figure

export async function runYieldAgent(input: AgentInput): Promise<YieldAgentResult> {
  const cropKey = input.field.crop.toLowerCase();
  const entry = MAGYP_DATA[cropKey] ?? DEFAULT_YIELD;

  const expectedYield = entry.avgYield;
  const stressYield = Math.round(expectedYield * 0.7 * 100) / 100;

  const data: YieldAgentResult['data'] = {
    historicalYield: [expectedYield, expectedYield, expectedYield, expectedYield, expectedYield],
    expectedYield,
    stressYield,
    yieldVolatility: YIELD_VOLATILITY,
    cropType: input.field.crop,
    region: entry.region,
    droughtYears: DROUGHT_YEARS,
  };

  const score = calculateYieldScore({ yieldVolatility: YIELD_VOLATILITY, droughtYears: DROUGHT_YEARS });

  return {
    agentId: 'yield',
    timestamp: new Date().toISOString(),
    confidence: 0.65,
    score,
    data,
    metrics: { primary: score, secondary: 100 - YIELD_VOLATILITY, trend: 'stable', volatility: YIELD_VOLATILITY / 100 },
    alerts: [],
    sources: [{ provider: 'MAGyP', endpoint: 'mock:MAGYP_DATA', lastUpdated: new Date().toISOString(), reliability: 0.7 }],
  };
}
