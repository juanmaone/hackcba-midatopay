import { useMemo, useState } from 'react';
import { Bell, BookOpen, Check, ChevronDown, MapPinned, Menu } from 'lucide-react';
import { demoCase, scenarios } from './data/demoCase';
import { calculateExpectedRevenue } from './domain/scoring/calculations';
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

function App() {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('base');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scenario = useMemo(() => scenarios.find((item) => item.key === scenarioKey) ?? scenarios[0], [scenarioKey]);
  const pricePerTon = scenarioKey === 'price' || scenarioKey === 'combined' ? 142_400 : 178_000;
  const expectedRevenue = calculateExpectedRevenue(demoCase.field.hectares, scenario.yield, pricePerTon);
  const stressYield = scenarioKey === 'base' ? demoCase.production.stressYield : scenario.yield;
  return <div className="app-shell"><Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><main className="main-content"><header className="top-header"><div className="header-title"><button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={19} /></button><div><span className="breadcrumb">WORKSPACE <b>/</b> UNDERWRITING CASE <b>/</b> AG-2026-041</span><h1>Productive risk assessment</h1></div></div><div className="header-actions"><button className="icon-btn notification" aria-label="Notifications"><Bell size={17} /><i /></button><div className="demo-case"><span>CASE STATUS <em>UNDER REVIEW</em></span><strong>Marcos Juárez, Córdoba <ChevronDown size={14} /></strong></div><button className="approve-button"><Check size={15} /> Approve with limit</button></div></header><div className="content-wrap"><div className="case-meta"><div><MapPinned size={15} /><span>300 ha · Maize · 2026/27</span></div><div><BookOpen size={15} /><span>Last reviewed today, 09:42 ART</span></div><span className="synthetic-badge">SYNTHETIC CASE</span></div><div className="hero-grid"><FieldMap scenario={scenario} /><div className="summary-column"><ScoreSummary caseData={demoCase} scenario={scenario} /><CreditDecision caseData={demoCase} scenario={scenario} /></div></div><div className="metrics-strip"><div className="metrics-heading"><SectionLabel>OPERATIONAL PROFILE</SectionLabel><span>{demoCase.field.campaign} campaign</span><small>{formatCurrency(expectedRevenue)} gross revenue</small></div><MetricGroup title="PRODUCTION" tone="green" items={[{ label: 'Expected yield', value: `${scenario.yield.toFixed(1)} tn/ha` }, { label: 'Stress yield', value: `${stressYield.toFixed(1)} tn/ha` }, { label: 'Yield volatility', value: '18%' }]} /><MetricGroup title="CLIMATE" tone="blue" items={[{ label: 'Historical rainfall', value: '645 mm' }, { label: 'Current anomaly', value: '−12%' }, { label: 'Drought risk', value: 'Medium', badge: 'Medium' }]} /><MetricGroup title="SOIL" tone="brown" items={[{ label: 'Soil quality', value: '89 / 100' }, { label: 'Organic carbon', value: '2.1%' }, { label: 'Soil pH', value: '6.2' }]} /></div><div className="lower-grid"><div className="left-stack"><Explainability scenarioKey={scenarioKey} /><StressTest selected={scenarioKey} scenarios={scenarios} onChange={setScenarioKey} /><HistoricalChart /></div><div className="right-stack"><InsightCard scenarioKey={scenarioKey} /><Evidence /></div></div><ContinuousUnderwriting /><footer className="footer"><span>AGROSCORE v0.1 · Mock-first underwriting environment</span><span>Decision-support indicators · No probability of default implied</span></footer></div></main></div>;
}

export default App;
