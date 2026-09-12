// server/agents/climate/climateAgent.ts
// Mirrors the rolling-window rainfall/anomaly algorithm already validated client-side in
// src/services/api/climateClient.ts (Track B, this session) — cannot import that file (separate
// TS project), so the algorithm is reimplemented here, not the file.
import type { AgentInput, ClimateAgentResult } from '../../../shared/types/agent.js';
import { buildClimateAlerts, calculateClimateScore, classifyDroughtRisk } from './climateScoring.js';
import { climateMock } from './climateMock.js';

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const WINDOW_DAYS = 365;
const ARCHIVE_LAG_DAYS = 5;
const BASELINE_YEARS = 4;

interface OpenMeteoResponse {
  daily: {
    precipitation_sum: Array<number | null>;
    temperature_2m_max: Array<number | null>;
    temperature_2m_min: Array<number | null>;
  };
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

export async function runClimateAgent(input: AgentInput): Promise<ClimateAgentResult> {
  try {
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - ARCHIVE_LAG_DAYS);
    const start = new Date(end);
    start.setUTCFullYear(start.getUTCFullYear() - (BASELINE_YEARS + 1));

    const params = new URLSearchParams({
      latitude: input.field.lat.toFixed(4),
      longitude: input.field.lng.toFixed(4),
      start_date: isoDate(start),
      end_date: isoDate(end),
      daily: 'precipitation_sum,temperature_2m_max,temperature_2m_min',
      timezone: 'auto',
    });

    const url = `${ARCHIVE_URL}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo request failed: ${res.status}`);
    const json = (await res.json()) as OpenMeteoResponse;

    const precip = json.daily.precipitation_sum.map((v) => v ?? 0);
    const tempMax = json.daily.temperature_2m_max.map((v) => v ?? 0);

    const sumWindow = (arr: number[], endIndex: number) => arr.slice(Math.max(0, endIndex - WINDOW_DAYS), endIndex).reduce((a, b) => a + b, 0);
    const avgWindow = (arr: number[], endIndex: number) => average(arr.slice(Math.max(0, endIndex - WINDOW_DAYS), endIndex));

    const currentRainfall = sumWindow(precip, precip.length);
    const currentAvgMaxTemp = avgWindow(tempMax, tempMax.length);

    const priorRainfallWindows: number[] = [];
    const priorTempWindows: number[] = [];
    for (let offset = 2; offset <= BASELINE_YEARS + 1; offset++) {
      const endIndex = precip.length - WINDOW_DAYS * (offset - 1);
      if (endIndex - WINDOW_DAYS < 0) continue;
      priorRainfallWindows.push(sumWindow(precip, endIndex));
      priorTempWindows.push(avgWindow(tempMax, endIndex));
    }
    const baselineRainfall = average(priorRainfallWindows);
    const baselineTemp = average(priorTempWindows);

    const rainfallAnomaly = baselineRainfall === 0 ? 0 : Math.round(((currentRainfall - baselineRainfall) / baselineRainfall) * 100);
    const temperatureAnomaly = Math.round((currentAvgMaxTemp - baselineTemp) * 10) / 10;

    const currentWindowStart = Math.max(0, precip.length - WINDOW_DAYS);
    const currentPrecip = precip.slice(currentWindowStart);
    const rainyDays = currentPrecip.filter((v) => v > 1).length;
    let consecutiveDryDays = 0;
    let maxDryStreak = 0;
    for (const v of currentPrecip) {
      if (v <= 1) {
        consecutiveDryDays += 1;
        maxDryStreak = Math.max(maxDryStreak, consecutiveDryDays);
      } else {
        consecutiveDryDays = 0;
      }
    }

    const data: ClimateAgentResult['data'] = {
      historicalRainfall: Math.round(currentRainfall),
      rainfallAnomaly,
      droughtRisk: classifyDroughtRisk(rainfallAnomaly),
      temperatureAnomaly,
      rainyDays,
      consecutiveDryDays: maxDryStreak,
    };

    const score = calculateClimateScore(data);

    return {
      agentId: 'climate',
      timestamp: new Date().toISOString(),
      confidence: 0.85,
      score,
      data,
      metrics: { primary: score, secondary: Math.max(0, Math.min(100, 100 + rainfallAnomaly)), trend: 'stable', volatility: 0.2 },
      alerts: buildClimateAlerts(data),
      sources: [{ provider: 'Open-Meteo', endpoint: url, lastUpdated: new Date().toISOString(), reliability: 0.9 }],
    };
  } catch {
    return { ...climateMock, timestamp: new Date().toISOString() };
  }
}
