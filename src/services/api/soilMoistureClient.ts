// Real soil moisture from NASA POWER's free, no-auth Daily Point API (MERRA-2 reanalysis) —
// https://power.larc.nasa.gov/docs/. Called directly from the browser (CORS-open, verified) since
// no Track A backend route exists yet to proxy it — mirrors climateClient.ts's approach.

export interface RealSoilMoistureData {
  rootZoneWetness: number; // GWETROOT, 0-1 fraction of saturation
  surfaceWetness: number; // GWETTOP, 0-1 fraction of saturation
  asOfDate: string; // YYYY-MM-DD of the most recent non-fill reading found
  sourceUrl: string;
}

const POWER_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point';
const LAG_DAYS = 7; // NASA POWER's near-real-time values lag by about a week
const LOOKBACK_DAYS = 10; // window to search backward for the latest non-fill reading
const FILL_VALUE = -999;

function compactDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function toIsoDate(compact: string): string {
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}

interface PowerResponse {
  properties: { parameter: { GWETROOT: Record<string, number>; GWETTOP: Record<string, number> } };
}

export async function fetchRealSoilMoisture(lat: number, lng: number): Promise<RealSoilMoistureData> {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - LAG_DAYS);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - LOOKBACK_DAYS);

  const params = new URLSearchParams({
    parameters: 'GWETROOT,GWETTOP',
    community: 'AG',
    longitude: lng.toFixed(4),
    latitude: lat.toFixed(4),
    start: compactDate(start),
    end: compactDate(end),
    format: 'JSON',
  });

  const res = await fetch(`${POWER_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`NASA POWER request failed: ${res.status}`);
  const json: PowerResponse = await res.json();
  const { GWETROOT, GWETTOP } = json.properties.parameter;

  const latestDate = Object.keys(GWETROOT)
    .sort()
    .reverse()
    .find((date) => GWETROOT[date] !== FILL_VALUE && GWETTOP[date] !== FILL_VALUE);
  if (!latestDate) throw new Error('NASA POWER: no valid soil moisture reading in the lookback window');

  return {
    rootZoneWetness: GWETROOT[latestDate],
    surfaceWetness: GWETTOP[latestDate],
    asOfDate: toIsoDate(latestDate),
    sourceUrl: `https://power.larc.nasa.gov/data-access-viewer/?parameters=GWETROOT,GWETTOP&community=AG&longitude=${lng}&latitude=${lat}`,
  };
}
