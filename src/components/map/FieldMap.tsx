import { useRef, useState } from 'react';
import { Layers3, Maximize2, Minus, Plus, ScanLine, Satellite, Sprout, ThermometerSun, Waves } from 'lucide-react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { StressScenario } from '../../types/underwriting';
import { getProductiveResilience } from '../../domain/scoring/calculations';
import { SectionLabel } from '../ui/SectionLabel';
import { MapLibreField } from './MapLibreField';
import type { OverlayLayerName } from './TerrainMesh';

interface FieldMapProps { scenario: StressScenario; polygon: Array<[number, number]> }

export function FieldMap({ scenario, polygon }: FieldMapProps) {
  const [layer, setLayer] = useState<OverlayLayerName>('Vegetation');
  const mapRef = useRef<MaplibreMap | null>(null);
  const layers: Array<{ label: OverlayLayerName; icon: typeof Sprout }> = [{ label: 'Vegetation', icon: Sprout }, { label: 'Drought', icon: ThermometerSun }, { label: 'Soil', icon: Waves }, { label: 'Productivity', icon: Satellite }];
  const resilience = getProductiveResilience(scenario.key);
  return <section className={`field-map map-${scenario.overlay} layer-${layer.toLowerCase()}`}><div className="map-canvas"><MapLibreField polygon={polygon} activeLayer={layer} onMapReady={(map) => { mapRef.current = map; }} /></div><div className="map-topbar"><div><SectionLabel>FIELD INTELLIGENCE</SectionLabel><div className="map-title">Marcos Juárez <span>/ CBA</span></div></div><div className="map-live"><span className="live-dot" /> DEMO DATASET</div></div><div className="map-layer-title"><Layers3 size={13} /> FIELD LAYERS</div><div className="layer-switcher">{layers.map(({ label, icon: Icon }) => <button type="button" key={label} className={layer === label ? 'active' : ''} onClick={() => setLayer(label)}><Icon size={14} />{label}</button>)}</div><div className="map-badge"><div className="badge-icon"><Sprout size={16} /></div><div><strong>300 ha · Maize</strong><span>Campaign 2026/27</span><span>Marcos Juárez, Córdoba</span></div></div><div className="resilience-badge"><div><SectionLabel>PRODUCTIVE RESILIENCE</SectionLabel><strong>{resilience} <small>/ 100</small></strong></div><ScanLine size={20} /></div><div className="map-legend"><span><i className="legend-field" /> Selected field</span><span><i className="legend-road" /> Access road</span></div><div className="map-tools"><button type="button" aria-label="zoom in" onClick={() => mapRef.current?.zoomIn()}><Plus size={15} /></button><button type="button" aria-label="zoom out" onClick={() => mapRef.current?.zoomOut()}><Minus size={15} /></button><button type="button" aria-label="fullscreen"><Maximize2 size={15} /></button><div className="map-attribution">Map view · 32°41′S 62°06′W</div></div></section>;
}
