import { Layers } from 'lucide-react';
import type { SoilAgentResult } from '../../../shared/types';
import { AgentPanelBase } from './AgentPanelBase';

interface SoilPanelProps { snapshot: SoilAgentResult; liveScore?: number }

export function SoilPanel({ snapshot, liveScore }: SoilPanelProps) {
  return (
    <AgentPanelBase
      icon={Layers}
      title="Soil"
      snapshotScore={snapshot.score}
      liveScore={liveScore}
      confidence={snapshot.confidence}
      alerts={snapshot.alerts}
      fields={[
        { label: 'Soil pH', value: `${snapshot.data.ph}` },
        { label: 'Organic carbon', value: `${snapshot.data.organicCarbon} g/kg` },
        { label: 'Texture class', value: snapshot.data.textureClass },
      ]}
    />
  );
}
