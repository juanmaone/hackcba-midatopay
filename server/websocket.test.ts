import { createServer } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, type Socket } from 'socket.io-client';
import { setupWebSocket } from './websocket.js';

describe('setupWebSocket', () => {
  let httpServer: ReturnType<typeof createServer>;
  let client: Socket;
  let baseUrl: string;
  let emitAgentComplete: (caseId: string, result: Parameters<ReturnType<typeof setupWebSocket>>[1]) => void;

  beforeAll(async () => {
    httpServer = createServer();
    const io = new SocketIOServer(httpServer);
    emitAgentComplete = setupWebSocket(io);
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const address = httpServer.address();
    if (address === null || typeof address === 'string') throw new Error('expected a network address');
    baseUrl = `http://127.0.0.1:${address.port}`;
    client = ioClient(baseUrl, { transports: ['websocket'] });
    await new Promise<void>((resolve) => client.on('connect', () => resolve()));
  });

  afterAll(() => {
    client.close();
    httpServer.close();
  });

  it('emits score-updated only to clients subscribed to that caseId', async () => {
    const received = new Promise((resolve) => client.once('score-updated', resolve));
    client.emit('subscribe-case', 'AG-123');
    await new Promise((resolve) => setTimeout(resolve, 50)); // let the join land

    emitAgentComplete('AG-123', {
      agentId: 'financial',
      timestamp: '2026-09-12T10:30:00Z',
      confidence: 0.9,
      score: 61,
      data: {},
      metrics: { primary: 61, secondary: 0, trend: 'stable', volatility: 0 },
      alerts: [],
      sources: [],
    });

    const payload = await received;
    expect(payload).toEqual({ caseId: 'AG-123', agentId: 'financial', score: 61, timestamp: '2026-09-12T10:30:00Z' });
  });

  it('emits alert-triggered for each alert an agent produces', async () => {
    const received = new Promise((resolve) => client.once('alert-triggered', resolve));

    emitAgentComplete('AG-123', {
      agentId: 'climate',
      timestamp: '2026-09-12T10:30:00Z',
      confidence: 0.9,
      score: 40,
      data: {},
      metrics: { primary: 40, secondary: 0, trend: 'declining', volatility: 0.5 },
      alerts: [{ level: 'critical', message: 'Sequía severa', metric: 'rainfallAnomaly', value: -35, threshold: -30, recommendation: 'Revisar' }],
      sources: [],
    });

    const payload = await received;
    expect(payload).toEqual({
      caseId: 'AG-123',
      agentId: 'climate',
      alert: { level: 'critical', message: 'Sequía severa', metric: 'rainfallAnomaly', value: -35, threshold: -30, recommendation: 'Revisar' },
    });
  });
});
