import { useMemo, useState } from 'react';
import { Bell, BookOpen, Check, ChevronDown, MapPinned, Menu } from 'lucide-react';
import type { AssessmentRequest } from '../shared/types';
import { demoCase, scenarios } from './data/demoCase';
import { calculateExpectedRevenue } from './domain/scoring/calculations';
import { useAssessment } from './hooks/useAssessment';
import { useClimateData } from './hooks/useClimateData';
import { useSoilMoistureData } from './hooks/useSoilMoistureData';
import { useSatelliteData } from './hooks/useSatelliteData';
import { toStressScenarios, toUnderwritingCase } from './services/api/toUnderwritingCase';
import { FieldMap } from './components/map/FieldMap';
import { CreditDecision } from './components/underwriting/CreditDecision';
import { ScoreSummary } from './components/underwriting/ScoreSummary';
import { StressTest } from './components/stress/StressTest';
import { ContinuousUnderwriting } from './components/monitoring/ContinuousUnderwriting';
import { SectionLabel } from './components/ui/SectionLabel';
import { Sidebar } from './components/layout/Sidebar';
import { MetricGroup } from './components/layout/MetricGroup';
import { Explainability } from './components/explainability/Explainability';
import { HistoricalChart } from './components/history/HistoricalChart';
import { Evidence } from './components/evidence/Evidence';
import { InsightCard } from './components/insight/InsightCard';
import { AgentPanelsSection } from './components/agents/AgentPanelsSection';
import type { ScenarioKey } from './types/underwriting';

const formatCurrency = (amount: number) => `ARS ${new Intl.NumberFormat('es-AR').format(amount)}`;
const droughtRiskLabel: Record<string, string> = { low: 'Bajo', medium: 'Medio', high: 'Alto' };

// Centroide del polígono real (demoCase.field.polygon, OSM way 281480419) — demoCase.field no
// tiene lat/lng propios, solo el polígono y los textos de provincia/departamento.
const FIELD_LAT = -32.6899;
const FIELD_LNG = -62.1291;

const assessmentRequest: AssessmentRequest = {
  cuit: demoCase.applicant.cuit,
  applicant: { name: demoCase.applicant.name },
  field: {
    lat: FIELD_LAT,
    lng: FIELD_LNG,
    hectares: demoCase.field.hectares,
    crop: demoCase.field.crop,
    campaign: demoCase.field.campaign,
    polygon: demoCase.field.polygon,
  },
  loan: demoCase.loan,
};

function App() {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('base');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: assessment } = useAssessment(assessmentRequest);
  const { data: realClimate } = useClimateData(FIELD_LAT, FIELD_LNG);
  const { data: realSoilMoisture } = useSoilMoistureData(FIELD_LAT, FIELD_LNG);
  const { data: realNdvi } = useSatelliteData(demoCase.field.polygon);
  const baseCaseData = useMemo(
    () => (assessment ? toUnderwritingCase(assessment, demoCase) : demoCase),
    [assessment],
  );
  // Real historical rainfall/anomaly from Open-Meteo (docs/Evidence.tsx links the source)
  // overrides the mock/agent figures wherever they resolve — everything else stays as-is.
  const caseData = useMemo(
    () => (realClimate ? { ...baseCaseData, climate: { ...baseCaseData.climate, historicalRainfall: realClimate.annualRainfallMm, rainfallAnomaly: realClimate.rainfallAnomalyPercent } } : baseCaseData),
    [baseCaseData, realClimate],
  );
  const scenarioList = useMemo(
    () => (assessment ? toStressScenarios(assessment) : scenarios),
    [assessment],
  );
  const scenario = useMemo(() => scenarioList.find((item) => item.key === scenarioKey) ?? scenarioList[0], [scenarioList, scenarioKey]);
  const pricePerTon = scenarioKey === 'price' || scenarioKey === 'combined' ? 142_400 : 178_000;
  const expectedRevenue = calculateExpectedRevenue(caseData.field.hectares, scenario.yield, pricePerTon);
  const stressYield = scenarioKey === 'base' ? caseData.production.stressYield : scenario.yield;
  return <div className="app-shell"><Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} applicantName={caseData.applicant.name} applicantCuit={caseData.applicant.cuit} location={caseData.field.province} /><main className="main-content"><header className="top-header"><div className="header-title"><button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Abrir navegación"><Menu size={19} /></button><div><span className="breadcrumb">ESPACIO DE TRABAJO <b>/</b> CASO DE EVALUACIÓN <b>/</b> AG-2026-041</span><h1>Evaluación de riesgo productivo</h1></div></div><div className="header-actions"><button className="icon-btn notification" aria-label="Notificaciones"><Bell size={17} /><i /></button><div className="demo-case"><span>ESTADO DEL CASO <em>EN REVISIÓN</em></span><strong>Marcos Juárez, Córdoba <ChevronDown size={14} /></strong></div><button className="approve-button"><Check size={15} /> Aprobar con límite</button></div></header><div className="content-wrap"><div className="case-meta"><div><MapPinned size={15} /><span>{caseData.field.hectares} ha · Maíz · {caseData.field.campaign}</span></div><div><BookOpen size={15} /><span>Última revisión hoy, 09:42 ART</span></div><span className="synthetic-badge">CASO SINTÉTICO</span></div><div className="hero-grid"><FieldMap scenario={scenario} polygon={caseData.field.polygon} hectares={caseData.field.hectares} crop={caseData.field.crop} campaign={caseData.field.campaign} realNdvi={realNdvi} /><div className="summary-column"><ScoreSummary caseData={caseData} scenario={scenario} /><CreditDecision caseData={caseData} scenario={scenario} /></div></div><div className="metrics-strip"><div className="metrics-heading"><SectionLabel>PERFIL OPERATIVO</SectionLabel><span>Campaña {caseData.field.campaign}</span><small>{formatCurrency(expectedRevenue)} de ingreso bruto</small></div><MetricGroup title="PRODUCCIÓN" tone="green" items={[{ label: 'Rendimiento esperado', value: `${scenario.yield.toFixed(1)} tn/ha` }, { label: 'Rendimiento en estrés', value: `${stressYield.toFixed(1)} tn/ha` }, { label: 'Volatilidad del rendimiento', value: `${caseData.production.yieldVolatility}%` }]} /><MetricGroup title="CLIMA" tone="blue" items={[{ label: 'Lluvia histórica', value: `${caseData.climate.historicalRainfall} mm` }, { label: 'Anomalía actual', value: `${caseData.climate.rainfallAnomaly}%` }, { label: 'Riesgo de sequía', value: droughtRiskLabel[caseData.climate.droughtRisk], badge: caseData.climate.droughtRisk === 'medium' ? 'Medio' : undefined }]} /><MetricGroup title="SUELO" tone="brown" items={[{ label: 'Calidad del suelo', value: `${caseData.soil.score} / 100` }, { label: 'Carbono orgánico', value: `${caseData.soil.organicCarbon}%` }, { label: 'pH del suelo', value: `${caseData.soil.ph}` }]} /></div>{assessment && <AgentPanelsSection assessment={assessment} realClimate={realClimate} realSoilMoisture={realSoilMoisture} />}<div className="lower-grid"><div className="left-stack"><Explainability scenarioKey={scenarioKey} financialCapacity={caseData.financial.score} /><StressTest selected={scenarioKey} scenarios={scenarioList} hectares={caseData.field.hectares} onChange={setScenarioKey} /><HistoricalChart /></div><div className="right-stack"><InsightCard scenario={scenario} requestedAmount={caseData.loan.requestedAmount} /><Evidence /></div></div><ContinuousUnderwriting /><footer className="footer"><span>AGROSCORE v0.1 · Entorno de evaluación con datos simulados</span><span>Indicadores de apoyo a la decisión · No implica probabilidad de incumplimiento</span></footer></div></main></div>;
}

export default App;
