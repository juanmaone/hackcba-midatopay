import { useState } from 'react';
import { Check, ChevronDown, Database, X } from 'lucide-react';
import { SectionLabel } from '../ui/SectionLabel';

export function Evidence() {
  const [expanded, setExpanded] = useState(false);
  const sources = [{ title: 'Financial', items: ['BCRA credit history', 'Current debt exposure', 'Delinquency history'], tone: 'navy' }, { title: 'Production', items: ['Regional yield history', 'Crop type', 'Productive area'], tone: 'green' }, { title: 'Environment', items: ['Historical rainfall', 'Drought frequency', 'Soil characteristics', 'Vegetation stability'], tone: 'amber' }];
  return <section className="card evidence-card"><div className="card-header"><div><SectionLabel>DATA TRACEABILITY</SectionLabel><h2>Underwriting evidence</h2></div><span className="demo-label"><Database size={12} /> DEMO DATASET</span></div><div className="evidence-columns">{sources.map((source) => <div key={source.title}><strong className={`evidence-title evidence-${source.tone}`}>{source.title}</strong>{source.items.map((item) => <span key={item}><Check size={13} />{item}</span>)}</div>)}</div><div className="evidence-foot"><span>Sources are simulated for this product demo.</span><button onClick={() => setExpanded((value) => !value)}>{expanded ? 'Hide data dictionary' : 'View data dictionary'} {expanded ? <X size={14} /> : <ChevronDown size={14} />}</button></div>{expanded && <div className="dictionary"><span><b>Input</b><b>Provider</b><b>Refresh</b></span><span><em>Rainfall anomaly</em><em>NASA POWER · mock</em><em>Daily</em></span><span><em>Soil profile</em><em>SoilGrids · mock</em><em>Static</em></span></div>}</section>;
}
