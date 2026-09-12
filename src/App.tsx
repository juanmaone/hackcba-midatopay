import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Database,
  FileText,
  LayoutDashboard,
  LineChart,
  LogOut,
  MapPinned,
  Menu,
  Settings2,
  SlidersHorizontal,
  TrendingUp,
  X,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { demoCase, historicalYield, scenarios } from './data/demoCase';
import { calculateExpectedRevenue } from './domain/scoring/calculations';
import { FieldMap } from './components/map/FieldMap';
import { CreditDecision } from './components/underwriting/CreditDecision';
import { ScoreSummary } from './components/underwriting/ScoreSummary';
import { StressTest } from './components/stress/StressTest';
import { ContinuousUnderwriting } from './components/monitoring/ContinuousUnderwriting';
import { SectionLabel } from './components/ui/SectionLabel';
import type { ScenarioKey } from './types/underwriting';

const formatCurrency = (amount: number) => `ARS ${new Intl.NumberFormat('es-AR').format(amount)}`;
const formatCompact = (amount: number) => `ARS ${(amount / 1_000_000).toFixed(0)}M`;

function MetricGroup({ title, tone, items }: { title: string; tone: string; items: Array<{ label: string; value: string; badge?: string }> }) {
  return <div className="metric-group"><div className={`metric-group-title ${tone}`}><span />{title}</div>{items.map((item) => <div className="metric-row" key={item.label}><span>{item.label}</span><strong>{item.value}{item.badge && <em className={`badge badge-${item.badge === 'Medium' ? 'amber' : 'green'}`}>{item.badge}</em>}</strong></div>)}</div>;
}

function Explainability({ scenarioKey }: { scenarioKey: ScenarioKey }) {
  const isStress = scenarioKey !== 'base';
  const contributions = [
    { label: 'Productive stability', value: isStress ? 10 : 14, type: 'positive' },
    { label: 'Soil & water conditions', value: 11, type: 'positive' },
    { label: 'Historical yield', value: 8, type: 'positive' },
    { label: 'Vegetation stability', value: isStress ? 4 : 7, type: 'positive' },
    { label: 'Climate resilience', value: isStress ? 2 : 6, type: 'positive' },
    { label: 'Financial leverage', value: -9, type: 'negative' },
    { label: 'Historical delinquency', value: -5, type: 'negative' },
    { label: 'Yield volatility', value: isStress ? -7 : -3, type: 'negative' },
  ];
  return <section className="card explain-card"><div className="card-header"><div><SectionLabel>DECISION LOGIC</SectionLabel><h2>Why this score?</h2></div><span className="rule-tag"><span className="rule-dot" /> RULE-BASED</span></div><div className="explain-body"><div className="contribution-chart" aria-label="Score contributions">{contributions.map((contribution) => <div className="contribution" key={contribution.label}><div className="contribution-bar"><i className={contribution.type} style={{ height: `${Math.abs(contribution.value) / 14 * 100}%` }} /></div><strong className={contribution.type}>{contribution.value > 0 ? '+' : ''}{contribution.value}</strong><span>{contribution.label}</span></div>)}</div><div className="capacity-bars"><div><span>Financial capacity <b>61</b></span><div className="capacity-track"><i className="amber-fill" style={{ width: '61%' }} /></div></div><div><span>Productive resilience <b>{isStress ? 76 : 87}</b></span><div className="capacity-track"><i className="green-fill" style={{ width: `${isStress ? 76 : 87}%` }} /></div></div><p>Productive resilience partially offsets a weaker financial profile.</p></div></div></section>;
}

function HistoricalChart() {
  return <section className="card history-card"><div className="card-header"><div><SectionLabel>PRODUCTION RECORD</SectionLabel><h2>Historical yield</h2></div><div className="history-score"><span>Stability</span><strong>82</strong><small>/ 100</small></div></div><div className="chart-legend"><span><i className="legend-green" /> Yield · tn/ha</span><span><i className="legend-amber" /> Drought year</span></div><div className="history-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={historicalYield} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="yieldFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5e9a6b" stopOpacity={0.28} /><stop offset="100%" stopColor="#5e9a6b" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e4e8e1" /><XAxis dataKey="year" tick={{ fontSize: 10, fill: '#8a948c' }} axisLine={false} tickLine={false} /><YAxis domain={[4, 10]} tick={{ fontSize: 10, fill: '#8a948c' }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}`} /><Tooltip contentStyle={{ border: '1px solid #dfe5dd', borderRadius: 6, fontSize: 12, boxShadow: '0 6px 20px rgba(23, 39, 29, .08)' }} formatter={(value) => [`${value} tn/ha`, 'Yield']} /><ReferenceLine y={6.5} stroke="#d6a14d" strokeDasharray="3 3" /><Area type="monotone" dataKey="yield" stroke="#477f56" strokeWidth={2.5} fill="url(#yieldFill)" dot={(props) => { const { cx, cy, payload } = props; return <circle cx={cx} cy={cy} r={payload.drought ? 4 : 3} fill={payload.drought ? '#d6a14d' : '#477f56'} stroke="#fff" strokeWidth={2} />; }} /></AreaChart></ResponsiveContainer></div></section>;
}

function Evidence() {
  const [expanded, setExpanded] = useState(false);
  const sources = [{ title: 'Financial', items: ['BCRA credit history', 'Current debt exposure', 'Delinquency history'], tone: 'navy' }, { title: 'Production', items: ['Regional yield history', 'Crop type', 'Productive area'], tone: 'green' }, { title: 'Environment', items: ['Historical rainfall', 'Drought frequency', 'Soil characteristics', 'Vegetation stability'], tone: 'amber' }];
  return <section className="card evidence-card"><div className="card-header"><div><SectionLabel>DATA TRACEABILITY</SectionLabel><h2>Underwriting evidence</h2></div><span className="demo-label"><Database size={12} /> DEMO DATASET</span></div><div className="evidence-columns">{sources.map((source) => <div key={source.title}><strong className={`evidence-title evidence-${source.tone}`}>{source.title}</strong>{source.items.map((item) => <span key={item}><Check size={13} />{item}</span>)}</div>)}</div><div className="evidence-foot"><span>Sources are simulated for this product demo.</span><button onClick={() => setExpanded((value) => !value)}>{expanded ? 'Hide data dictionary' : 'View data dictionary'} {expanded ? <X size={14} /> : <ChevronDown size={14} />}</button></div>{expanded && <div className="dictionary"><span><b>Input</b><b>Provider</b><b>Refresh</b></span><span><em>Rainfall anomaly</em><em>NASA POWER · mock</em><em>Daily</em></span><span><em>Soil profile</em><em>SoilGrids · mock</em><em>Static</em></span></div>}</section>;
}

function InsightCard({ scenarioKey }: { scenarioKey: ScenarioKey }) {
  const scenario = scenarios.find((item) => item.key === scenarioKey) ?? scenarios[0];
  const isSevere = scenarioKey === 'combined';
  return <section className="insight-card"><div className="insight-head"><div className="insight-symbol"><TrendingUp size={17} /></div><div><SectionLabel>UNDERWRITING INSIGHT</SectionLabel><span>Decision support · Demo case</span></div><span className="confidence-tag">EXPLAINABLE</span></div><p>{isSevere ? 'Combined stress pushes debt service coverage below the minimum threshold. The requested exposure should be restructured before disbursement.' : `Productive resilience partially offsets a weaker financial profile. The selected scenario supports an initial exposure of ${formatCompact(scenario.exposure)}, while the requested ${formatCompact(demoCase.loan.requestedAmount)} becomes vulnerable under pressure.`}</p><div className="insight-rule"><span>Recommendation</span><strong>{isSevere ? 'Restructure exposure' : 'Approve with limit'}</strong></div><button className="text-button">View evidence <ArrowUpRight size={14} /></button></section>;
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}><div className="brand"><div className="brand-mark">A<span>·</span></div><div><strong>AGRO<span>SCORE</span></strong><small>PRODUCTIVE CREDIT INTELLIGENCE</small></div><button className="mobile-close" onClick={onClose} aria-label="Close navigation"><X size={17} /></button></div><div className="sidebar-case"><span>ACTIVE CASE <b>AG-2026-041</b></span><strong>Marcos Juárez</strong><small>Córdoba · 30-71284539-9</small><div className="case-status"><i /> Underwriting in review</div></div><nav><div className="nav-section">WORKSPACE</div><button className="active"><LayoutDashboard size={17} />Overview</button><button><BarChart3 size={17} />Portfolio <span className="nav-count">4</span></button><button><LineChart size={17} />Monitoring</button><div className="nav-section nav-spaced">TOOLS</div><button><FileText size={17} />Evidence library</button><button><SlidersHorizontal size={17} />Scenario builder</button><button><Settings2 size={17} />Settings</button></nav><div className="sidebar-footer"><button className="guide-button"><CircleHelp size={15} />Product guide</button><div className="user-row"><div className="avatar">JD</div><div><strong>Julián Díaz</strong><span>Risk analyst</span></div><ChevronDown size={14} /><LogOut size={14} className="logout-icon" /></div></div></aside>;
}

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
