import { Wheat } from 'lucide-react';
import type { YieldAgentResult } from '../../../shared/types';
import { AgentPanelBase } from './AgentPanelBase';

interface YieldPanelProps { snapshot: YieldAgentResult; liveScore?: number }

export function YieldPanel({ snapshot, liveScore }: YieldPanelProps) {
  return (
    <AgentPanelBase
      icon={Wheat}
      title="Rendimiento"
      snapshotScore={snapshot.score}
      liveScore={liveScore}
      confidence={snapshot.confidence}
      alerts={snapshot.alerts}
      fields={[
        { label: 'Rendimiento esperado', value: `${snapshot.data.expectedYield.toFixed(1)} tn/ha` },
        { label: 'Rendimiento en estrés', value: `${snapshot.data.stressYield.toFixed(1)} tn/ha` },
        { label: 'Volatilidad del rendimiento', value: `${snapshot.data.yieldVolatility}%` },
      ]}
    />
  );
}
