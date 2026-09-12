import type { HistoricalYield, StressScenario, UnderwritingCase } from '../types/underwriting';

// Campo real (OpenStreetMap way 281480419, landuse=farmland, ~309 ha), ~2.3 km al oeste del
// centro de Marcos Juárez, Córdoba: https://www.openstreetmap.org/way/281480419
export const demoCase: UnderwritingCase = {
  applicant: { cuit: '20-42052576-2', name: 'Roberto Daniel Ferreyra' },
  field: {
    hectares: 309, province: 'Córdoba', department: 'Marcos Juárez', crop: 'Maíz', campaign: '2026/27',
    polygon: [
      [-62.1196118, -32.6962049], [-62.1282419, -32.694703], [-62.1276301, -32.6920478], [-62.1326407, -32.6911802],
      [-62.1332618, -32.6938244], [-62.1333939, -32.6937745], [-62.1534785, -32.6901965], [-62.1524961, -32.6860819],
      [-62.1469834, -32.6870673], [-62.1462516, -32.6843847], [-62.1451157, -32.683622], [-62.1442948, -32.6803212],
      [-62.1304968, -32.682745], [-62.1308367, -32.6841075], [-62.1263888, -32.6849018], [-62.1257411, -32.6850146],
      [-62.12626, -32.6869764], [-62.1228328, -32.6875776], [-62.117679, -32.6884816], [-62.1182017, -32.690519],
      [-62.1185164, -32.6917458], [-62.1185375, -32.6918209], [-62.1188396, -32.693076], [-62.119158, -32.6943347],
      [-62.1193084, -32.6949769], [-62.1194577, -32.6955998], [-62.1194771, -32.6956772],
    ],
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
  { key: 'base', label: 'CASO BASE', shortLabel: 'Base', score: 82, yield: 8.2, dscr: 1.82, exposure: 76_000_000, risk: 'low', decision: 'APROBAR CON LÍMITE', overlay: 'base' },
  { key: 'drought', label: 'SEQUÍA -30%', shortLabel: 'Sequía', score: 68, yield: 5.7, dscr: 1.13, exposure: 49_000_000, risk: 'medium', decision: 'APROBAR CON LÍMITE', overlay: 'drought' },
  { key: 'price', label: 'PRECIO -20%', shortLabel: 'Precio', score: 72, yield: 8.2, dscr: 1.27, exposure: 58_000_000, risk: 'medium', decision: 'APROBAR CON LÍMITE', overlay: 'price' },
  { key: 'combined', label: 'SEQUÍA + PRECIO', shortLabel: 'Combinado', score: 56, yield: 5.7, dscr: 0.91, exposure: 34_000_000, risk: 'high', decision: 'RECHAZAR / REESTRUCTURAR', overlay: 'combined' },
];
