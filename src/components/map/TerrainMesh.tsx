import { BufferAttribute, Color, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';

export type OverlayLayerName = 'Vegetation' | 'Drought' | 'Soil' | 'Productivity';

const LAYER_COLORS: Record<OverlayLayerName, number> = {
  Vegetation: 0x5e9a6b,
  Drought: 0xd6a14d,
  Soil: 0x8b6b4a,
  Productivity: 0x4f8fb0,
};

const SEGMENTS = 28;
const ELEVATION_METERS = 14;

function elevationAt(x: number, z: number, width: number, depth: number): number {
  const ripple = Math.sin((x / width) * Math.PI * 2.4) * Math.cos((z / depth) * Math.PI * 1.7);
  return ELEVATION_METERS * 0.5 + ripple * ELEVATION_METERS * 0.5;
}

function shadeColor(elevation: number, layer: OverlayLayerName): Color {
  const shade = 0.72 + (elevation / ELEVATION_METERS) * 0.36;
  return new Color(LAYER_COLORS[layer]).multiplyScalar(shade);
}

/**
 * A flat-lying (Y-up) terrain plane sized in meters. Elevation is a synthetic ripple —
 * no real DEM is wired yet; Tarea 7/8's spectral indices will drive setTerrainLayer's
 * coloring with real values once the satellite pipeline exists. Vertex colors (not scene
 * lighting) carry the shading so the relief reads even with an unlit material.
 */
export function createTerrainMesh(widthMeters: number, depthMeters: number, layer: OverlayLayerName): Mesh {
  const geometry = new PlaneGeometry(widthMeters, depthMeters, SEGMENTS, SEGMENTS);
  geometry.rotateX(-Math.PI / 2);

  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const elevation = elevationAt(x, z, widthMeters, depthMeters);
    position.setY(i, elevation);

    const color = shadeColor(elevation, layer);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  position.needsUpdate = true;
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new MeshBasicMaterial({ vertexColors: true });
  const mesh = new Mesh(geometry, material);
  mesh.name = 'terrain-mesh';
  return mesh;
}

export function setTerrainLayer(mesh: Mesh, layer: OverlayLayerName): void {
  const position = mesh.geometry.attributes.position;
  const colorAttr = mesh.geometry.attributes.color as BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    const color = shadeColor(position.getY(i), layer);
    colorAttr.setXYZ(i, color.r, color.g, color.b);
  }
  colorAttr.needsUpdate = true;
}
