import { describe, expect, it, afterAll, beforeAll } from 'vitest';
import { createApp } from './index.js';

describe('GET /health', () => {
  let server: ReturnType<ReturnType<typeof createApp>['httpServer']['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    const { httpServer } = createApp();
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

  it('returns 200 with status ok', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ status: 'ok' });
  });
});
