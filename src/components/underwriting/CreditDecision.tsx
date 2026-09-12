import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { StressScenario, UnderwritingCase } from '../../types/underwriting';
import { SectionLabel } from '../ui/SectionLabel';

const formatCompact = (amount: number) => `ARS ${(amount / 1_000_000).toFixed(0)}M`;

export function CreditDecision({ caseData, scenario }: { caseData: UnderwritingCase; scenario: StressScenario }) {
  const requested = caseData.loan.requestedAmount;
  const supportedPercent = Math.min(100, scenario.exposure / requested * 100);
  const isSevere = scenario.risk === 'high';
  return <section className="card decision-card"><div className="card-header"><div><SectionLabel>CREDIT DECISION</SectionLabel><h2>Exposure recommendation</h2></div><div className="decision-mark"><span className="live-dot" /> {scenario.key === 'base' ? 'DEMO' : 'UPDATED'}</div></div><div className="amounts"><div><span>Requested exposure</span><strong>{formatCompact(requested)}</strong></div><ArrowRight size={18} /><div className="recommended"><span>Recommended exposure</span><strong>{formatCompact(scenario.exposure)}</strong></div></div><div className="exposure-bar"><div className="bar-label"><span>Requested <b>{formatCompact(requested)}</b></span><span>Supported <b>{formatCompact(scenario.exposure)}</b></span></div><div className="bar-track"><i style={{ width: `${supportedPercent}%` }} /><span style={{ left: `${supportedPercent}%` }} /></div></div><div className="dscr-grid"><div><span>Base DSCR</span><strong>{caseData.underwriting.baseDSCR.toFixed(2)}x</strong></div><div><span>Stress DSCR</span><strong className={scenario.dscr < 1.2 ? 'text-negative' : ''}>{scenario.dscr.toFixed(2)}x</strong></div><div><span>Term</span><strong>{caseData.loan.termMonths} mo</strong></div></div><div className={`decision-note ${isSevere ? 'negative-note' : ''}`}><div className="note-icon">{isSevere ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}</div><span>{isSevere ? 'Combined stress falls below the 1.20x minimum debt service coverage.' : 'Requested exposure exceeds the supported amount under this scenario.'}</span></div></section>;
}
