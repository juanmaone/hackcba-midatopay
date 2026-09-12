import { Layers } from 'lucide-react';
import type { SoilAgentResult } from '../../../shared/types';
import { AgentPanelBase } from './AgentPanelBase';

interface SoilPanelProps { snapshot: SoilAgentResult; liveScore?: number }

export function SoilPanel({ snapshot, liveScore }: SoilPanelProps) {
  return (
    <AgentPanelBase
      icon={Layers}
      title="Suelo"
      snapshotScore={snapshot.score}
      liveScore={liveScore}
      confidence={snapshot.confidence}
      alerts={snapshot.alerts}
      fields={[
        { label: 'pH del suelo', value: `${snapshot.data.ph}` },
        { label: 'Carbono orgánico', value: `${snapshot.data.organicCarbon} g/kg` },
        { label: 'Clase textural', value: snapshot.data.textureClass },
      ]}
    />
  );
}
