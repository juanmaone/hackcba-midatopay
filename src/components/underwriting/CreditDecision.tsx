import { ArrowRight, CircleAlert } from 'lucide-react';
import type { StressScenario, UnderwritingCase } from '../../types/underwriting';
import { SectionLabel } from '../ui/SectionLabel';

const formatCompact = (amount: number) => `ARS ${(amount / 1_000_000).toFixed(0)}M`;

export function CreditDecision({ caseData, scenario }: { caseData: UnderwritingCase; scenario: StressScenario }) {
  const requested = caseData.loan.requestedAmount;
  return <section className="card decision-card"><div className="card-header"><div><SectionLabel>CREDIT DECISION</SectionLabel><h2>Recommended exposure</h2></div><div className="decision-mark"><span className="live-dot" /> DEMO</div></div>
    <div className="amounts"><div><span>Requested amount</span><strong>{formatCompact(requested)}</strong></div><ArrowRight size={19} /><div className="recommended"><span>Recommended exposure</span><strong>{formatCompact(scenario.exposure)}</strong></div></div>
    <div className="exposure-bar"><div className="bar-label"><span>Requested <b>{formatCompact(requested)}</b></span><span>Supported <b>{formatCompact(scenario.exposure)}</b></span></div><div className="bar-track"><i style={{ width: `${scenario.exposure / requested * 100}%` }} /><span style={{ left: `${scenario.exposure / requested * 100}%` }} /></div></div>
    <div className="dscr-grid"><div><span>Base DSCR</span><strong>{scenario.key === 'base' ? '1.82x' : '1.82x'}</strong></div><div><span>Stress DSCR</span><strong className={scenario.dscr < 1.2 ? 'text-negative' : ''}>{scenario.dscr.toFixed(2)}x</strong></div><div><span>Term</span><strong>{caseData.loan.termMonths} mo</strong></div></div>
    <div className={`decision-note ${scenario.risk === 'high' ? 'negative-note' : ''}`}><CircleAlert size={16} /><span>{scenario.risk === 'high' ? 'Combined stress falls below minimum debt service coverage.' : 'The requested exposure exceeds the amount supported under the selected stress scenario.'}</span></div>
  </section>;
}
