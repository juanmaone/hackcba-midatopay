import { Activity, CloudRain, DollarSign, Gauge, Wind } from 'lucide-react';
import { calculateExpectedRevenue } from '../../domain/scoring/calculations';
import type { ScenarioKey, StressScenario } from '../../types/underwriting';
import { SectionLabel } from '../ui/SectionLabel';

interface StressTestProps { selected: ScenarioKey; scenarios: StressScenario[]; hectares: number; onChange: (key: ScenarioKey) => void }

export function StressTest({ selected, scenarios, hectares, onChange }: StressTestProps) {
  const active = scenarios.find((item) => item.key === selected) ?? scenarios[0];
  const price = selected === 'price' || selected === 'combined' ? 142_400 : 178_000;
  const revenue = calculateExpectedRevenue(hectares, active.yield, price);
  return <section className="card stress-card"><div className="card-header"><div><SectionLabel>MOTOR DE ESTRÉS A EXPOSICIÓN</SectionLabel><h2>Simulador de decisión</h2></div><div className="pulse-label"><Activity size={14} /> SIMULACIÓN EN VIVO</div></div><div className="scenario-tabs" role="tablist">{scenarios.map((scenario) => <button type="button" role="tab" aria-selected={scenario.key === selected} key={scenario.key} className={scenario.key === selected ? 'active' : ''} onClick={() => onChange(scenario.key)}><span className={`scenario-dot dot-${scenario.risk}`} />{scenario.label}</button>)}</div><div className="stress-output"><div className="stress-main"><span>AGROSCORE</span><strong key={active.score}>{active.score}</strong><small>/ 100</small><div className={`risk-chip risk-${active.risk}`}>{active.risk === 'low' ? 'SOPORTADO' : active.risk === 'medium' ? 'VIGILAR' : 'FUERA DE LÍMITE'}</div></div><div className="stress-metrics"><div><CloudRain size={15} /><span>Rendimiento</span><strong>{active.yield.toFixed(1)} <small>tn/ha</small></strong></div><div><Gauge size={15} /><span>DSCR</span><strong className={active.dscr < 1.2 ? 'text-negative' : ''}>{active.dscr.toFixed(2)}x</strong></div><div><DollarSign size={15} /><span>Exposición segura</span><strong>ARS {active.exposure / 1_000_000}M</strong></div><div><Activity size={15} /><span>Ingreso bruto</span><strong>{formatRevenue(revenue)}</strong></div></div></div><div className={`stress-callout callout-${active.risk}`}><Wind size={16} /><span>{active.key === 'base' ? 'Caso operativo actual. El perfil productivo sólido respalda una aprobación limitada.' : active.key === 'combined' ? 'Escenario severo. Se recomienda rechazar o reestructurar la exposición solicitada.' : 'La presión del escenario reduce la exposición soportada. Monitorear antes del próximo desembolso.'}</span></div></section>;
}

function formatRevenue(amount: number) { return `ARS ${(amount / 1_000_000).toFixed(1)}M`; }
