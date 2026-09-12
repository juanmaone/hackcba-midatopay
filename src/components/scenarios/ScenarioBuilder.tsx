import { useMemo, useState } from 'react';
import { Activity, CloudRain, DollarSign, Gauge, RotateCcw, Wind } from 'lucide-react';
import type { UnderwritingCase } from '../../types/underwriting';
import { calculateExpectedRevenue, calculateScenario } from '../../domain/scoring/calculations';
import { SectionLabel } from '../ui/SectionLabel';

interface ScenarioBuilderProps { caseData: UnderwritingCase }

// Same 4 multiplier pairs as server/engine/stressScenarios.ts's SCENARIO_MULTIPLIERS, expressed as
// the slider's 0-50% "drop" scale (dropPct = (1 - multiplier) * 100) — lets a preset button set the
// same sliders the analyst can also drag freely, instead of duplicating a separate lookup path.
const PRESETS: { key: string; label: string; yieldDropPct: number; priceDropPct: number }[] = [
  { key: 'base', label: 'CASO BASE', yieldDropPct: 0, priceDropPct: 0 },
  { key: 'drought', label: 'SEQUÍA -30%', yieldDropPct: 30, priceDropPct: 0 },
  { key: 'price', label: 'PRECIO -20%', yieldDropPct: 0, priceDropPct: 20 },
  { key: 'combined', label: 'SEQUÍA + PRECIO', yieldDropPct: 30, priceDropPct: 20 },
];

const TERM_OPTIONS = [6, 12, 18, 24, 36];

const formatCompact = (amount: number) => `ARS ${(amount / 1_000_000).toFixed(0)}M`;
const formatRevenue = (amount: number) => `ARS ${(amount / 1_000_000).toFixed(1)}M`;

const CALLOUT_TEXT: Record<'low' | 'medium' | 'high', string> = {
  low: 'El perfil productivo sólido respalda una aprobación dentro del monto ajustado.',
  medium: 'La presión del escenario reduce la exposición soportada. Monitorear antes del desembolso.',
  high: 'Escenario severo. Se recomienda rechazar o reestructurar la exposición solicitada.',
};

export function ScenarioBuilder({ caseData }: ScenarioBuilderProps) {
  const [yieldDropPct, setYieldDropPct] = useState(0);
  const [priceDropPct, setPriceDropPct] = useState(0);
  const [requestedAmount, setRequestedAmount] = useState(caseData.loan.requestedAmount);
  const [termMonths, setTermMonths] = useState(caseData.loan.termMonths);

  const yieldMultiplier = 1 - yieldDropPct / 100;
  const priceMultiplier = 1 - priceDropPct / 100;

  const result = useMemo(
    () => calculateScenario(caseData, { yieldMultiplier, priceMultiplier, requestedAmount, termMonths }),
    [caseData, yieldMultiplier, priceMultiplier, requestedAmount, termMonths],
  );
  const stressedYield = caseData.production.expectedYield * yieldMultiplier;
  const revenue = calculateExpectedRevenue(caseData.field.hectares, stressedYield, 178_000 * priceMultiplier);

  const reset = () => {
    setYieldDropPct(0);
    setPriceDropPct(0);
    setRequestedAmount(caseData.loan.requestedAmount);
    setTermMonths(caseData.loan.termMonths);
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setYieldDropPct(preset.yieldDropPct);
    setPriceDropPct(preset.priceDropPct);
  };

  const activePreset = PRESETS.find((preset) => preset.yieldDropPct === yieldDropPct && preset.priceDropPct === priceDropPct)?.key;

  return <div className="scenario-builder-page">
    <div className="card scenario-builder-intro">
      <SectionLabel>CONSTRUCTOR DE ESCENARIOS</SectionLabel>
      <h2>Simulá condiciones de mercado y clima</h2>
      <p>Ajustá la severidad de forma continua — más allá de los 4 escenarios fijos del panel de resumen — y mirá cómo se mueven el AgroScore, el DSCR y la exposición recomendada en tiempo real.</p>
    </div>
    <div className="scenario-builder-grid">
      <section className="card scenario-builder-controls">
        <div className="card-header"><div><SectionLabel>PARÁMETROS</SectionLabel><h2>Ajustar condiciones</h2></div><button className="text-button" onClick={reset}><RotateCcw size={13} /> Restablecer</button></div>
        <div className="scenario-tabs" role="tablist">
          {PRESETS.map((preset) => <button type="button" role="tab" aria-selected={preset.key === activePreset} key={preset.key} className={preset.key === activePreset ? 'active' : ''} onClick={() => applyPreset(preset)}>{preset.label}</button>)}
        </div>
        <div className="builder-slider">
          <div className="builder-slider-label"><span>Caída de rendimiento</span><b>{yieldDropPct}%</b></div>
          <input type="range" min={0} max={50} value={yieldDropPct} onChange={(event) => setYieldDropPct(Number(event.target.value))} aria-label="Caída de rendimiento" />
        </div>
        <div className="builder-slider">
          <div className="builder-slider-label"><span>Caída de precio</span><b>{priceDropPct}%</b></div>
          <input type="range" min={0} max={50} value={priceDropPct} onChange={(event) => setPriceDropPct(Number(event.target.value))} aria-label="Caída de precio" />
        </div>
        <div className="builder-inputs">
          <label>Monto solicitado<input type="number" min={0} step={1_000_000} value={requestedAmount} onChange={(event) => setRequestedAmount(Number(event.target.value))} /></label>
          <label>Plazo<select value={termMonths} onChange={(event) => setTermMonths(Number(event.target.value))}>{TERM_OPTIONS.map((months) => <option key={months} value={months}>{months} meses</option>)}</select></label>
        </div>
      </section>
      <section className="card stress-card">
        <div className="card-header"><div><SectionLabel>RESULTADO EN VIVO</SectionLabel><h2>Impacto en la decisión</h2></div><div className="pulse-label"><Activity size={14} /> SIMULACIÓN EN VIVO</div></div>
        <div className="stress-output">
          <div className="stress-main"><span>AGROSCORE</span><strong key={result.score}>{result.score}</strong><small>/ 100</small><div className={`risk-chip risk-${result.risk}`}>{result.risk === 'low' ? 'SOPORTADO' : result.risk === 'medium' ? 'VIGILAR' : 'FUERA DE LÍMITE'}</div></div>
          <div className="stress-metrics">
            <div><CloudRain size={15} /><span>Rendimiento</span><strong>{stressedYield.toFixed(1)} <small>tn/ha</small></strong></div>
            <div><Gauge size={15} /><span>DSCR</span><strong className={result.dscr < 1.2 ? 'text-negative' : ''}>{result.dscr.toFixed(2)}x</strong></div>
            <div><DollarSign size={15} /><span>Exposición recomendada</span><strong>{formatCompact(result.exposure)}</strong></div>
            <div><Activity size={15} /><span>Ingreso bruto</span><strong>{formatRevenue(revenue)}</strong></div>
          </div>
        </div>
        <div className={`stress-callout callout-${result.risk}`}><Wind size={16} /><span>{CALLOUT_TEXT[result.risk]}</span></div>
      </section>
    </div>
  </div>;
}
