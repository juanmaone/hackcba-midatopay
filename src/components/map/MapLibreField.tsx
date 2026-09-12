import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Map, type MapRef } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import type { Map as MaplibreMap, LngLatBoundsLike, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { FieldPolygon } from './FieldPolygon';
import { createSatelliteOverlayLayer, type SatelliteOverlay } from './SatelliteOverlayLayer';
import type { OverlayLayerName } from './TerrainMesh';

// Esri World Imagery — free, no-auth raster tiles with real global coverage at field-level
// zoom (unlike MapLibre's own demo vector style, which only has data down to country outlines).
// A satellite basemap also fits this product better than a street map.
const SATELLITE_BASEMAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    esriWorldImagery: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: 'Esri, Maxar, Earthstar Geographics',
    },
  },
  layers: [{ id: 'esri-world-imagery', type: 'raster', source: 'esriWorldImagery' }],
};

interface MapLibreFieldProps {
  polygon: Array<[number, number]>;
  activeLayer: OverlayLayerName;
  onMapReady?: (map: MaplibreMap) => void;
}

export function MapLibreField({ polygon, activeLayer, onMapReady }: MapLibreFieldProps) {
  const overlayRef = useRef<SatelliteOverlay | null>(null);
  // react-map-gl attaches its ref asynchronously (after its own internal setup), so a plain
  // useRef read in a mount-only effect can race it and see null forever. A callback ref
  // fed into state re-renders this component exactly when the instance becomes available.
  const [mapRef, setMapRef] = useState<MapRef | null>(null);
  const handleRef = useCallback((ref: MapRef | null) => setMapRef(ref), []);

  const bounds = useMemo<LngLatBoundsLike>(() => {
    const lngs = polygon.map(([lng]) => lng);
    const lats = polygon.map(([, lat]) => lat);
    return [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];
  }, [polygon]);

  useEffect(() => {
    overlayRef.current?.setLayer(activeLayer);
    mapRef?.getMap().triggerRepaint();
  }, [activeLayer, mapRef]);

  useEffect(() => {
    if (!mapRef) return;
    const map = mapRef.getMap();
    if (map.getLayer('satellite-overlay-layer')) return;

    const overlay = createSatelliteOverlayLayer(polygon, activeLayer);
    overlayRef.current = overlay;
    map.addLayer(overlay);
    onMapReady?.(map);

    return () => {
      if (map.getLayer(overlay.id)) map.removeLayer(overlay.id);
    };
    // polygon/activeLayer/onMapReady are read only at add-time here — re-running this whole
    // effect on every activeLayer change would tear down and rebuild the overlay layer instead
    // of the cheap setLayer() path in the effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef]);

  return (
    <Map
      ref={handleRef}
      mapLib={maplibregl}
      mapStyle={SATELLITE_BASEMAP_STYLE}
      initialViewState={{ bounds, fitBoundsOptions: { padding: 40 } }}
      style={{ width: '100%', height: '100%' }}
    >
      <FieldPolygon polygon={polygon} />
    </Map>
  );
}
