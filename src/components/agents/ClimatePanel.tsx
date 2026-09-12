import { CloudRain } from 'lucide-react';
import type { ClimateAgentResult } from '../../../shared/types';
import { AgentPanelBase } from './AgentPanelBase';

interface ClimatePanelProps { snapshot: ClimateAgentResult; liveScore?: number }

export function ClimatePanel({ snapshot, liveScore }: ClimatePanelProps) {
  return (
    <AgentPanelBase
      icon={CloudRain}
      title="Climate"
      snapshotScore={snapshot.score}
      liveScore={liveScore}
      confidence={snapshot.confidence}
      alerts={snapshot.alerts}
      fields={[
        { label: 'Historical rainfall', value: `${snapshot.data.historicalRainfall} mm` },
        { label: 'Rainfall anomaly', value: `${snapshot.data.rainfallAnomaly}%` },
        { label: 'Drought risk', value: snapshot.data.droughtRisk },
      ]}
    />
  );
}
