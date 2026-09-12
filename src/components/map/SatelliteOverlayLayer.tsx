import { MercatorCoordinate } from 'maplibre-gl';
import type { CustomLayerInterface, CustomRenderMethodInput, Map as MaplibreMap } from 'maplibre-gl';
import { Camera, Matrix4, type Mesh, Scene, Vector3, WebGLRenderer } from 'three';
import { createTerrainMesh, setTerrainLayer, type OverlayLayerName } from './TerrainMesh';

function polygonCentroid(polygon: Array<[number, number]>): [number, number] {
  const lngs = polygon.map(([lng]) => lng);
  const lats = polygon.map(([, lat]) => lat);
  return [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2];
}

// Equirectangular approximation around the field's centroid latitude — negligible distortion
// at the ~1-2km scale of a single field, and this layer never needs to render beyond it.
function polygonSizeMeters(polygon: Array<[number, number]>, centerLat: number): { width: number; depth: number } {
  const lngs = polygon.map(([lng]) => lng);
  const lats = polygon.map(([, lat]) => lat);
  const metersPerDegLat = 111_320;
  const metersPerDegLng = 111_320 * Math.cos((centerLat * Math.PI) / 180);
  return {
    width: (Math.max(...lngs) - Math.min(...lngs)) * metersPerDegLng,
    depth: (Math.max(...lats) - Math.min(...lats)) * metersPerDegLat,
  };
}

export interface SatelliteOverlay extends CustomLayerInterface {
  setLayer(layer: OverlayLayerName): void;
}

/**
 * MapLibre custom layer (renderingMode "3d") hosting a plain three.js scene, sharing MapLibre's
 * own WebGL2 context. The model matrix anchors the mesh at the field's centroid using
 * MercatorCoordinate — the standard maplibre-gl/three.js integration recipe: translate+scale by
 * the anchor's mercator units, rotate 90° on X to go from three.js's Y-up convention into
 * Mercator's local Z-up frame, then premultiply by MapLibre's own modelViewProjectionMatrix.
 */
export function createSatelliteOverlayLayer(polygon: Array<[number, number]>, initialLayer: OverlayLayerName): SatelliteOverlay {
  const [centerLng, centerLat] = polygonCentroid(polygon);
  const { width, depth } = polygonSizeMeters(polygon, centerLat);
  const mercatorAnchor = MercatorCoordinate.fromLngLat({ lng: centerLng, lat: centerLat }, 0);
  const meterScale = mercatorAnchor.meterInMercatorCoordinateUnits();
  const rotationX = new Matrix4().makeRotationAxis(new Vector3(1, 0, 0), Math.PI / 2);
  const modelMatrix = new Matrix4()
    .makeTranslation(mercatorAnchor.x, mercatorAnchor.y, mercatorAnchor.z)
    .scale(new Vector3(meterScale, -meterScale, meterScale))
    .multiply(rotationX);

  let map: MaplibreMap;
  let scene: Scene;
  let camera: Camera;
  let renderer: WebGLRenderer;
  let terrainMesh: Mesh;

  return {
    id: 'satellite-overlay-layer',
    type: 'custom',
    renderingMode: '3d',

    onAdd(mapInstance, gl) {
      map = mapInstance;
      scene = new Scene();
      camera = new Camera();

      terrainMesh = createTerrainMesh(width, depth, initialLayer);
      scene.add(terrainMesh);

      renderer = new WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true });
      renderer.autoClear = false;
    },

    render(_gl: WebGL2RenderingContext, options: CustomRenderMethodInput) {
      const mvp = new Matrix4().fromArray(options.modelViewProjectionMatrix as unknown as number[]);
      camera.projectionMatrix = mvp.multiply(modelMatrix);

      renderer.resetState();
      renderer.render(scene, camera);
      map.triggerRepaint();
    },

    onRemove() {
      terrainMesh.geometry.dispose();
      (terrainMesh.material as { dispose(): void }).dispose();
      renderer.dispose();
    },

    setLayer(layer: OverlayLayerName) {
      if (terrainMesh) setTerrainLayer(terrainMesh, layer);
    },
  };
}
