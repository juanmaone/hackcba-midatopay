import { CloudRain } from 'lucide-react';
import type { ClimateAgentResult } from '../../../shared/types';
import type { RealClimateData } from '../../services/api/climateClient';
import { AgentPanelBase } from './AgentPanelBase';

const DROUGHT_RISK_LABEL: Record<ClimateAgentResult['data']['droughtRisk'], string> = { low: 'Bajo', medium: 'Medio', high: 'Alto' };

interface ClimatePanelProps { snapshot: ClimateAgentResult; liveScore?: number; realClimate?: RealClimateData }

export function ClimatePanel({ snapshot, liveScore, realClimate }: ClimatePanelProps) {
  const rainfall = realClimate?.annualRainfallMm ?? snapshot.data.historicalRainfall;
  const anomaly = realClimate?.rainfallAnomalyPercent ?? snapshot.data.rainfallAnomaly;
  // The mock's rainfall alerts describe the mock's own -12% figure — once real data resolves,
  // only keep them if the real anomaly still crosses the same "below average" threshold they
  // reference, otherwise they'd contradict the real numbers shown right above them.
  const alerts = realClimate ? snapshot.alerts.filter((alert) => alert.metric !== 'rainfallAnomaly' || realClimate.rainfallAnomalyPercent < alert.threshold) : snapshot.alerts;
  return (
    <AgentPanelBase
      icon={CloudRain}
      title="Clima"
      snapshotScore={snapshot.score}
      liveScore={liveScore}
      confidence={snapshot.confidence}
      alerts={alerts}
      fields={[
        { label: 'Lluvia histórica', value: `${rainfall} mm` },
        { label: 'Anomalía de lluvia', value: `${anomaly}%` },
        { label: 'Riesgo de sequía', value: DROUGHT_RISK_LABEL[snapshot.data.droughtRisk] },
      ]}
      sourceLink={realClimate ? { label: 'Verificar en Open-Meteo ↗', href: realClimate.sourceUrl } : undefined}
    />
  );
}
