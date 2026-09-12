// server/agents/yield/yieldMock.ts
// Hardcoded MAGyP fallback per docs/DATA_SOURCES.md §3 (USDA PSD needs an API key, out of scope
// — this table is the yield agent's permanent, only data source in this build).
export const MAGYP_DATA: Record<string, { avgYield: number; region: string }> = {
  maiz: { avgYield: 8.2, region: 'Cordoba' },
  soja: { avgYield: 3.1, region: 'Santa Fe' },
  trigo: { avgYield: 2.8, region: 'Buenos Aires' },
};

export const DEFAULT_YIELD = { avgYield: 4.0, region: 'Argentina' };
