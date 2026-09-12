import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

// Same-origin connection, using the default '/socket.io' path — matches the Vite dev proxy
// already configured for /socket.io -> localhost:3001 (FASE 0, vite.config.ts).
export function getSocket(): Socket {
  if (!socket) socket = io();
  return socket;
}
