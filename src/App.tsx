import { useMemo, useState } from 'react';
import { Bell, BookOpen, Check, ChevronDown, MapPinned, Menu } from 'lucide-react';
import type { AssessmentRequest } from '../shared/types';
import { demoCase, scenarios } from './data/demoCase';
import { calculateExpectedRevenue } from './domain/scoring/calculations';
import { useAssessment } from './hooks/useAssessment';
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
import type { ScenarioKey } from './types/underwriting';

const formatCurrency = (amount: number) => `ARS ${new Intl.NumberFormat('es-AR').format(amount)}`;

// Marcos Juárez, Córdoba (docs/TRACK_B_PLAN.md §4 Tarea 6) — demoCase.field has no lat/lng,
// only the province/department display strings, so the request coordinates are literal here.
const assessmentRequest: AssessmentRequest = {
  cuit: demoCase.applicant.cuit,
  applicant: { name: demoCase.applicant.name },
  field: {
    lat: -32.69,
    lng: -62.10,
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
  const caseData = useMemo(
    () => (assessment ? toUnderwritingCase(assessment, demoCase) : demoCase),
    [assessment],
  );
  const scenarioList = useMemo(
    () => (assessment ? toStressScenarios(assessment) : scenarios),
    [assessment],
  );
  const scenario = useMemo(() => scenarioList.find((item) => item.key === scenarioKey) ?? scenarioList[0], [scenarioList, scenarioKey]);
  const pricePerTon = scenarioKey === 'price' || scenarioKey === 'combined' ? 142_400 : 178_000;
  const expectedRevenue = calculateExpectedRevenue(caseData.field.hectares, scenario.yield, pricePerTon);
  const stressYield = scenarioKey === 'base' ? caseData.production.stressYield : scenario.yield;
  return <div className="app-shell"><Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><main className="main-content"><header className="top-header"><div className="header-title"><button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={19} /></button><div><span className="breadcrumb">WORKSPACE <b>/</b> UNDERWRITING CASE <b>/</b> AG-2026-041</span><h1>Productive risk assessment</h1></div></div><div className="header-actions"><button className="icon-btn notification" aria-label="Notifications"><Bell size={17} /><i /></button><div className="demo-case"><span>CASE STATUS <em>UNDER REVIEW</em></span><strong>Marcos Juárez, Córdoba <ChevronDown size={14} /></strong></div><button className="approve-button"><Check size={15} /> Approve with limit</button></div></header><div className="content-wrap"><div className="case-meta"><div><MapPinned size={15} /><span>300 ha · Maize · 2026/27</span></div><div><BookOpen size={15} /><span>Last reviewed today, 09:42 ART</span></div><span className="synthetic-badge">SYNTHETIC CASE</span></div><div className="hero-grid"><FieldMap scenario={scenario} polygon={caseData.field.polygon} /><div className="summary-column"><ScoreSummary caseData={caseData} scenario={scenario} /><CreditDecision caseData={caseData} scenario={scenario} /></div></div><div className="metrics-strip"><div className="metrics-heading"><SectionLabel>OPERATIONAL PROFILE</SectionLabel><span>{caseData.field.campaign} campaign</span><small>{formatCurrency(expectedRevenue)} gross revenue</small></div><MetricGroup title="PRODUCTION" tone="green" items={[{ label: 'Expected yield', value: `${scenario.yield.toFixed(1)} tn/ha` }, { label: 'Stress yield', value: `${stressYield.toFixed(1)} tn/ha` }, { label: 'Yield volatility', value: `${caseData.production.yieldVolatility}%` }]} /><MetricGroup title="CLIMATE" tone="blue" items={[{ label: 'Historical rainfall', value: `${caseData.climate.historicalRainfall} mm` }, { label: 'Current anomaly', value: `${caseData.climate.rainfallAnomaly}%` }, { label: 'Drought risk', value: caseData.climate.droughtRisk === 'medium' ? 'Medium' : caseData.climate.droughtRisk === 'high' ? 'High' : 'Low', badge: caseData.climate.droughtRisk === 'medium' ? 'Medium' : undefined }]} /><MetricGroup title="SOIL" tone="brown" items={[{ label: 'Soil quality', value: `${caseData.soil.score} / 100` }, { label: 'Organic carbon', value: `${caseData.soil.organicCarbon}%` }, { label: 'Soil pH', value: `${caseData.soil.ph}` }]} /></div><div className="lower-grid"><div className="left-stack"><Explainability scenarioKey={scenarioKey} financialCapacity={caseData.financial.score} /><StressTest selected={scenarioKey} scenarios={scenarioList} onChange={setScenarioKey} /><HistoricalChart /></div><div className="right-stack"><InsightCard scenario={scenario} requestedAmount={caseData.loan.requestedAmount} /><Evidence /></div></div><ContinuousUnderwriting /><footer className="footer"><span>AGROSCORE v0.1 · Mock-first underwriting environment</span><span>Decision-support indicators · No probability of default implied</span></footer></div></main></div>;
}

export default App;
