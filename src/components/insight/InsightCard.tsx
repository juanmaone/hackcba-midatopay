import { ArrowUpRight, TrendingUp } from 'lucide-react';
import { SectionLabel } from '../ui/SectionLabel';
import type { StressScenario } from '../../types/underwriting';

const formatCompact = (amount: number) => `ARS ${(amount / 1_000_000).toFixed(0)}M`;

interface InsightCardProps { scenario: StressScenario; requestedAmount: number }

export function InsightCard({ scenario, requestedAmount }: InsightCardProps) {
  const isSevere = scenario.key === 'combined';
  return <section className="insight-card"><div className="insight-head"><div className="insight-symbol"><TrendingUp size={17} /></div><div><SectionLabel>ANÁLISIS DE EVALUACIÓN</SectionLabel><span>Apoyo a la decisión · Caso demo</span></div><span className="confidence-tag">EXPLICABLE</span></div><p>{isSevere ? 'El estrés combinado lleva la cobertura de servicio de deuda por debajo del umbral mínimo. La exposición solicitada debería reestructurarse antes del desembolso.' : `La resiliencia productiva compensa parcialmente un perfil financiero más débil. El escenario seleccionado respalda una exposición inicial de ${formatCompact(scenario.exposure)}, mientras que el monto solicitado de ${formatCompact(requestedAmount)} se vuelve vulnerable bajo presión.`}</p><div className="insight-rule"><span>Recomendación</span><strong>{isSevere ? 'Reestructurar exposición' : 'Aprobar con límite'}</strong></div><button className="text-button">Ver evidencia <ArrowUpRight size={14} /></button></section>;
}
