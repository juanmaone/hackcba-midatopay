// Real historical rainfall from Open-Meteo's free, no-auth Historical Weather API (ERA5
// reanalysis) — https://open-meteo.com/en/docs/historical-weather-api. Called directly from the
// browser since no Track A backend route exists yet to proxy it.

export interface RealClimateData {
  annualRainfallMm: number;
  rainfallAnomalyPercent: number;
  baselineYears: number;
  sourceUrl: string;
}

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const WINDOW_DAYS = 365;
const ARCHIVE_LAG_DAYS = 5; // ERA5 reanalysis data isn't available for the most recent few days
const BASELINE_YEARS = 4; // years of trailing-365-day windows averaged for the anomaly baseline

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function fetchRealClimateData(lat: number, lng: number): Promise<RealClimateData> {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - ARCHIVE_LAG_DAYS);
  const start = new Date(end);
  start.setUTCFullYear(start.getUTCFullYear() - (BASELINE_YEARS + 1));

  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    start_date: isoDate(start),
    end_date: isoDate(end),
    daily: 'precipitation_sum',
    timezone: 'auto',
  });

  const res = await fetch(`${ARCHIVE_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`Open-Meteo request failed: ${res.status}`);
  const json: { daily: { precipitation_sum: Array<number | null> } } = await res.json();
  const values = json.daily.precipitation_sum.map((v) => v ?? 0);

  const sumWindow = (endIndex: number) => values.slice(Math.max(0, endIndex - WINDOW_DAYS), endIndex).reduce((a, b) => a + b, 0);

  const currentWindow = sumWindow(values.length);
  const priorWindows: number[] = [];
  for (let offset = 2; offset <= BASELINE_YEARS + 1; offset++) {
    const endIndex = values.length - WINDOW_DAYS * (offset - 1);
    if (endIndex - WINDOW_DAYS < 0) continue;
    priorWindows.push(sumWindow(endIndex));
  }
  const baselineAvg = priorWindows.reduce((a, b) => a + b, 0) / priorWindows.length;

  return {
    annualRainfallMm: Math.round(currentWindow),
    rainfallAnomalyPercent: Math.round(((currentWindow - baselineAvg) / baselineAvg) * 100),
    baselineYears: priorWindows.length,
    sourceUrl: `https://open-meteo.com/en/docs/historical-weather-api?latitude=${lat}&longitude=${lng}#daily-weather-variables`,
  };
}
