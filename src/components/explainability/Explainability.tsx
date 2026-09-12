import { getProductiveResilience } from '../../domain/scoring/calculations';
import { SectionLabel } from '../ui/SectionLabel';
import type { ScenarioKey } from '../../types/underwriting';

interface ExplainabilityProps { scenarioKey: ScenarioKey; financialCapacity: number }

export function Explainability({ scenarioKey, financialCapacity }: ExplainabilityProps) {
  const isStress = scenarioKey !== 'base';
  const productiveResilience = getProductiveResilience(scenarioKey);
  const contributions = [
    { label: 'Estabilidad productiva', value: isStress ? 10 : 14, type: 'positive' },
    { label: 'Condiciones de suelo y agua', value: 11, type: 'positive' },
    { label: 'Rendimiento histórico', value: 8, type: 'positive' },
    { label: 'Estabilidad de vegetación', value: isStress ? 4 : 7, type: 'positive' },
    { label: 'Resiliencia climática', value: isStress ? 2 : 6, type: 'positive' },
    { label: 'Apalancamiento financiero', value: -9, type: 'negative' },
    { label: 'Mora histórica', value: -5, type: 'negative' },
    { label: 'Volatilidad del rendimiento', value: isStress ? -7 : -3, type: 'negative' },
  ];
  return <section className="card explain-card"><div className="card-header"><div><SectionLabel>LÓGICA DE DECISIÓN</SectionLabel><h2>¿Por qué este puntaje?</h2></div><span className="rule-tag"><span className="rule-dot" /> BASADO EN REGLAS</span></div><div className="explain-body"><div className="contribution-chart" aria-label="Contribuciones al puntaje">{contributions.map((contribution) => <div className="contribution" key={contribution.label}><div className="contribution-bar"><i className={contribution.type} style={{ height: `${Math.abs(contribution.value) / 14 * 100}%` }} /></div><strong className={contribution.type}>{contribution.value > 0 ? '+' : ''}{contribution.value}</strong><span>{contribution.label}</span></div>)}</div><div className="capacity-bars"><div><span>Capacidad financiera <b>{financialCapacity}</b></span><div className="capacity-track"><i className="amber-fill" style={{ width: `${financialCapacity}%` }} /></div></div><div><span>Resiliencia productiva <b>{productiveResilience}</b></span><div className="capacity-track"><i className="green-fill" style={{ width: `${productiveResilience}%` }} /></div></div><p>La resiliencia productiva compensa parcialmente un perfil financiero más débil.</p></div></div></section>;
}
