import { useCallback, useEffect, useMemo, useState } from 'react';
import { Map, type MapRef } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import type { Map as MaplibreMap, LngLatBoundsLike, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { FieldPolygon } from './FieldPolygon';
import { GIBS_LAYERS, buildGibsTileUrl, type OverlayLayerName } from './nasaGibsLayers';
import { ADMIN_BOUNDARIES } from './adminBoundaries';

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

const overlaySourceId = (layer: OverlayLayerName) => `nasa-gibs-${layer.toLowerCase()}`;
const overlayLayerId = (layer: OverlayLayerName) => `nasa-gibs-${layer.toLowerCase()}-layer`;
const boundarySourceId = (id: string) => `admin-boundary-${id}`;
const boundaryLayerId = (id: string) => `admin-boundary-${id}-layer`;

interface MapLibreFieldProps {
  polygon: Array<[number, number]>;
  activeLayer: OverlayLayerName;
  showBoundaries?: boolean;
  onMapReady?: (map: MaplibreMap) => void;
}

export function MapLibreField({ polygon, activeLayer, showBoundaries, onMapReady }: MapLibreFieldProps) {
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

  // Add all four real NASA GIBS layers once (global XYZ raster sources — no per-field positioning
  // needed, unlike the old CanvasSource approach), then only toggle visibility on selector change.
  useEffect(() => {
    if (!mapRef) return;
    const map = mapRef.getMap();

    const addOverlays = () => {
      for (const layer of Object.keys(GIBS_LAYERS) as OverlayLayerName[]) {
        const sourceId = overlaySourceId(layer);
        const layerId = overlayLayerId(layer);
        if (map.getSource(sourceId)) continue;
        map.addSource(sourceId, {
          type: 'raster',
          tiles: [buildGibsTileUrl(layer)],
          tileSize: 256,
          maxzoom: GIBS_LAYERS[layer].maxNativeZoom,
          attribution: GIBS_LAYERS[layer].attribution,
        });
        map.addLayer({
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: { 'raster-opacity': 0.65 },
          layout: { visibility: layer === activeLayer ? 'visible' : 'none' },
        });
      }
      onMapReady?.(map);
    };

    if (map.loaded()) addOverlays();
    else map.once('load', addOverlays);

    return () => {
      for (const layer of Object.keys(GIBS_LAYERS) as OverlayLayerName[]) {
        const layerId = overlayLayerId(layer);
        const sourceId = overlaySourceId(layer);
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      }
    };
    // activeLayer is applied via the visibility-toggle effect below, not by recreating sources.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef]);

  useEffect(() => {
    if (!mapRef) return;
    const map = mapRef.getMap();
    for (const layer of Object.keys(GIBS_LAYERS) as OverlayLayerName[]) {
      const layerId = overlayLayerId(layer);
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', layer === activeLayer ? 'visible' : 'none');
    }
  }, [mapRef, activeLayer]);

  // Real OSM administrative boundaries (department + province) — a reference overlay, independent
  // of the Vegetation/Drought/Soil/Productivity selector above. Created lazily on first toggle-on
  // (not on mount) since the province polygon alone is ~300KB and most views never open this overlay.
  // Idempotent (skips if the source already exists) so toggling off/on again never re-fetches.
  useEffect(() => {
    if (!mapRef || !showBoundaries) return;
    const map = mapRef.getMap();

    const addBoundaries = () => {
      for (const boundary of ADMIN_BOUNDARIES) {
        const sourceId = boundarySourceId(boundary.id);
        const layerId = boundaryLayerId(boundary.id);
        if (map.getSource(sourceId)) continue;
        map.addSource(sourceId, { type: 'geojson', data: boundary.url });
        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': boundary.color,
            'line-width': 1.5,
            ...(boundary.dashArray ? { 'line-dasharray': boundary.dashArray } : {}),
          },
        });
      }
    };

    if (map.loaded()) addBoundaries();
    else map.once('load', addBoundaries);
  }, [mapRef, showBoundaries]);

  useEffect(() => {
    if (!mapRef) return;
    const map = mapRef.getMap();
    for (const boundary of ADMIN_BOUNDARIES) {
      const layerId = boundaryLayerId(boundary.id);
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', showBoundaries ? 'visible' : 'none');
    }
  }, [mapRef, showBoundaries]);

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
