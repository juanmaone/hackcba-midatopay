import { useRef, useState } from 'react';
import { Layers3, Maximize2, Minus, Plus, ScanLine, Satellite, Sprout, ThermometerSun, Waves } from 'lucide-react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { StressScenario } from '../../types/underwriting';
import { getProductiveResilience } from '../../domain/scoring/calculations';
import { SectionLabel } from '../ui/SectionLabel';
import { MapLibreField } from './MapLibreField';
import type { OverlayLayerName } from './LayerCanvas';

const LAYER_LABELS: Record<OverlayLayerName, string> = { Vegetation: 'Vegetación', Drought: 'Sequía', Soil: 'Suelo', Productivity: 'Productividad' };

interface FieldMapProps { scenario: StressScenario; polygon: Array<[number, number]>; hectares: number; crop: string; campaign: string }

export function FieldMap({ scenario, polygon, hectares, crop, campaign }: FieldMapProps) {
  const [layer, setLayer] = useState<OverlayLayerName>('Vegetation');
  const mapRef = useRef<MaplibreMap | null>(null);
  const layers: Array<{ key: OverlayLayerName; icon: typeof Sprout }> = [{ key: 'Vegetation', icon: Sprout }, { key: 'Drought', icon: ThermometerSun }, { key: 'Soil', icon: Waves }, { key: 'Productivity', icon: Satellite }];
  const resilience = getProductiveResilience(scenario.key);
  return <section className={`field-map map-${scenario.overlay} layer-${layer.toLowerCase()}`}><div className="map-canvas"><MapLibreField polygon={polygon} activeLayer={layer} onMapReady={(map) => { mapRef.current = map; }} /></div><div className="map-topbar"><div><SectionLabel>INTELIGENCIA DE CAMPO</SectionLabel><div className="map-title">Marcos Juárez <span>/ CBA</span></div></div><div className="map-live"><span className="live-dot" /> DATOS DE DEMO</div></div><div className="map-layer-title"><Layers3 size={13} /> CAPAS DEL CAMPO</div><div className="layer-switcher">{layers.map(({ key, icon: Icon }) => <button type="button" key={key} className={layer === key ? 'active' : ''} onClick={() => setLayer(key)}><Icon size={14} />{LAYER_LABELS[key]}</button>)}</div><div className="map-badge"><div className="badge-icon"><Sprout size={16} /></div><div><strong>{hectares} ha · {crop}</strong><span>Campaña {campaign}</span><span>Marcos Juárez, Córdoba</span></div></div><div className="resilience-badge"><div><SectionLabel>RESILIENCIA PRODUCTIVA</SectionLabel><strong>{resilience} <small>/ 100</small></strong></div><ScanLine size={20} /></div><div className="map-legend"><span><i className="legend-field" /> Campo seleccionado</span><span><i className="legend-road" /> Camino de acceso</span></div><div className="map-tools"><button type="button" aria-label="acercar" onClick={() => mapRef.current?.zoomIn()}><Plus size={15} /></button><button type="button" aria-label="alejar" onClick={() => mapRef.current?.zoomOut()}><Minus size={15} /></button><button type="button" aria-label="pantalla completa"><Maximize2 size={15} /></button><div className="map-attribution">Vista del mapa · 32°41′S 62°08′W</div></div></section>;
}
