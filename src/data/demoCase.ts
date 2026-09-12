import type { HistoricalYield, StressScenario, UnderwritingCase } from '../types/underwriting';

export const demoCase: UnderwritingCase = {
  applicant: { cuit: '30-71284539-9', name: 'Marcos Juárez, Córdoba' },
  field: {
    hectares: 300, province: 'Córdoba', department: 'Marcos Juárez', crop: 'Maíz', campaign: '2026/27',
    polygon: [[-62.105, -32.685], [-62.094, -32.688], [-62.091, -32.698], [-62.103, -32.704], [-62.113, -32.697]],
  },
  loan: { requestedAmount: 100_000_000, termMonths: 12 },
  financial: { score: 61, currentDebt: 138_000_000, delinquencyStatus: 1 },
  production: { expectedYield: 8.2, stressYield: 5.9, yieldVolatility: 18 },
  climate: { historicalRainfall: 645, rainfallAnomaly: -12, droughtRisk: 'medium' },
  soil: { score: 89, ph: 6.2, organicCarbon: 2.1 },
  underwriting: { productiveScore: 87, agroScore: 82, recommendedExposure: 76_000_000, baseDSCR: 1.82, stressDSCR: 1.24, rating: 'B+' },
};

export const historicalYield: HistoricalYield[] = [
  { year: 2019, yield: 7.4 }, { year: 2020, yield: 8.0 }, { year: 2021, yield: 8.5 },
  { year: 2022, yield: 6.3, drought: true }, { year: 2023, yield: 5.8, drought: true },
  { year: 2024, yield: 8.1 }, { year: 2025, yield: 8.4 }, { year: 2026, yield: 8.2 },
];

export const scenarios: StressScenario[] = [
  { key: 'base', label: 'BASE CASE', shortLabel: 'Base', score: 82, yield: 8.2, dscr: 1.82, exposure: 76_000_000, risk: 'low', decision: 'APPROVE WITH LIMIT', overlay: 'base' },
  { key: 'drought', label: 'DROUGHT -30%', shortLabel: 'Drought', score: 68, yield: 5.7, dscr: 1.13, exposure: 49_000_000, risk: 'medium', decision: 'APPROVE WITH LIMIT', overlay: 'drought' },
  { key: 'price', label: 'PRICE -20%', shortLabel: 'Price', score: 72, yield: 8.2, dscr: 1.27, exposure: 58_000_000, risk: 'medium', decision: 'APPROVE WITH LIMIT', overlay: 'price' },
  { key: 'combined', label: 'DROUGHT + PRICE', shortLabel: 'Combined', score: 56, yield: 5.7, dscr: 0.91, exposure: 34_000_000, risk: 'high', decision: 'REJECT / RESTRUCTURE', overlay: 'combined' },
];
