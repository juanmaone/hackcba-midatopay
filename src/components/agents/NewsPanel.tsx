import { Newspaper } from 'lucide-react';
import type { NewsAgentResult } from '../../../shared/types';
import { AgentPanelBase } from './AgentPanelBase';

interface NewsPanelProps { snapshot: NewsAgentResult; liveScore?: number }

export function NewsPanel({ snapshot, liveScore }: NewsPanelProps) {
  return (
    <AgentPanelBase
      icon={Newspaper}
      title="Noticias"
      snapshotScore={snapshot.score}
      liveScore={liveScore}
      confidence={snapshot.confidence}
      alerts={snapshot.alerts}
      fields={[
        { label: 'Artículos analizados', value: `${snapshot.data.articleCount}` },
        { label: 'Sentimiento promedio', value: snapshot.data.avgSentiment.toFixed(2) },
        { label: 'Temas principales', value: snapshot.data.topThemes.join(', ') },
      ]}
    />
  );
}
