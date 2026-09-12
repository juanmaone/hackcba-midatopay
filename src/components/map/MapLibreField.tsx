import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Map, type MapRef } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import type { Map as MaplibreMap, LngLatBoundsLike, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { FieldPolygon } from './FieldPolygon';
import { drawLayerCanvas, type OverlayLayerName } from './LayerCanvas';

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

const OVERLAY_SOURCE_ID = 'satellite-layer-canvas';
const OVERLAY_LAYER_ID = 'satellite-layer-overlay';

interface MapLibreFieldProps {
  polygon: Array<[number, number]>;
  activeLayer: OverlayLayerName;
  onMapReady?: (map: MaplibreMap) => void;
}

export function MapLibreField({ polygon, activeLayer, onMapReady }: MapLibreFieldProps) {
  const [mapRef, setMapRef] = useState<MapRef | null>(null);
  const handleRef = useCallback((ref: MapRef | null) => setMapRef(ref), []);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));

  const bounds = useMemo<LngLatBoundsLike>(() => {
    const lngs = polygon.map(([lng]) => lng);
    const lats = polygon.map(([, lat]) => lat);
    return [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];
  }, [polygon]);

  // [NW, NE, SE, SW] corners of the field's bounding box, the order CanvasSource requires.
  const overlayCoordinates = useMemo((): [[number, number], [number, number], [number, number], [number, number]] => {
    const lngs = polygon.map(([lng]) => lng);
    const lats = polygon.map(([, lat]) => lat);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    return [[minLng, maxLat], [maxLng, maxLat], [maxLng, minLat], [minLng, minLat]];
  }, [polygon]);

  useEffect(() => {
    drawLayerCanvas(canvasRef.current, activeLayer);
  }, [activeLayer]);

  useEffect(() => {
    if (!mapRef) return;
    const map = mapRef.getMap();

    const addOverlay = () => {
      if (map.getSource(OVERLAY_SOURCE_ID)) return;
      drawLayerCanvas(canvasRef.current, activeLayer);
      map.addSource(OVERLAY_SOURCE_ID, { type: 'canvas', canvas: canvasRef.current, coordinates: overlayCoordinates, animate: true });
      map.addLayer({ id: OVERLAY_LAYER_ID, type: 'raster', source: OVERLAY_SOURCE_ID, paint: { 'raster-opacity': 0.6 } });
      onMapReady?.(map);
    };

    if (map.loaded()) addOverlay();
    else map.once('load', addOverlay);

    return () => {
      if (map.getLayer(OVERLAY_LAYER_ID)) map.removeLayer(OVERLAY_LAYER_ID);
      if (map.getSource(OVERLAY_SOURCE_ID)) map.removeSource(OVERLAY_SOURCE_ID);
    };
    // activeLayer is applied via the canvas redraw effect above, not by recreating the source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef, overlayCoordinates]);

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
