import { Newspaper } from 'lucide-react';
import type { NewsAgentResult } from '../../../shared/types';
import { AgentPanelBase } from './AgentPanelBase';

interface NewsPanelProps { snapshot: NewsAgentResult; liveScore?: number }

export function NewsPanel({ snapshot, liveScore }: NewsPanelProps) {
  return (
    <AgentPanelBase
      icon={Newspaper}
      title="News"
      snapshotScore={snapshot.score}
      liveScore={liveScore}
      confidence={snapshot.confidence}
      alerts={snapshot.alerts}
      fields={[
        { label: 'Articles analyzed', value: `${snapshot.data.articleCount}` },
        { label: 'Avg sentiment', value: snapshot.data.avgSentiment.toFixed(2) },
        { label: 'Top themes', value: snapshot.data.topThemes.join(', ') },
      ]}
    />
  );
}
