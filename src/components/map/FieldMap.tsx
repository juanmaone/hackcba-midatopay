import { useState } from 'react';
import { Maximize2, Minus, Plus, ScanLine, Satellite, Sprout, ThermometerSun, Waves } from 'lucide-react';
import type { StressScenario } from '../../types/underwriting';
import { SectionLabel } from '../ui/SectionLabel';

interface FieldMapProps { scenario: StressScenario }

export function FieldMap({ scenario }: FieldMapProps) {
  const [layer, setLayer] = useState('Satellite');
  const layers = [
    { label: 'Satellite', icon: Satellite }, { label: 'Vegetation', icon: Sprout },
    { label: 'Climate', icon: ThermometerSun }, { label: 'Soil', icon: Waves },
  ];
  return <section className={`field-map map-${scenario.overlay}`}>
    <div className="map-background">
      <div className="map-noise" />
      <div className="road road-one" /><div className="road road-two" /><div className="road road-three" />
      <div className="field-block field-block-one" /><div className="field-block field-block-two" /><div className="field-block field-block-three" />
      <svg className="field-polygon" viewBox="0 0 620 430" role="img" aria-label="300 hectare maize field polygon">
        <defs><pattern id="rows" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(22)"><line x1="0" y1="0" x2="0" y2="14" stroke="#c3e18f" strokeWidth="2" opacity=".45" /></pattern></defs>
        <polygon points="180,86 490,112 540,300 245,365 122,260" fill="url(#rows)" stroke="#e4f4ae" strokeWidth="3" />
        <polygon points="180,86 490,112 540,300 245,365 122,260" fill="none" stroke="#182b20" strokeWidth="1" strokeDasharray="5 6" opacity=".55" />
      </svg>
      <div className="map-crosshair"><span /></div>
      <div className="map-grid-label label-north">N</div><div className="map-grid-label label-west">W</div>
      <div className="map-scale">2 km</div>
    </div>
    <div className="map-topbar">
      <div><SectionLabel>FIELD DIGITAL TWIN</SectionLabel><div className="map-title">Marcos Juárez <span>/ CBA</span></div></div>
      <div className="map-live"><span className="live-dot" /> DEMO DATASET</div>
    </div>
    <div className="layer-switcher">{layers.map(({ label, icon: Icon }) => <button key={label} className={layer === label ? 'active' : ''} onClick={() => setLayer(label)}><Icon size={14} />{label}</button>)}</div>
    <div className="map-badge"><div className="badge-icon"><Sprout size={16} /></div><div><strong>300 ha · Maíz</strong><span>Campaign 2026/27</span><span>Marcos Juárez, Córdoba</span></div></div>
    <div className="resilience-badge"><div><SectionLabel>PRODUCTIVE RESILIENCE</SectionLabel><strong>{scenario.key === 'combined' ? 69 : scenario.key === 'drought' ? 78 : 87} <small>/ 100</small></strong></div><ScanLine size={20} /></div>
    <div className="map-tools"><button aria-label="zoom in"><Plus size={15} /></button><button aria-label="zoom out"><Minus size={15} /></button><button aria-label="fullscreen"><Maximize2 size={15} /></button><div className="map-attribution">Map view · 32°41′S 62°06′W</div></div>
  </section>;
}
