import { Layers } from 'lucide-react';
import type { SoilAgentResult } from '../../../shared/types';
import type { RealSoilMoistureData } from '../../services/api/soilMoistureClient';
import { AgentPanelBase } from './AgentPanelBase';

interface SoilPanelProps { snapshot: SoilAgentResult; liveScore?: number; realSoilMoisture?: RealSoilMoistureData }

export function SoilPanel({ snapshot, liveScore, realSoilMoisture }: SoilPanelProps) {
  const fields = [
    { label: 'pH del suelo', value: `${snapshot.data.ph}` },
    { label: 'Carbono orgánico', value: `${snapshot.data.organicCarbon} g/kg` },
    { label: 'Clase textural', value: snapshot.data.textureClass },
  ];
  if (realSoilMoisture) {
    fields.push({ label: `Humedad de raíz (${realSoilMoisture.asOfDate})`, value: `${(realSoilMoisture.rootZoneWetness * 100).toFixed(0)}%` });
  }
  return (
    <AgentPanelBase
      icon={Layers}
      title="Suelo"
      snapshotScore={snapshot.score}
      liveScore={liveScore}
      confidence={snapshot.confidence}
      alerts={snapshot.alerts}
      fields={fields}
      sourceLink={realSoilMoisture ? { label: 'Verificar en NASA POWER ↗', href: realSoilMoisture.sourceUrl } : undefined}
    />
  );
}
