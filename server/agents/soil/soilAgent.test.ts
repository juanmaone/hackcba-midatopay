import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculateSoilScore, classifyTexture, buildSoilAlerts } from './soilScoring.js';
import { soilMock } from './soilMock.js';
import { runSoilAgent } from './soilAgent.js';

describe('calculateSoilScore', () => {
  it('rewards optimal pH and high organic carbon', () => {
    expect(calculateSoilScore({ ph: 6.5, organicCarbon: 21, clayContent: 30, sandContent: 40 })).toBe(88); // 70 + 10 + 8
  });

  it('penalizes acidic pH and low organic carbon', () => {
    expect(calculateSoilScore({ ph: 4.8, organicCarbon: 3, clayContent: 10, sandContent: 80 })).toBe(52); // 70 - 10 - 8
  });
});

describe('classifyTexture', () => {
  it('classifies high-clay soil as Clay', () => {
    expect(classifyTexture(45, 20)).toBe('Clay');
  });

  it('classifies balanced soil as Loam', () => {
    expect(classifyTexture(25, 40)).toBe('Loam');
  });

  it('classifies high-sand soil as Sandy', () => {
    expect(classifyTexture(10, 75)).toBe('Sandy');
  });
});

describe('buildSoilAlerts', () => {
  it('produces a critical alert for very acidic pH', () => {
    const alerts = buildSoilAlerts({ ph: 4.2, organicCarbon: 10, clayContent: 20, sandContent: 40 });
    expect(alerts.some((a) => a.level === 'critical')).toBe(true);
  });
});

describe('runSoilAgent', () => {
  const input1 = {
    caseId: 'AG-test-1',
    applicant: { cuit: '30-71284539-9', name: 'Test' },
    field: { lat: -32.69, lng: -62.1, hectares: 300, crop: 'maiz', campaign: '2026/27' },
    loan: { requestedAmount: 100_000_000, termMonths: 12 },
  };

  const input2 = {
    caseId: 'AG-test-2',
    applicant: { cuit: '30-71284539-9', name: 'Test' },
    field: { lat: -33.5, lng: -63.5, hectares: 300, crop: 'maiz', campaign: '2026/27' },
    loan: { requestedAmount: 100_000_000, termMonths: 12 },
  };

  const input3 = {
    caseId: 'AG-test-3',
    applicant: { cuit: '30-71284539-9', name: 'Test' },
    field: { lat: -34.2, lng: -64.2, hectares: 300, crop: 'maiz', campaign: '2026/27' },
    loan: { requestedAmount: 100_000_000, termMonths: 12 },
  };

  const input4 = {
    caseId: 'AG-test-4',
    applicant: { cuit: '30-71284539-9', name: 'Test' },
    field: { lat: -35.0, lng: -65.0, hectares: 300, crop: 'maiz', campaign: '2026/27' },
    loan: { requestedAmount: 100_000_000, termMonths: 12 },
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses a successful SoilGrids response into SoilAgentResult', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          properties: {
            layers: [
              {
                name: 'phh2o',
                unit_measure: { d_factor: 10, mapped_units: 'pH*10', target_units: 'pH' },
                depths: [
                  { label: '0-5cm', values: { mean: 62 } },
                  { label: '5-15cm', values: { mean: 62 } },
                  { label: '15-30cm', values: { mean: 62 } },
                ],
              },
              {
                name: 'soc',
                unit_measure: { d_factor: 10, mapped_units: 'dg/kg', target_units: 'g/kg' },
                depths: [
                  { label: '0-5cm', values: { mean: 210 } },
                  { label: '5-15cm', values: { mean: 210 } },
                  { label: '15-30cm', values: { mean: 210 } },
                ],
              },
              {
                name: 'clay',
                unit_measure: { d_factor: 10, mapped_units: 'g/kg', target_units: '%' },
                depths: [
                  { label: '0-5cm', values: { mean: 280 } },
                  { label: '5-15cm', values: { mean: 280 } },
                  { label: '15-30cm', values: { mean: 280 } },
                ],
              },
              {
                name: 'sand',
                unit_measure: { d_factor: 10, mapped_units: 'g/kg', target_units: '%' },
                depths: [
                  { label: '0-5cm', values: { mean: 420 } },
                  { label: '5-15cm', values: { mean: 420 } },
                  { label: '15-30cm', values: { mean: 420 } },
                ],
              },
            ],
          },
        }),
      })),
    );

    const result = await runSoilAgent(input1);

    expect(result.agentId).toBe('soil');
    expect(result.data.ph).toBe(6.2);
    expect(result.sources[0].provider).toBe('SoilGrids');
  });

  it('falls back to the mock when the fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })),
    );

    const result = await runSoilAgent(input2);

    expect(result.data).toEqual(soilMock.data);
  });

  it('caches a successful response and does not refetch for the same rounded coordinates', async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        properties: {
          layers: [
            {
              name: 'phh2o',
              unit_measure: { d_factor: 10, mapped_units: 'pH*10', target_units: 'pH' },
              depths: [
                { label: '0-5cm', values: { mean: 62 } },
                { label: '5-15cm', values: { mean: 62 } },
                { label: '15-30cm', values: { mean: 62 } },
              ],
            },
            {
              name: 'soc',
              unit_measure: { d_factor: 10, mapped_units: 'dg/kg', target_units: 'g/kg' },
              depths: [
                { label: '0-5cm', values: { mean: 210 } },
                { label: '5-15cm', values: { mean: 210 } },
                { label: '15-30cm', values: { mean: 210 } },
              ],
            },
            {
              name: 'clay',
              unit_measure: { d_factor: 10, mapped_units: 'g/kg', target_units: '%' },
              depths: [
                { label: '0-5cm', values: { mean: 280 } },
                { label: '5-15cm', values: { mean: 280 } },
                { label: '15-30cm', values: { mean: 280 } },
              ],
            },
            {
              name: 'sand',
              unit_measure: { d_factor: 10, mapped_units: 'g/kg', target_units: '%' },
              depths: [
                { label: '0-5cm', values: { mean: 420 } },
                { label: '5-15cm', values: { mean: 420 } },
                { label: '15-30cm', values: { mean: 420 } },
              ],
            },
          ],
        },
      }),
    }));
    vi.stubGlobal('fetch', fetchSpy);

    await runSoilAgent(input3);
    await runSoilAgent(input3);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('falls back to the mock when SoilGrids response has null mean values (no data coverage)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          properties: {
            layers: [
              {
                name: 'phh2o',
                unit_measure: { d_factor: 10, mapped_units: 'pH*10', target_units: 'pH' },
                depths: [
                  { label: '0-5cm', values: { mean: null } },
                  { label: '5-15cm', values: { mean: null } },
                  { label: '15-30cm', values: { mean: null } },
                ],
              },
              {
                name: 'soc',
                unit_measure: { d_factor: 10, mapped_units: 'dg/kg', target_units: 'g/kg' },
                depths: [
                  { label: '0-5cm', values: { mean: null } },
                  { label: '5-15cm', values: { mean: null } },
                  { label: '15-30cm', values: { mean: null } },
                ],
              },
              {
                name: 'clay',
                unit_measure: { d_factor: 10, mapped_units: 'g/kg', target_units: '%' },
                depths: [
                  { label: '0-5cm', values: { mean: null } },
                  { label: '5-15cm', values: { mean: null } },
                  { label: '15-30cm', values: { mean: null } },
                ],
              },
              {
                name: 'sand',
                unit_measure: { d_factor: 10, mapped_units: 'g/kg', target_units: '%' },
                depths: [
                  { label: '0-5cm', values: { mean: null } },
                  { label: '5-15cm', values: { mean: null } },
                  { label: '15-30cm', values: { mean: null } },
                ],
              },
            ],
          },
        }),
      })),
    );

    const result = await runSoilAgent(input4);

    // Should fall back to mock, not compute a score from null values
    expect(result.data).toEqual(soilMock.data);
    expect(result.sources[0].provider).toBe('Mock');
    expect(result.confidence).toBe(0.6);
  });
});
