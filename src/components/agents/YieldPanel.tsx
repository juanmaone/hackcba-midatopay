import { Wheat } from 'lucide-react';
import type { YieldAgentResult } from '../../../shared/types';
import { AgentPanelBase } from './AgentPanelBase';

interface YieldPanelProps { snapshot: YieldAgentResult; liveScore?: number }

export function YieldPanel({ snapshot, liveScore }: YieldPanelProps) {
  return (
    <AgentPanelBase
      icon={Wheat}
      title="Yield"
      snapshotScore={snapshot.score}
      liveScore={liveScore}
      confidence={snapshot.confidence}
      alerts={snapshot.alerts}
      fields={[
        { label: 'Expected yield', value: `${snapshot.data.expectedYield.toFixed(1)} tn/ha` },
        { label: 'Stress yield', value: `${snapshot.data.stressYield.toFixed(1)} tn/ha` },
        { label: 'Yield volatility', value: `${snapshot.data.yieldVolatility}%` },
      ]}
    />
  );
}
