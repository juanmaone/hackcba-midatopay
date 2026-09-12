import { ArrowUpRight, Info, ShieldCheck } from 'lucide-react';
import type { StressScenario, UnderwritingCase } from '../../types/underwriting';
import { getScoreTone } from '../../domain/scoring/calculations';
import { SectionLabel } from '../ui/SectionLabel';
import { ScoreRing } from '../ui/ScoreRing';

interface ScoreSummaryProps { caseData: UnderwritingCase; scenario: StressScenario }

export function ScoreSummary({ caseData, scenario }: ScoreSummaryProps) {
  const financialTone = getScoreTone(caseData.financial.score);
  const productiveScore = scenario.key === 'combined' ? 69 : scenario.key === 'drought' ? 78 : scenario.key === 'price' ? 84 : 87;
  const rating = scenario.key === 'base' ? caseData.underwriting.rating : scenario.score >= 70 ? 'B' : 'C';
  return <section className="score-summary card"><div className="card-header"><div><SectionLabel>UNDERWRITING SUMMARY</SectionLabel><h2>Risk profile</h2></div><button className="icon-btn" aria-label="More information" title="Score methodology"><Info size={16} /></button></div><div className="score-grid"><div className="mini-score"><SectionLabel>FINANCIAL CAPACITY</SectionLabel><strong className={`text-${financialTone}`}>{caseData.financial.score}</strong><span>/ 100</span><div className="meter"><i style={{ width: `${caseData.financial.score}%` }} /></div></div><div className="mini-score"><SectionLabel>PRODUCTIVE RESILIENCE</SectionLabel><strong className="text-positive">{productiveScore}</strong><span>/ 100</span><div className="meter meter-green"><i style={{ width: `${productiveScore}%` }} /></div></div></div><div className="agro-score-row"><div><SectionLabel>AGROSCORE</SectionLabel><span className="score-caption">Rule-based underwriting score <Info size={12} /></span></div><div className="agro-score-value"><ScoreRing score={scenario.score} size="lg" tone={scenario.risk === 'high' ? 'red' : scenario.risk === 'medium' ? 'amber' : 'green'} /><div><strong>{scenario.score}</strong><span>Rating {rating}</span></div></div></div><div className={`risk-ribbon risk-${scenario.risk}`}><ShieldCheck size={16} /><div><strong>{scenario.decision}</strong><span>{scenario.risk === 'high' ? 'Exposure requires a revised structure.' : 'Within supported productive capacity.'}</span></div><ArrowUpRight size={17} /></div></section>;
}
