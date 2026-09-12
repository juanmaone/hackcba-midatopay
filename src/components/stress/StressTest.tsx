import { Activity, CloudRain, DollarSign, Gauge, Wind } from 'lucide-react';
import type { ScenarioKey, StressScenario } from '../../types/underwriting';
import { SectionLabel } from '../ui/SectionLabel';

export function StressTest({ selected, scenarios, onChange }: { selected: ScenarioKey; scenarios: StressScenario[]; onChange: (key: ScenarioKey) => void }) {
  const active = scenarios.find((item) => item.key === selected) ?? scenarios[0];
  return <section className="card stress-card"><div className="card-header"><div><SectionLabel>DECISION SIMULATOR</SectionLabel><h2>STRESS TEST</h2></div><div className="pulse-label"><Activity size={14} /> LIVE SIMULATION</div></div>
    <div className="scenario-tabs">{scenarios.map((scenario) => <button key={scenario.key} className={scenario.key === selected ? 'active' : ''} onClick={() => onChange(scenario.key)}><span className={`scenario-dot dot-${scenario.risk}`} />{scenario.label}</button>)}</div>
    <div className="stress-output"><div className="stress-main"><span>AGROSCORE</span><strong key={active.score}>{active.score}</strong><small>/ 100</small><div className={`risk-chip risk-${active.risk}`}>{active.risk === 'low' ? 'SUPPORTED' : active.risk === 'medium' ? 'WATCH' : 'OUTSIDE LIMIT'}</div></div><div className="stress-metrics"><div><CloudRain size={15} /><span>Yield</span><strong>{active.yield.toFixed(1)} <small>tn/ha</small></strong></div><div><Gauge size={15} /><span>DSCR</span><strong>{active.dscr.toFixed(2)}x</strong></div><div><DollarSign size={15} /><span>Safe exposure</span><strong>ARS {active.exposure / 1_000_000}M</strong></div></div></div>
    <div className={`stress-callout callout-${active.risk}`}><Wind size={16} /><span>{active.key === 'base' ? 'Current operating case. Strong productive profile supports a limited approval.' : active.key === 'combined' ? 'Severe scenario. Recommend rejecting or restructuring the requested exposure.' : 'Scenario pressure reduces supported exposure. Monitor before next disbursement.'}</span></div>
  </section>;
}
