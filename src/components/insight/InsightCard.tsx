import { ArrowUpRight, TrendingUp } from 'lucide-react';
import { SectionLabel } from '../ui/SectionLabel';
import type { StressScenario } from '../../types/underwriting';

const formatCompact = (amount: number) => `ARS ${(amount / 1_000_000).toFixed(0)}M`;

interface InsightCardProps { scenario: StressScenario; requestedAmount: number }

export function InsightCard({ scenario, requestedAmount }: InsightCardProps) {
  const isSevere = scenario.key === 'combined';
  return <section className="insight-card"><div className="insight-head"><div className="insight-symbol"><TrendingUp size={17} /></div><div><SectionLabel>UNDERWRITING INSIGHT</SectionLabel><span>Decision support · Demo case</span></div><span className="confidence-tag">EXPLAINABLE</span></div><p>{isSevere ? 'Combined stress pushes debt service coverage below the minimum threshold. The requested exposure should be restructured before disbursement.' : `Productive resilience partially offsets a weaker financial profile. The selected scenario supports an initial exposure of ${formatCompact(scenario.exposure)}, while the requested ${formatCompact(requestedAmount)} becomes vulnerable under pressure.`}</p><div className="insight-rule"><span>Recommendation</span><strong>{isSevere ? 'Restructure exposure' : 'Approve with limit'}</strong></div><button className="text-button">View evidence <ArrowUpRight size={14} /></button></section>;
}
