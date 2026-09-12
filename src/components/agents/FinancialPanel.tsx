import { Landmark } from 'lucide-react';
import type { FinancialAgentResult } from '../../../shared/types';
import { AgentPanelBase } from './AgentPanelBase';

interface FinancialPanelProps { snapshot: FinancialAgentResult; liveScore?: number }

export function FinancialPanel({ snapshot, liveScore }: FinancialPanelProps) {
  return (
    <AgentPanelBase
      icon={Landmark}
      title="Financial"
      snapshotScore={snapshot.score}
      liveScore={liveScore}
      confidence={snapshot.confidence}
      alerts={snapshot.alerts}
      fields={[
        { label: 'Total debt', value: `ARS ${new Intl.NumberFormat('es-AR').format(snapshot.data.totalDebt)}` },
        { label: 'Delinquency status', value: `${snapshot.data.delinquencyStatus}` },
        { label: 'Days overdue', value: `${snapshot.data.daysOverdue}` },
      ]}
    />
  );
}
