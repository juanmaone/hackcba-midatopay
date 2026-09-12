# Track B — Tarea 1: mockSatellite.ts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `server/satellite/providers/mockSatellite.ts` exporting two static `VegetationAnalysis` fixtures (healthy + drought scenario) so Track A's Risk Engine and Track B's own `mockAssessmentResponse.ts` (Tarea 2) have a `droughtIndex`/vegetation payload to consume before any real satellite provider exists.

**Architecture:** Single data-only module, no logic. It re-implements verbatim the mock objects already fully specified in `docs/SATELLITE_MODULE.md` §5, typed against the `VegetationAnalysis` interface already committed in `shared/types/satellite.ts`. No provider abstraction, no factory — this is intentionally the dumbest possible module, matching its role as a placeholder until Tarea 7/8 build real analysis.

**Tech Stack:** TypeScript, Node ESM (`nodenext` module resolution — relative imports need explicit `.js` extensions), no test runner involved (verification is `tsc --noEmit` via the existing `typecheck:server` script).

**Spec:** `docs/TRACK_B_PLAN.md` (Tarea 1) and `docs/SATELLITE_MODULE.md` §5 ("Mock Data for Testing")

## Global Constraints

- Module system is `nodenext`: any relative import of a file must include the `.js` extension (e.g. `from '../../../shared/types/satellite.js'`), even though the source file is `.ts`.
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true` are enabled in `server/tsconfig.json` — no unused imports or dead bindings.
- Do not invent fields not present in `VegetationAnalysis` (`shared/types/satellite.ts`); do not omit required ones.
- Values must match `docs/SATELLITE_MODULE.md` §5 exactly (spectral index arrays, droughtIndex, alerts, confidence) — this is a fixture other tracks depend on for demo-reproducible numbers.

---

### Task 1: `server/satellite/providers/mockSatellite.ts`

**Files:**
- Create: `server/satellite/providers/mockSatellite.ts`

**Interfaces:**
- Consumes: `VegetationAnalysis` type from `shared/types/satellite.ts` (already committed; fields: `ndvi`, `ndwi`, `evi` as `SpectralIndex`, `droughtIndex: number`, `vegetationHealth: VegetationHealth`, `moistureStatus: MoistureStatus`, `cropStage: CropStage`, `alerts: SatelliteAlert[]`, `confidence: number`).
- Produces: `mockSatelliteAnalysis: VegetationAnalysis` and `mockDroughtAnalysis: VegetationAnalysis`, both named exports. Tarea 2 (`src/data/mockAssessmentResponse.ts`) and Tarea 9 (`agentBridge.ts`) will import `mockDroughtAnalysis`/`mockSatelliteAnalysis` from this file as their fallback satellite payload.

- [ ] **Step 1: Create the file with both fixtures**

```typescript
// server/satellite/providers/mockSatellite.ts
import type { VegetationAnalysis } from '../../../shared/types/satellite.js';

export const mockSatelliteAnalysis: VegetationAnalysis = {
  ndvi: {
    name: 'NDVI',
    values: new Float32Array([0.65, 0.72, 0.68, 0.71, 0.69]),
    metadata: { min: 0.65, max: 0.72, mean: 0.69, std: 0.03, timestamp: new Date().toISOString() },
  },
  ndwi: {
    name: 'NDWI',
    values: new Float32Array([0.12, 0.15, 0.11, 0.14, 0.13]),
    metadata: { min: 0.11, max: 0.15, mean: 0.13, std: 0.02, timestamp: new Date().toISOString() },
  },
  evi: {
    name: 'EVI',
    values: new Float32Array([0.45, 0.52, 0.48, 0.51, 0.49]),
    metadata: { min: 0.45, max: 0.52, mean: 0.49, std: 0.03, timestamp: new Date().toISOString() },
  },
  droughtIndex: 0.78,
  vegetationHealth: 'good',
  moistureStatus: 'adequate',
  cropStage: 'vegetative',
  alerts: [],
  confidence: 0.92,
};

export const mockDroughtAnalysis: VegetationAnalysis = {
  ...mockSatelliteAnalysis,
  ndvi: {
    ...mockSatelliteAnalysis.ndvi,
    values: new Float32Array([0.35, 0.42, 0.38, 0.41, 0.39]),
    metadata: { min: 0.35, max: 0.42, mean: 0.39, std: 0.03, timestamp: new Date().toISOString() },
  },
  droughtIndex: 0.32,
  vegetationHealth: 'stressed',
  moistureStatus: 'deficient',
  alerts: [
    {
      type: 'moisture_stress',
      severity: 'high',
      message: 'Significant moisture stress detected across 65% of field',
      affectedArea: 65,
      recommendation: 'Irrigation recommended within 48 hours',
    },
  ],
  confidence: 0.88,
};
```

Note the `import type` and the `.js` extension on the relative import — required by `nodenext` module resolution (see Global Constraints).

- [ ] **Step 2: Run the typecheck script and verify it passes**

Run: `npm run typecheck:server`
Expected: exits 0, no errors. If it fails, the error will point at a field mismatch against `VegetationAnalysis` — compare field-by-field against `shared/types/satellite.ts` rather than loosening types with `any`.

- [ ] **Step 3: Commit**

```bash
git add server/satellite/providers/mockSatellite.ts
git commit -m "feat(satellite): add mock vegetation analysis fixtures (Tarea 1)"
```
