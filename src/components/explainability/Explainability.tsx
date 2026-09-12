import { getProductiveResilience } from '../../domain/scoring/calculations';
import { SectionLabel } from '../ui/SectionLabel';
import type { ScenarioKey } from '../../types/underwriting';

interface ExplainabilityProps { scenarioKey: ScenarioKey; financialCapacity: number }

export function Explainability({ scenarioKey, financialCapacity }: ExplainabilityProps) {
  const isStress = scenarioKey !== 'base';
  const productiveResilience = getProductiveResilience(scenarioKey);
  const contributions = [
    { label: 'Productive stability', value: isStress ? 10 : 14, type: 'positive' },
    { label: 'Soil & water conditions', value: 11, type: 'positive' },
    { label: 'Historical yield', value: 8, type: 'positive' },
    { label: 'Vegetation stability', value: isStress ? 4 : 7, type: 'positive' },
    { label: 'Climate resilience', value: isStress ? 2 : 6, type: 'positive' },
    { label: 'Financial leverage', value: -9, type: 'negative' },
    { label: 'Historical delinquency', value: -5, type: 'negative' },
    { label: 'Yield volatility', value: isStress ? -7 : -3, type: 'negative' },
  ];
  return <section className="card explain-card"><div className="card-header"><div><SectionLabel>DECISION LOGIC</SectionLabel><h2>Why this score?</h2></div><span className="rule-tag"><span className="rule-dot" /> RULE-BASED</span></div><div className="explain-body"><div className="contribution-chart" aria-label="Score contributions">{contributions.map((contribution) => <div className="contribution" key={contribution.label}><div className="contribution-bar"><i className={contribution.type} style={{ height: `${Math.abs(contribution.value) / 14 * 100}%` }} /></div><strong className={contribution.type}>{contribution.value > 0 ? '+' : ''}{contribution.value}</strong><span>{contribution.label}</span></div>)}</div><div className="capacity-bars"><div><span>Financial capacity <b>{financialCapacity}</b></span><div className="capacity-track"><i className="amber-fill" style={{ width: '61%' }} /></div></div><div><span>Productive resilience <b>{productiveResilience}</b></span><div className="capacity-track"><i className="green-fill" style={{ width: `${productiveResilience}%` }} /></div></div><p>Productive resilience partially offsets a weaker financial profile.</p></div></div></section>;
}
