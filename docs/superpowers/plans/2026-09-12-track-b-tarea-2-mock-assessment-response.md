# Track B — Tarea 2: mockAssessmentResponse.ts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `src/data/mockAssessmentResponse.ts` exporting a single static `AssessmentResponse` fixture (case `AG-2026-041`) so the entire frontend can run against realistic data before Track A's backend exists — `assessmentClient.ts` (Tarea 4) falls back to this fixture whenever `POST /api/assessment` is unreachable.

**Architecture:** Single data-only module, no logic — same pattern as `src/data/demoCase.ts` (already in the repo) but shaped to the new shared contract instead of the legacy `UnderwritingCase` type. The numbers reproduce exactly the worked example in `docs/INTEGRATION_GUIDE.md` §"POST /api/assessment" → Response, which itself matches the scenario numbers already used in `demoCase.ts` (`base` 82/76M/1.82/low, `drought` 68/49M/1.13/medium, `price` 72/58M/1.27/medium, `combined` 56/34M/0.91/high). The documented JSON response only shows a subset of each agent's fields (it omits `metrics` and `sources`, and abbreviates `alerts`/`data`); every field required by `AgentResult` in `shared/types/agent.ts` that isn't in the documented JSON is filled in here with a plausible mock value — those invented values are called out per task below so no one mistakes them for spec'd numbers later.

**Tech Stack:** TypeScript, Vite bundler-mode module resolution (`tsconfig.app.json`: `moduleResolution: "bundler"`, no `.js` extension needed on relative imports, unlike the `server/` nodenext code from Tarea 1).

**Spec:** `docs/TRACK_B_PLAN.md` (Tarea 2) and `docs/INTEGRATION_GUIDE.md` §"POST /api/assessment" (Response example)

## Global Constraints

- Import `AssessmentResponse` (and no other type) from `shared/types` as a type-only import; the exported constant's type must be `AssessmentResponse`, never `any` or an inferred loose type.
- All numbers that appear in the `docs/INTEGRATION_GUIDE.md` Response JSON must be copied verbatim (scores, confidence, dscr, exposure, rating, decision, breakdown weights, scenario values) — do not round or adjust them.
- Fields required by `shared/types/agent.ts` but absent from the documented JSON (`metrics`, `sources` on every agent; `rejectedChecks`/`entities` on financial; `temperatureAnomaly`/`rainyDays`/`consecutiveDryDays` on climate; `historicalYield`/`cropType`/`region`/`droughtYears` on yield; `clayContent`/`sandContent`/`soilScore`/`drainageClass` on soil; `positiveShare`/`negativeShare`/`riskEvents` on news) are filled with the specific mock values listed in Task 1 below — not arbitrary at implementation time, so two people building this independently produce the same fixture.
- `timestamp` on the top-level response and on every agent result is `'2026-09-12T10:30:00Z'` (the value in the documented JSON).

---

### Task 1: `src/data/mockAssessmentResponse.ts`

**Files:**
- Create: `src/data/mockAssessmentResponse.ts`

**Interfaces:**
- Consumes: `AssessmentResponse`, `FinancialAgentResult`, `ClimateAgentResult`, `YieldAgentResult`, `SoilAgentResult`, `NewsAgentResult` (all from `shared/types`, already committed in FASE 0 — no changes to these files).
- Produces: `mockAssessmentResponse: AssessmentResponse`, the default export... no — **named export** `mockAssessmentResponse`. Tarea 4 (`assessmentClient.ts`) imports it as `import { mockAssessmentResponse } from '../../data/mockAssessmentResponse'` and returns it as the fetch-failure fallback.

- [ ] **Step 1: Create the file with the full fixture**

```typescript
// src/data/mockAssessmentResponse.ts
import type { AssessmentResponse } from '../../shared/types';

const TIMESTAMP = '2026-09-12T10:30:00Z';

export const mockAssessmentResponse: AssessmentResponse = {
  caseId: 'AG-2026-041',
  timestamp: TIMESTAMP,
  agents: {
    financial: {
      agentId: 'financial',
      timestamp: TIMESTAMP,
      score: 61,
      confidence: 0.95,
      data: {
        totalDebt: 138000,
        delinquencyStatus: 1,
        daysOverdue: 0,
        rejectedChecks: 0,
        entities: [{ name: 'Banco Nación', status: 1, amount: 138000 }],
      },
      metrics: { primary: 61, secondary: 75, trend: 'stable', volatility: 0.1 },
      alerts: [],
      sources: [
        { provider: 'BCRA', endpoint: '/centraldedeudores/v1.0/Deudas', lastUpdated: TIMESTAMP, reliability: 0.95 },
      ],
    },
    climate: {
      agentId: 'climate',
      timestamp: TIMESTAMP,
      score: 72,
      confidence: 0.88,
      data: {
        historicalRainfall: 645,
        rainfallAnomaly: -12,
        droughtRisk: 'medium',
        temperatureAnomaly: 1.2,
        rainyDays: 58,
        consecutiveDryDays: 14,
      },
      metrics: { primary: 72, secondary: 60, trend: 'declining', volatility: 0.3 },
      alerts: [
        {
          level: 'warning',
          message: 'Rainfall 12% below average',
          metric: 'rainfallAnomaly',
          value: -12,
          threshold: -10,
          recommendation: 'Monitor irrigation needs closely',
        },
      ],
      sources: [{ provider: 'Open-Meteo', endpoint: '/v1/forecast', lastUpdated: TIMESTAMP, reliability: 0.9 }],
    },
    yield: {
      agentId: 'yield',
      timestamp: TIMESTAMP,
      score: 78,
      confidence: 0.82,
      data: {
        historicalYield: [7.8, 8.5, 6.9, 8.1, 7.5],
        expectedYield: 8.2,
        stressYield: 5.7,
        yieldVolatility: 18,
        cropType: 'maiz',
        region: 'Córdoba',
        droughtYears: 1,
      },
      metrics: { primary: 78, secondary: 70, trend: 'stable', volatility: 0.18 },
      alerts: [],
      sources: [{ provider: 'INTA', endpoint: '/rendimientos-historicos', lastUpdated: TIMESTAMP, reliability: 0.85 }],
    },
    soil: {
      agentId: 'soil',
      timestamp: TIMESTAMP,
      score: 89,
      confidence: 0.9,
      data: {
        ph: 6.2,
        organicCarbon: 21.0,
        clayContent: 28,
        sandContent: 35,
        soilScore: 89,
        textureClass: 'Loam',
        drainageClass: 'well-drained',
      },
      metrics: { primary: 89, secondary: 85, trend: 'stable', volatility: 0.05 },
      alerts: [],
      sources: [{ provider: 'SoilGrids', endpoint: '/v2.0/properties', lastUpdated: TIMESTAMP, reliability: 0.88 }],
    },
    news: {
      agentId: 'news',
      timestamp: TIMESTAMP,
      score: 55,
      confidence: 0.75,
      data: {
        articleCount: 45,
        avgSentiment: -0.15,
        positiveShare: 0.3,
        negativeShare: 0.45,
        topThemes: ['drought', 'export_restrictions'],
        riskEvents: [
          { title: 'Gobierno anuncia nuevas retenciones a la exportación de maíz', sentiment: -0.4, source: 'La Nación', date: '2026-09-05' },
        ],
      },
      metrics: { primary: 55, secondary: 60, trend: 'declining', volatility: 0.25 },
      alerts: [
        {
          level: 'info',
          message: 'Negative sentiment in agricultural news',
          metric: 'avgSentiment',
          value: -0.15,
          threshold: -0.1,
          recommendation: 'Monitor news coverage for export policy changes',
        },
      ],
      sources: [{ provider: 'NewsAPI', endpoint: '/v2/everything', lastUpdated: TIMESTAMP, reliability: 0.75 }],
    },
  },
  synthesis: {
    agroScore: 78,
    financialCapacity: 61,
    productiveResilience: 82,
    recommendedExposure: 76_000_000,
    dscr: { base: 1.82, stress: 1.24 },
    rating: 'B+',
    decision: 'APPROVE WITH LIMIT',
    breakdown: { financialWeight: 0.35, productiveWeight: 0.65 },
  },
  scenarios: {
    base: { score: 82, exposure: 76_000_000, dscr: 1.82, risk: 'low' },
    drought: { score: 68, exposure: 49_000_000, dscr: 1.13, risk: 'medium' },
    price: { score: 72, exposure: 58_000_000, dscr: 1.27, risk: 'medium' },
    combined: { score: 56, exposure: 34_000_000, dscr: 0.91, risk: 'high' },
  },
};
```

- [ ] **Step 2: Typecheck the app project**

Run: `npx tsc -b tsconfig.app.json --noEmit`
Expected: exits 0, no errors. Any error here means a field is missing/mistyped against `shared/types/agent.ts` or `shared/types/assessment.ts` — fix the field, don't cast to `any`.

- [ ] **Step 3: Run the full build to confirm nothing else broke**

Run: `npm run build`
Expected: exits 0 (this also re-typechecks `server/` and runs the Vite production build).

- [ ] **Step 4: Commit**

```bash
git add src/data/mockAssessmentResponse.ts
git commit -m "feat(data): add mockAssessmentResponse fixture (Tarea 2)"
```
