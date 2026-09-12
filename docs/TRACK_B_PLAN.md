# AGROSCORE — Plan de desarrollo Track B (Geoespacial / Frontend)

> Documento autocontenido para retomar el trabajo con agentes sin depender del historial de chat.
> Complementa (no reemplaza) los specs de referencia: `docs/SATELLITE_MODULE.md`, `docs/AGENT_SPECIFICATION.md`,
> `docs/INTEGRATION_GUIDE.md`, `docs/DATA_SOURCES.md`. Ante cualquier duda de formato/formula, esos documentos
> son la fuente de verdad; este documento es la hoja de ruta de EJECUCIÓN para el Developer B.

## 1. Contexto

AGROSCORE es un dashboard de scoring de riesgo agro-crediticio. El repo ya tiene:

- Un **frontend React 19 + Vite 8 + TS** con un dashboard visual pulido pero 100% mock (todo lee de `src/data/demoCase.ts` hardcodeado). Ver inventario completo en la sección 3.
- Una **carpeta `docs/`** con el spec técnico completo (pensado originalmente para 4 devs), del cual este documento es el recorte operativo para 2 devs.
- **FASE 0 ya completada y pusheada** (commit `e8fc5b8`): contratos compartidos en `shared/types/`, `server/tsconfig.json`, proxy de Vite (`/api`, `/socket.io` → `localhost:3001`), y dependencias instaladas (`three`, `@react-three/fiber@^9.3.0`, `@react-three/drei@^10.7.8` — pineados a estas versiones por compatibilidad de peer deps con React `~19.2.8`; `express`, `socket.io`, `cors`, `helmet`, `zod`, `tsx`, `concurrently`, etc.).

El trabajo se divide en 2 tracks paralelos:

- **Track A (otro developer)**: backend Express+Socket.IO, Risk Engine, los 5 agentes de riesgo (`financial`, `climate`, `yield`, `soil`, `news`). Vive en `server/agents/`, `server/engine/`, `server/routes/`, `server/websocket.ts`.
- **Track B (este documento, vos)**: módulo satelital (`server/satellite/`), migración del mapa a Three.js+MapLibre, y reconexión de toda la UI React existente a datos reales.

**El único acople duro entre tracks es el contrato `POST /api/assessment`** (`shared/types/assessment.ts`, ya creado). Se resuelve con un fixture mock que vos construís (tarea 2) — así no dependés de que el backend de Track A esté corriendo para avanzar.

## 2. Decisiones de alcance ya confirmadas (no reabrir)

- Se implementa el plan completo de `docs/` (no una versión recortada), reagrupado de 4 roles a 2.
- El mapa se migra a **Three.js + MapLibre real** (no se queda en el SVG mock actual).
- MQTT/IoT (FASE 6 de `docs/PHASE_SPECIFICATION.md`) queda fuera de alcance — es tarea de Track A y solo si sobra tiempo.
- APIs satelitales: usar **Microsoft Planetary Computer STAC** (sin auth) como proveedor primario, no el flujo OAuth2 de Copernicus CDSE (dejar `sentinelProvider.ts` como alternativa no usada, ver `docs/DATA_SOURCES.md` §6).

## 3. Estado actual del código relevante para Track B (verificado en el repo)

- **`src/App.tsx`** (~86 líneas densas): monolito que define inline `MetricGroup`, `Explainability`, `HistoricalChart`, `Evidence`, `InsightCard`, `Sidebar`, además del shell `App`. Lee todo de `src/data/demoCase.ts` (`demoCase`, `historicalYield`, `scenarios`).
- **Bug confirmado en `Explainability`** (líneas 40-52 de `App.tsx`): la resiliencia productiva se calcula como `isStress ? 76 : 87`, sin distinguir cuál escenario de estrés está activo. En cambio `src/components/underwriting/ScoreSummary.tsx` y `src/components/map/FieldMap.tsx` sí derivan el valor correcto por escenario (`combined→69, drought→78, price→84, base→87`). Corregir al extraer el componente (tarea 3).
- **`src/components/map/FieldMap.tsx`**: mapa 100% SVG/CSS dibujado a mano, con topbar + selector de capas (Vegetation/Drought/Soil/Productivity) que hoy solo cambia una clase CSS, sin dato real detrás. Mantener esta "chrome" (topbar, selector, badge de resiliencia) y reemplazar únicamente el fondo por el mapa real (tarea 6).
- **Ya extraídos y reutilizables tal cual** (solo cambiarles la fuente de datos, no el markup): `src/components/underwriting/{CreditDecision,ScoreSummary}.tsx`, `src/components/ui/{ScoreRing,SectionLabel}.tsx`, `src/components/stress/StressTest.tsx`, `src/components/monitoring/ContinuousUnderwriting.tsx`.
- **`src/types/underwriting.ts`**: tipos de dominio del caso único (`UnderwritingCase`, `StressScenario`, `HistoricalYield`). Extender, no reemplazar.
- **`src/domain/scoring/calculations.ts`**: funciones puras de scoring. Nota: `calculateStressRevenue` es idéntica a `calculateExpectedRevenue` (no aplica multiplicador de escenario) — no es responsabilidad de Track B arreglarla (la usa Track A al portar la lógica al Risk Engine real), pero si al usarla desde el frontend genera valores incorrectos, avisar/corregir en conjunto.
- **Dependencias ya instaladas y sin usar** que este track sí va a consumir: `@tanstack/react-query`, `maplibre-gl`, `react-map-gl`, `three`, `@react-three/fiber`, `@react-three/drei`.
- **`shared/types/`** (ya creado en FASE 0): `agent.ts` (contratos de los 5 agentes + `RiskSynthesisOutput`), `satellite.ts` (`SatelliteImage`, `SpectralIndex`, `VegetationAnalysis`, `SatelliteAlert`, `FieldWithSatellite`), `assessment.ts` (`AssessmentRequest`/`AssessmentResponse`). Importar desde `'../../shared/types'` (o el relativo que corresponda) con extensión `.js` en los imports internos de `shared/` (son módulos ESM `nodenext`-compatibles).

## 4. Lista de tareas en orden

### Tarea 1 — `server/satellite/providers/mockSatellite.ts`
Copiar textual `mockSatelliteAnalysis` y `mockDroughtAnalysis` de `docs/SATELLITE_MODULE.md` sección 5, tipando contra `VegetationAnalysis` de `shared/types/satellite.ts`. Es lo primero que hay que hacer: desbloquea a Track A (que necesita un valor de `droughtIndex` para su Risk Engine) y a vos mismo (tarea 2 lo consume).

**Aceptación**: el archivo compila bajo `npm run typecheck:server`; exporta ambas constantes.

### Tarea 2 — `src/data/mockAssessmentResponse.ts`
Fixture estático que respeta EXACTAMENTE la forma de `AssessmentResponse` (`shared/types/assessment.ts`). Basarse en el JSON de ejemplo de `docs/INTEGRATION_GUIDE.md` sección "Response" (caso `AG-2026-041`, Marcos Juárez, financial=61, agroScore=78, rating B+, DSCR base 1.82/stress 1.24, escenarios base/drought/price/combined con exposure 76M/49M/58M/34M).

**Por qué importa**: es el fixture que permite que TODO el frontend funcione sin que el backend de Track A esté corriendo. `assessmentClient.ts` (tarea 4) cae a este fixture si el fetch real falla.

**Aceptación**: `AssessmentResponse` importado y usado como tipo del objeto exportado (no `any`); los números coinciden con el ejemplo documentado.

### Tarea 3 — Descomponer `App.tsx`
Extraer, en este orden, SIN todavía conectar a datos reales (solo mover código, cambiar imports):

```
src/components/layout/Sidebar.tsx
src/components/layout/MetricGroup.tsx
src/components/explainability/Explainability.tsx   # arreglar el bug acá (ver más abajo)
src/components/history/HistoricalChart.tsx
src/components/evidence/Evidence.tsx
src/components/insight/InsightCard.tsx
```

`App.tsx` queda reducido a composición pura (imports + JSX de layout), sin lógica ni componentes inline.

**Arreglo de bug incluido en esta tarea**: en el nuevo `Explainability.tsx`, reemplazar los literales `isStress ? X : Y` por la misma derivación por escenario que ya usa `ScoreSummary.tsx`/`FieldMap.tsx`. Idealmente, extraer un selector único (p. ej. `getProductiveResilience(scenarioKey)` en `src/domain/scoring/calculations.ts`) y usarlo en los tres componentes para que no haya divergencia futura.

**Aceptación**: `npm run build` y `npm run lint` pasan; el dashboard se ve pixel-igual al actual (nada cambia visualmente todavía, excepto el número de resiliencia productiva en escenarios de estrés que ahora sí varía por escenario); cero imports de componentes definidos inline en `App.tsx`.

### Tarea 4 — Cliente de datos: `assessmentClient.ts` + `useAssessment.ts`
```
src/services/api/assessmentClient.ts   # requestAssessment(req: AssessmentRequest): Promise<AssessmentResponse>
src/hooks/useAssessment.ts             # usa @tanstack/react-query (useQuery), envuelve assessmentClient
```

`assessmentClient.ts`:
```ts
export async function requestAssessment(req: AssessmentRequest): Promise<AssessmentResponse> {
  try {
    const res = await fetch('/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`assessment failed: ${res.status}`);
    return await res.json();
  } catch {
    return mockAssessmentResponse; // fixture de la tarea 2 — no bloquea si el backend no está arriba
  }
}
```

`useAssessment.ts` expone `{ data, isLoading, error }` sobre `requestAssessment`, con `queryKey` basado en `caseId`/request. **No olvidar** envolver `App` con `QueryClientProvider` en `src/main.tsx` (hoy no existe ningún provider).

**Aceptación**: con el backend apagado, el hook igual resuelve datos (desde el fixture) sin que la consola tire errores no manejados.

### Tarea 5 — Conectar componentes existentes a `useAssessment()`
Reemplazar en `ScoreSummary`, `CreditDecision`, `StressTest`, y los componentes recién extraídos (tarea 3) las lecturas directas de `demoCase`/`scenarios` por props derivadas de `useAssessment()`. Puede requerir un adaptador `src/services/api/toUnderwritingCase.ts` que mapee `AssessmentResponse` → `UnderwritingCase`/`StressScenario[]` para no reescribir las firmas de props de los componentes existentes.

**Aceptación**: clickear las 4 tabs de `StressTest` cambia valores que vienen de `AssessmentResponse.scenarios`, no de un array estático importado.

### Tarea 6 — Migración del mapa a MapLibre + Three.js
```
src/components/map/MapLibreField.tsx     # basemap real vía react-map-gl/maplibre-gl
src/components/map/FieldPolygon.tsx      # polígono del campo como capa GeoJSON
src/components/map/TerrainMesh.tsx       # geometría con elevación (FASE 4.2 de docs/PHASE_SPECIFICATION.md)
src/components/map/SatelliteOverlayLayer.tsx  # capa custom de MapLibre que hostea una escena Three.js
```

Mantener la "chrome" existente de `FieldMap.tsx` (topbar, selector de capas Vegetation/Drought/Soil/Productivity, badge) — solo reemplazar el `<div className="map-background">` interno.

**Cuidado con la convención de coordenadas**: GeoJSON y `AssessmentRequest.field.polygon` usan `[lng, lat]`. El polígono ya existente en `demoCase.ts` sigue esa convención — no invertir el orden al pasarlo a MapLibre.

Coordenadas del caso demo: campo en Marcos Juárez, Córdoba (`lat: -32.69, lng: -62.10`).

**Aceptación**: el mapa renderiza tiles reales (no el SVG anterior) con el polígono del campo dibujado correctamente sobre Córdoba, Argentina.

### Tarea 7 — Índices espectrales
```
server/satellite/indices/ndvi.ts
server/satellite/indices/ndwi.ts
server/satellite/indices/evi.ts
server/satellite/indices/droughtIndex.ts
```

Fórmulas exactas (`docs/SATELLITE_MODULE.md` §2, `docs/DATA_SOURCES.md` §6):
```
NDVI = (B08 - B04) / (B08 + B04)        # scale factor /10000 antes de restar
NDWI = (B03 - B08) / (B03 + B08)
EVI  = 2.5 * (B08 - B04) / (B08 + 6*B04 - 7.5*B02 + 1)
droughtIndex = 0.4*normalize(mean(NDVI)) + 0.35*normalize(mean(NDWI)) + 0.25*normalize(precipitationAnomaly)
```
Ver el código de referencia completo (incluye normalización) en `docs/SATELLITE_MODULE.md` líneas 169-256.

**Aceptación**: tests unitarios con arrays `Uint16Array` de ejemplo devuelven valores en rango `[-1, 1]` para NDVI/NDWI/EVI y `[0, 1]` para `droughtIndex`.

### Tarea 8 — Análisis de vegetación y humedad
```
server/satellite/analysis/vegetationHealth.ts   # analyzeVegetationHealth()
server/satellite/analysis/moistureStress.ts     # analyzeMoistureStress()
server/satellite/analysis/cropGrowth.ts         # detectCropStage()
```
Implementación de referencia completa en `docs/SATELLITE_MODULE.md` líneas 260-326.

### Tarea 9 — Bridge con los agentes de Track A
```
server/satellite/integration/agentBridge.ts   # enrichWithSatelliteData()
```
Firma y flujo exacto en `docs/SATELLITE_MODULE.md` líneas 330-393. Consume `ClimateAgentResult`/`SoilAgentResult`/`YieldAgentResult` (tipos de `shared/types/agent.ts`, ya creados) — **coordinar con Track A el momento en que sus agentes existen de verdad**; hasta entonces, usar el mock de la tarea 1 como valor de retorno.

### Tarea 10 — Actualizaciones en vivo (WebSocket)
```
src/services/api/socketClient.ts        # wrapper sobre socket.io-client
src/hooks/useLiveAgentUpdates.ts        # suscribe score-updated / alert-triggered / scenario-changed
src/components/agents/{Financial,Climate,Yield,Soil,News}Panel.tsx
```
Eventos y payloads exactos en `docs/INTEGRATION_GUIDE.md` sección "WebSocket Events". Esta tarea depende de que Track A tenga `server/websocket.ts` emitiendo — es un acople blando: si no está listo, los paneles deben poder mostrar el último snapshot REST (de `useAssessment()`) sin romperse.

**Hacer al final**, es la única tarea que realmente necesita al backend de Track A corriendo para verse completa.

### Tarea 11 — Pulido (opcional, si sobra tiempo)
Ítems muertos del sidebar (`Portfolio`, `Monitoring`, `Evidence library`, `Scenario builder`, `Settings`): agregar estado disabled/"coming soon" en vez de dejarlos como botones que no hacen nada.

## 5. Checklist de verificación de Track B

- [x] `App.tsx` no define ningún componente inline; todo vive en `src/components/`.
- [x] El valor de resiliencia productiva coincide entre `Explainability` y `ScoreSummary` para los 4 escenarios (regresión del bug documentado).
- [x] Con el backend de Track A apagado, el dashboard completo sigue renderizando (vía `mockAssessmentResponse.ts`), sin errores de consola.
- [x] El mapa renderiza tiles reales de MapLibre con el polígono del campo correctamente ubicado en Córdoba — ahora sobre un lote agrícola real (ver §7).
- [x] El overlay de capas (Vegetation/Drought/Soil/Productivity) cambia visualmente al alternar el selector de capas — implementado con `CanvasSource` en vez de Three.js (ver §7, desvío documentado).
- [ ] `POST /api/assessment` (cuando Track A lo tenga arriba) se consume end-to-end desde la UI real, no solo desde el fixture. **Bloqueado por Track A** — el código ya intenta el fetch real primero (`assessmentClient.ts`) y cae al mock solo si falla.
- [ ] Los paneles de agentes reciben `score-updated`/`alert-triggered` en vivo cuando el backend emite esos eventos. **Bloqueado por Track A** — `useLiveAgentUpdates` ya se suscribe correctamente; falta un `server/websocket.ts` real emitiendo para verlo completo.

## 7. Estado de ejecución (actualizado 2026-09-12)

### Tareas 1-11: completas

Todas las tareas de la sección 4 están implementadas y commiteadas (`git log e8fc5b8..HEAD`, 12 commits, `30f7360`..`59f7069`). Resumen por tarea:

| Tarea | Estado | Commit |
|---|---|---|
| 1 — Mock satelital | ✅ | `30f7360` |
| 2 — Fixture `mockAssessmentResponse` | ✅ | `794819c` |
| 3 — Descomponer `App.tsx` + fix bug resiliencia | ✅ | `a240abc` |
| 4 — `assessmentClient`/`useAssessment` | ✅ | `af331b8` |
| 5 — Conectar UI a `useAssessment()` | ✅ | `aac8ce1` |
| 6 — Mapa MapLibre + overlay de capas | ✅ (ver desvío técnico abajo) | `e7b8c11`, `50dfd6e` |
| 7 — Índices espectrales (NDVI/NDWI/EVI/drought) + tests | ✅ | `1e6ccc1` |
| 8 — Análisis vegetación/humedad/estadio de cultivo | ✅ | `e350b8b` |
| 9 — `agentBridge.ts` | ✅ | `ba1bb9f` |
| 10 — WebSocket en vivo + paneles de agentes | ✅ (código listo, ver bloqueo Track A) | `4043cd2` |
| 11 — Pulido sidebar (items "coming soon") | ✅ | `59f7069` |

### Desvío técnico documentado: Tarea 6, overlay de capas

El plan original pedía una capa custom de Three.js dentro de MapLibre. Se implementó así (`e7b8c11`) y la capa se registraba sin errores, pero **nunca dibujaba nada**: el `modelViewProjectionMatrix` de `CustomRenderMethodInput` en esta versión de maplibre-gl (^6.9.0) espera coordenadas tile-local en rango `[0, EXTENT]`, no mercator normalizado `[0,1]` como asumen los tutoriales clásicos — confirmado leyendo el propio `.d.ts` de maplibre-gl, que recomienda `defaultProjectionData.mainMatrix` para capas mercator-only. Ese ajuste tampoco resolvió el problema en un tiempo razonable de debugging.

**Se reemplazó por un `CanvasSource` de MapLibre** (`50dfd6e`, `src/components/map/LayerCanvas.ts` + `MapLibreField.tsx`): un canvas 2D redibujado por capa, posicionado con las 4 esquinas reales del campo. Cada capa (Vegetación/Sequía/Suelo/Productividad) tiene su propio patrón sintético (colormap + frecuencia espacial), no datos satelitales reales por píxel — ver §8 para el reemplazo por capas NASA reales, en progreso. Se desinstalaron `three`/`@react-three/*` por quedar sin uso.

### Trabajo adicional (pedido fuera del alcance original de la Tarea 1-11)

Pedido por el usuario el 2026-09-12, después de cerrar las Tareas 1-11:

1. **Traducción completa al español** de toda la UI (`50dfd6e`).
2. **Identidad real del productor**: `Roberto Daniel Ferreyra` / CUIT `20-42052576-2` (CUIT confirmado por el usuario como propio o con consentimiento explícito para esta demo — **no** usar un CUIT real sin esa confirmación).
3. **Lote agrícola real**: el polígono antes caía sobre el pueblo de Marcos Juárez; ahora usa un lote real documentado en OpenStreetMap (`landuse=farmland`, way [281480419](https://www.openstreetmap.org/way/281480419), ~309 ha, ~2.3 km al oeste del centro del pueblo).
4. **Clima verificable**: `src/services/api/climateClient.ts` llama a la API histórica de Open-Meteo (gratis, sin auth) para las coordenadas reales del lote — lluvia real 863mm/anomalía +7% (dato real, distinto del mock que decía -12%). El panel de Clima linkea "Verificar en Open-Meteo" a la consulta exacta.

### 8. Pendiente: análisis satelital avanzado con modelos NASA (en progreso, no implementado)

Pedido del usuario: reemplazar el patchwork sintético de `LayerCanvas.ts` por capas satelitales **reales** de modelos NASA, con fuente verificable. Investigación ya hecha (APIs confirmadas funcionando sin auth para las coordenadas del lote):

- **NASA GIBS** (`gibs.earthdata.nasa.gov`, WMTS/XYZ, sin auth, EPSG:3857 nativo — se integra directo en MapLibre como raster source). Capas identificadas y verificadas en el catálogo real:
  - Vegetación → `MODIS_Terra_NDVI_8Day` (NDVI real, actualización ~diaria sobre compuesto de 8 días, datos hasta 2026-09-11 al momento de escribir esto)
  - Suelo → `SMAP_L4_Analyzed_Root_Zone_Soil_Moisture` (humedad de suelo real, misión SMAP, dato hasta 2026-09-09)
  - Productividad → `MODIS_Terra_L4_LAI_8Day` (Índice de Área Foliar, proxy real de biomasa/productividad)
  - Sequía → candidato: `MODIS_Terra_L3_Land_Surface_Temp_8Day_Day` (temperatura superficial como proxy de estrés hídrico; falta confirmar si conviene en cambio una capa de anomalía de precipitación)
  - URL template confirmado: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{LayerIdentifier}/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png` (mapea directo a `{z}/{y}/{x}` de XYZ). Cada capa trae su propio `TileMatrixSet` y rango de fechas válidas — hay que leerlos de `GetCapabilities` por capa, no asumir que son iguales entre capas (ya varían: `MODIS_Terra_NDVI_8Day` usa `GoogleMapsCompatible_Level9`, otras pueden diferir).
  - Cada capa GIBS tiene una leyenda SVG oficial descargable (ej. `https://gibs.earthdata.nasa.gov/legends/MODIS_NDVI_H.svg`) — mostrarla es la forma más directa de dar "fuente de verdad" visual.
- **NASA POWER** (`power.larc.nasa.gov/api`, JSON, sin auth) para métricas puntuales (no imagen): climatología 20 años (2001-2020, fuente MERRA-2/SYN1DEG) de precipitación/temperatura/radiación, y datos diarios recientes incluyendo `GWETROOT`/`GWETTOP` (humedad de suelo raíz/superficial, real, ~diario). Útil para complementar los paneles de agentes con otra fuente NASA además de GIBS.

**Falta hacer:**
1. Confirmar el `TileMatrixSet`/rango de fechas exacto de la capa de sequía elegida.
2. Construir las URLs de tiles por capa (reemplazando el `paint`/canvas de `LayerCanvas.ts` por un `raster` source por capa, o alternando la URL de un único source al cambiar de capa).
3. Decidir y manejar el caso de nubosidad/vacíos (los productos ópticos como NDVI pueden tener huecos por nubes en la fecha default).
4. Agregar attribution/leyenda NASA visible en el mapa (requisito de uso de GIBS).
5. Verificar visualmente en navegador cada capa sobre el lote real antes de dar por cerrado.

## 6. Documentos de referencia (no duplicar, consultar directamente)

- `docs/SATELLITE_MODULE.md` — módulo satelital completo (interfaces, fórmulas, mocks).
- `docs/AGENT_SPECIFICATION.md` — contratos de los 5 agentes (los consume `agentBridge.ts` y los paneles de la tarea 10).
- `docs/INTEGRATION_GUIDE.md` — contrato `POST /api/assessment`, eventos WebSocket, guion de demo.
- `docs/DATA_SOURCES.md` — APIs externas, rate limits, fallbacks.
- `shared/types/{agent,satellite,assessment}.ts` — contratos TypeScript ya implementados en el repo (FASE 0).
