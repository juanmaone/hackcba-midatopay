// SoilGrids is rate-limited to 5 req/min (docs/DATA_SOURCES.md §4) — cache by coordinates rounded
// to 2 decimals (~1.1km, well within a single field) for 24h; soil chemistry changes slowly.
import type { AgentInput, SoilAgentResult } from '../../../shared/types/agent.js';
import { buildSoilAlerts, calculateSoilScore, classifyDrainage, classifyTexture } from './soilScoring.js';
import { soilMock } from './soilMock.js';

const SOILGRIDS_URL = 'https://rest.isric.org/soilgrids/v2.0/properties/query';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface SoilGridsResponse {
  properties: {
    layers: Array<{
      name: string;
      unit_measure: { d_factor: number };
      depths: Array<{ label: string; values: { mean: number | null } }>;
    }>;
  };
}

const cache = new Map<string, { data: SoilAgentResult; expiresAt: number }>();

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

export async function runSoilAgent(input: AgentInput): Promise<SoilAgentResult> {
  const key = cacheKey(input.field.lat, input.field.lng);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  try {
    const params = new URLSearchParams({
      lat: input.field.lat.toFixed(4),
      lon: input.field.lng.toFixed(4),
      property: 'phh2o',
    });
    params.append('property', 'soc');
    params.append('property', 'clay');
    params.append('property', 'sand');
    // SoilGrids has no single "0-30cm" interval for these properties; approximate it by
    // averaging the three shallow intervals that cover 0-30cm.
    params.append('depth', '0-5cm');
    params.append('depth', '5-15cm');
    params.append('depth', '15-30cm');

    const url = `${SOILGRIDS_URL}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SoilGrids request failed: ${res.status}`);
    const json = (await res.json()) as SoilGridsResponse;

    const meanOf = (name: string) => {
      const layer = json.properties.layers.find((l) => l.name === name);
      if (!layer) return undefined;
      const means = layer.depths.map((d) => d.values.mean).filter((m): m is number => m != null);
      if (means.length === 0) return undefined;
      const avg = means.reduce((a, b) => a + b, 0) / means.length;
      return avg / layer.unit_measure.d_factor;
    };
    const ph = meanOf('phh2o');
    const organicCarbon = meanOf('soc');
    const clayContent = meanOf('clay');
    const sandContent = meanOf('sand');
    // Treat null as missing (SoilGrids returns null when a layer is present but has no data coverage at this location)
    if (ph == null || organicCarbon == null || clayContent == null || sandContent == null) {
      throw new Error('SoilGrids response missing an expected property layer');
    }

    const core = { ph, organicCarbon, clayContent, sandContent };
    const soilScore = calculateSoilScore(core);
    const data: SoilAgentResult['data'] = {
      ...core,
      soilScore,
      textureClass: classifyTexture(clayContent, sandContent),
      drainageClass: classifyDrainage(sandContent),
    };

    const result: SoilAgentResult = {
      agentId: 'soil',
      timestamp: new Date().toISOString(),
      confidence: 0.8,
      score: soilScore,
      data,
      metrics: { primary: soilScore, secondary: sandContent, trend: 'stable', volatility: 0.05 },
      alerts: buildSoilAlerts(core),
      sources: [{ provider: 'SoilGrids', endpoint: url, lastUpdated: new Date().toISOString(), reliability: 0.85 }],
    };

    cache.set(key, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch (err) {
    console.warn('[soil] SoilGrids fetch failed, falling back to mock:', err instanceof Error ? err.message : err);
    return { ...soilMock, timestamp: new Date().toISOString() };
  }
}
