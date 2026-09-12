import type { AssessmentResponse } from '../../../shared/types';
import { useLiveAgentUpdates } from '../../hooks/useLiveAgentUpdates';
import { SectionLabel } from '../ui/SectionLabel';
import { FinancialPanel } from './FinancialPanel';
import { ClimatePanel } from './ClimatePanel';
import { YieldPanel } from './YieldPanel';
import { SoilPanel } from './SoilPanel';
import { NewsPanel } from './NewsPanel';

interface AgentPanelsSectionProps { assessment: AssessmentResponse }

export function AgentPanelsSection({ assessment }: AgentPanelsSectionProps) {
  const live = useLiveAgentUpdates(assessment.caseId);
  return (
    <div className="agent-panels-section">
      <div className="agent-panels-heading">
        <SectionLabel>AGENT SIGNALS</SectionLabel>
        <span className={`agent-panels-status ${live.connected ? 'connected' : ''}`}><span className="live-dot" /> {live.connected ? 'LIVE' : 'REST SNAPSHOT'}</span>
      </div>
      <div className="agent-panels">
        <FinancialPanel snapshot={assessment.agents.financial} liveScore={live.scores.financial} />
        <ClimatePanel snapshot={assessment.agents.climate} liveScore={live.scores.climate} />
        <YieldPanel snapshot={assessment.agents.yield} liveScore={live.scores.yield} />
        <SoilPanel snapshot={assessment.agents.soil} liveScore={live.scores.soil} />
        <NewsPanel snapshot={assessment.agents.news} liveScore={live.scores.news} />
      </div>
    </div>
  );
}
