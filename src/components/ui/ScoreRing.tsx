import type { CSSProperties } from 'react';

interface ScoreRingProps { score: number; size?: 'sm' | 'lg'; tone?: 'green' | 'amber' | 'red' }

export function ScoreRing({ score, size = 'sm', tone = 'green' }: ScoreRingProps) {
  return <div className={`score-ring score-ring-${size} score-ring-${tone}`} style={{ '--score': `${score * 3.6}deg` } as CSSProperties}><div className="score-ring-inner"><strong>{score}</strong><span>/ 100</span></div></div>;
}
