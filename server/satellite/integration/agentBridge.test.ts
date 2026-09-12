import { describe, expect, it } from 'vitest';
import type { ClimateAgentResult } from '../../../shared/types/agent.js';
import { mockDroughtAnalysis, mockSatelliteAnalysis } from '../providers/mockSatellite.js';
import { enrichWithSatelliteData } from './agentBridge.js';

const field = { lat: -32.69, lng: -62.1, polygon: [[-62.105, -32.685], [-62.113, -32.697]] as Array<[number, number]> };

function makeClimateResult(droughtRisk: ClimateAgentResult['data']['droughtRisk']): ClimateAgentResult {
  return {
    agentId: 'climate',
    timestamp: '2026-09-12T10:30:00Z',
    score: 70,
    confidence: 0.9,
    data: {
      historicalRainfall: 645,
      rainfallAnomaly: -12,
      droughtRisk,
      temperatureAnomaly: 1,
      rainyDays: 50,
      consecutiveDryDays: 10,
    },
    metrics: { primary: 70, secondary: 60, trend: 'stable', volatility: 0.2 },
    alerts: [],
    sources: [],
  };
}

describe('enrichWithSatelliteData', () => {
  it('returns the healthy mock when no agents are supplied', async () => {
    const result = await enrichWithSatelliteData(field, {});
    expect(result).toBe(mockSatelliteAnalysis);
  });

  it('returns the healthy mock when climate drought risk is not high', async () => {
    const result = await enrichWithSatelliteData(field, { climate: makeClimateResult('medium') });
    expect(result).toBe(mockSatelliteAnalysis);
  });

  it('returns the drought mock when climate drought risk is high', async () => {
    const result = await enrichWithSatelliteData(field, { climate: makeClimateResult('high') });
    expect(result).toBe(mockDroughtAnalysis);
  });
});
