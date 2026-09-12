import type { LucideIcon } from 'lucide-react';
import { SectionLabel } from '../ui/SectionLabel';
import type { Alert } from '../../../shared/types';

interface AgentPanelBaseProps {
  icon: LucideIcon;
  title: string;
  snapshotScore: number;
  liveScore?: number;
  confidence: number;
  fields: Array<{ label: string; value: string }>;
  alerts: Alert[];
}

export function AgentPanelBase({ icon: Icon, title, snapshotScore, liveScore, confidence, fields, alerts }: AgentPanelBaseProps) {
  const score = liveScore ?? snapshotScore;
  const latestAlert = alerts[alerts.length - 1];
  return (
    <section className="card agent-panel">
      <div className="card-header">
        <div className="agent-panel-icon"><Icon size={16} /></div>
        {liveScore !== undefined && <span className="agent-panel-live"><span className="live-dot" /> LIVE</span>}
      </div>
      <SectionLabel>{title.toUpperCase()}</SectionLabel>
      <div className="agent-panel-score"><strong>{score}</strong><span>/ 100 · {(confidence * 100).toFixed(0)}% confidence</span></div>
      <div className="agent-panel-fields">
        {fields.map((field) => <div className="metric-row" key={field.label}><span>{field.label}</span><strong>{field.value}</strong></div>)}
      </div>
      {latestAlert && <div className="agent-panel-alert">{latestAlert.message}</div>}
    </section>
  );
}
