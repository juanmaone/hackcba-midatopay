import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import helmet from 'helmet';
import { Server as SocketIOServer } from 'socket.io';
import { createRiskRouter } from './routes/risk.js';
import { setupWebSocket } from './websocket.js';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: 'http://localhost:5173' },
  });

  const onAgentComplete = setupWebSocket(io);
  app.use('/api', createRiskRouter(onAgentComplete));

  return { app, httpServer, io };
}

// Only start listening when this file is run directly (tsx watch / node), not when imported by tests.
if (process.env.NODE_ENV !== 'test') {
  const PORT = Number(process.env.PORT ?? 3001);
  const { httpServer } = createApp();
  httpServer.listen(PORT, () => {
    console.log(`AGROSCORE server running on port ${PORT}`);
  });
}
