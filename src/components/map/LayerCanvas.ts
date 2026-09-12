export type OverlayLayerName = 'Vegetation' | 'Drought' | 'Soil' | 'Productivity';

interface LayerVisual {
  colorLow: [number, number, number];
  colorHigh: [number, number, number];
  freqX: number;
  freqZ: number;
  phase: number;
  bias: number;
}

// Each layer gets its own colormap, spatial pattern (freq/phase), and mean bias, so switching
// the selector changes both the shape and the color of the patchwork, not just a tint. Biases
// mirror the Tarea 1 mock fixtures (server/satellite/providers/mockSatellite.ts): NDVI mean
// ~0.69 (healthy) for the base case vs. ~0.39 (stressed) for the drought case — duplicated here
// as presentation constants since the frontend doesn't import server code directly. This is a
// synthetic patchwork, not real per-pixel spectral data — no satellite provider exists yet
// (docs/TRACK_B_PLAN.md defers that); it stands in for one until Tarea 7/8's real indices have
// a real per-pixel source to render.
const LAYER_VISUALS: Record<OverlayLayerName, LayerVisual> = {
  Vegetation: { colorLow: [176, 138, 74], colorHigh: [76, 143, 76], freqX: 5, freqZ: 4, phase: 0, bias: 0.66 },
  Drought: { colorLow: [176, 64, 46], colorHigh: [217, 181, 99], freqX: 6, freqZ: 5, phase: 1.7, bias: 0.36 },
  Soil: { colorLow: [77, 58, 38], colorHigh: [171, 138, 92], freqX: 8, freqZ: 7, phase: 3.4, bias: 0.5 },
  Productivity: { colorLow: [47, 95, 104], colorHigh: [105, 192, 184], freqX: 4, freqZ: 5, phase: 5.1, bias: 0.58 },
};

const CANVAS_SIZE = 256;
const OVERLAY_ALPHA = 200;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Draws the active layer's synthetic patchwork into `canvas`, sized for use as a MapLibre CanvasSource. */
export function drawLayerCanvas(canvas: HTMLCanvasElement, layer: OverlayLayerName): void {
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const visual = LAYER_VISUALS[layer];
  const image = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
  for (let py = 0; py < CANVAS_SIZE; py++) {
    const v = py / CANVAS_SIZE;
    for (let px = 0; px < CANVAS_SIZE; px++) {
      const u = px / CANVAS_SIZE;
      const wave = Math.sin(u * Math.PI * visual.freqX + visual.phase) * Math.cos(v * Math.PI * visual.freqZ + visual.phase * 0.5);
      const value = Math.max(0, Math.min(1, visual.bias + wave * 0.34));
      const idx = (py * CANVAS_SIZE + px) * 4;
      image.data[idx] = lerp(visual.colorLow[0], visual.colorHigh[0], value);
      image.data[idx + 1] = lerp(visual.colorLow[1], visual.colorHigh[1], value);
      image.data[idx + 2] = lerp(visual.colorLow[2], visual.colorHigh[2], value);
      image.data[idx + 3] = OVERLAY_ALPHA;
    }
  }
  ctx.putImageData(image, 0, 0);
}
