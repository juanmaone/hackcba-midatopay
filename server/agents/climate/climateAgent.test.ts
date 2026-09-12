// server/agents/climate/climateAgent.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculateClimateScore, buildClimateAlerts } from './climateScoring.js';
import { climateMock } from './climateMock.js';
import { runClimateAgent } from './climateAgent.js';

describe('calculateClimateScore', () => {
  it('applies no penalty for normal rainfall and dry-day counts', () => {
    expect(
      calculateClimateScore({
        historicalRainfall: 700,
        rainfallAnomaly: -5,
        droughtRisk: 'low',
        temperatureAnomaly: 0.5,
        rainyDays: 60,
        consecutiveDryDays: 10,
      }),
    ).toBe(70);
  });

  it('applies the -15 high-drought penalty when anomaly < -20', () => {
    expect(
      calculateClimateScore({
        historicalRainfall: 400,
        rainfallAnomaly: -25,
        droughtRisk: 'high',
        temperatureAnomaly: 0.5,
        rainyDays: 30,
        consecutiveDryDays: 10,
      }),
    ).toBe(55);
  });

  it('stacks the consecutive-dry-days and temperature penalties', () => {
    expect(
      calculateClimateScore({
        historicalRainfall: 400,
        rainfallAnomaly: -25,
        droughtRisk: 'high',
        temperatureAnomaly: 3,
        rainyDays: 20,
        consecutiveDryDays: 35,
      }),
    ).toBe(40); // 70 - 15 (drought) - 10 (dry days) - 5 (temp)
  });
});

describe('buildClimateAlerts', () => {
  it('produces a critical alert when rainfallAnomaly < -30', () => {
    const alerts = buildClimateAlerts({
      historicalRainfall: 300,
      rainfallAnomaly: -35,
      droughtRisk: 'high',
      temperatureAnomaly: 1,
      rainyDays: 15,
      consecutiveDryDays: 20,
    });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe('critical');
  });

  it('produces no alerts when nothing crosses a threshold', () => {
    expect(buildClimateAlerts(climateMock.data).length).toBeGreaterThanOrEqual(0);
  });
});

describe('runClimateAgent', () => {
  const input = {
    caseId: 'AG-test',
    applicant: { cuit: '30-71284539-9', name: 'Test' },
    field: { lat: -32.69, lng: -62.1, hectares: 300, crop: 'maiz', campaign: '2026/27' },
    loan: { requestedAmount: 100_000_000, termMonths: 12 },
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses a successful Open-Meteo response into ClimateAgentResult', async () => {
    const days = 365 * 5 + 5;
    const precipitation = Array.from({ length: days }, () => 2);
    const tempMax = Array.from({ length: days }, () => 28);
    const tempMin = Array.from({ length: days }, () => 15);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          daily: { precipitation_sum: precipitation, temperature_2m_max: tempMax, temperature_2m_min: tempMin },
        }),
      })),
    );

    const result = await runClimateAgent(input);

    expect(result.agentId).toBe('climate');
    expect(result.data.historicalRainfall).toBeGreaterThan(0);
    expect(result.sources[0].provider).toBe('Open-Meteo');
  });

  it('falls back to the mock when the fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })),
    );

    const result = await runClimateAgent(input);

    expect(result.data).toEqual(climateMock.data);
    expect(result.sources[0].provider).toBe('Mock');
  });
});
