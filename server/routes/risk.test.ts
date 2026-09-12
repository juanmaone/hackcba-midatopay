import express from 'express';
import { createServer } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AssessmentResponse } from '../../shared/types/assessment.js';
import { createRiskRouter } from './risk.js';

describe('POST /api/assessment', () => {
  let server: ReturnType<ReturnType<typeof createServer>['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', createRiskRouter());
    const httpServer = createServer(app);
    await new Promise<void>((resolve) => {
      server = httpServer.listen(0, () => resolve());
    });
    const address = server.address();
    if (address === null || typeof address === 'string') throw new Error('expected a network address');
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(() => {
    server.close();
  });

  const validBody = {
    cuit: '30-71284539-9',
    applicant: { name: 'Marcos Juárez' },
    field: {
      lat: -32.69,
      lng: -62.1,
      hectares: 300,
      crop: 'maiz',
      campaign: '2026/27',
      polygon: [
        [-62.105, -32.685],
        [-62.094, -32.688],
        [-62.091, -32.698],
      ],
    },
    loan: { requestedAmount: 100_000_000, termMonths: 12 },
  };

  it('returns a full AssessmentResponse for a valid request', async () => {
    const res = await fetch(`${baseUrl}/api/assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as AssessmentResponse;
    expect(json.caseId).toMatch(/^AG-/);
    expect(json.agents.financial.agentId).toBe('financial');
    expect(json.agents.climate.agentId).toBe('climate');
    expect(json.agents.yield.agentId).toBe('yield');
    expect(json.agents.soil.agentId).toBe('soil');
    expect(json.agents.news.agentId).toBe('news');
    expect(typeof json.synthesis.agroScore).toBe('number');
    expect(json.scenarios.base).toBeDefined();
    expect(json.scenarios.drought).toBeDefined();
    expect(json.scenarios.price).toBeDefined();
    expect(json.scenarios.combined).toBeDefined();
  }, 90000);

  it('returns 400 for an invalid request body', async () => {
    const res = await fetch(`${baseUrl}/api/assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuit: '30-71284539-9' }), // missing field/loan/applicant
    });

    expect(res.status).toBe(400);
  });
});
