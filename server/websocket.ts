import type { Server as SocketIOServer } from 'socket.io';
import type { AgentResult } from '../shared/types/agent.js';

export function setupWebSocket(io: SocketIOServer): (caseId: string, result: AgentResult) => void {
  io.on('connection', (socket) => {
    socket.on('subscribe-case', (caseId: string) => {
      socket.join(caseId);
    });
  });

  return (caseId: string, result: AgentResult) => {
    io.to(caseId).emit('score-updated', { caseId, agentId: result.agentId, score: result.score, timestamp: result.timestamp });
    for (const alert of result.alerts) {
      io.to(caseId).emit('alert-triggered', { caseId, agentId: result.agentId, alert });
    }
  };
}
