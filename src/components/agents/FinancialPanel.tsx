import { Landmark } from 'lucide-react';
import type { FinancialAgentResult } from '../../../shared/types';
import { AgentPanelBase } from './AgentPanelBase';

interface FinancialPanelProps { snapshot: FinancialAgentResult; liveScore?: number }

export function FinancialPanel({ snapshot, liveScore }: FinancialPanelProps) {
  return (
    <AgentPanelBase
      icon={Landmark}
      title="Financiero"
      snapshotScore={snapshot.score}
      liveScore={liveScore}
      confidence={snapshot.confidence}
      alerts={snapshot.alerts}
      fields={[
        { label: 'Deuda total', value: `ARS ${new Intl.NumberFormat('es-AR').format(snapshot.data.totalDebt)}` },
        { label: 'Estado de mora', value: `${snapshot.data.delinquencyStatus}` },
        { label: 'Días de atraso', value: `${snapshot.data.daysOverdue}` },
      ]}
    />
  );
}
