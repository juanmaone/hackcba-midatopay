import { useEffect, useState } from 'react';
import type { Alert } from '../../shared/types';
import { getSocket } from '../services/api/socketClient';

interface ScoreUpdatedPayload { caseId: string; agentId: string; score: number; timestamp: string }
interface AlertTriggeredPayload { caseId: string; alert: Alert; agentId: string }
interface ScenarioChangedPayload { caseId: string; scenario: string; exposure: number; dscr: number }

export interface LiveAgentUpdatesState {
  connected: boolean;
  scores: Record<string, number>;
  alerts: Alert[];
  scenarioUpdate: ScenarioChangedPayload | null;
}

// Soft-coupled to Track A's server/websocket.ts (docs/TRACK_B_PLAN.md Tarea 10): if it isn't
// emitting, socket.io-client just keeps retrying in the background — connected stays false and
// scores/alerts stay empty, so callers fall back to their REST snapshot instead of breaking.
export function useLiveAgentUpdates(caseId: string): LiveAgentUpdatesState {
  const [connected, setConnected] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [scenarioUpdate, setScenarioUpdate] = useState<ScenarioChangedPayload | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setConnected(true);
      socket.emit('subscribe-case', caseId);
    };
    const handleDisconnect = () => setConnected(false);
    const handleScoreUpdated = (data: ScoreUpdatedPayload) => {
      if (data.caseId !== caseId) return;
      setScores((prev) => ({ ...prev, [data.agentId]: data.score }));
    };
    const handleAlertTriggered = (data: AlertTriggeredPayload) => {
      if (data.caseId !== caseId) return;
      setAlerts((prev) => [...prev, data.alert]);
    };
    const handleScenarioChanged = (data: ScenarioChangedPayload) => {
      if (data.caseId !== caseId) return;
      setScenarioUpdate(data);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('score-updated', handleScoreUpdated);
    socket.on('alert-triggered', handleAlertTriggered);
    socket.on('scenario-changed', handleScenarioChanged);
    if (socket.connected) handleConnect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('score-updated', handleScoreUpdated);
      socket.off('alert-triggered', handleAlertTriggered);
      socket.off('scenario-changed', handleScenarioChanged);
    };
  }, [caseId]);

  return { connected, scores, alerts, scenarioUpdate };
}
