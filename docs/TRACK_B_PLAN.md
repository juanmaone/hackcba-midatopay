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
- [x] El overlay de capas (Vegetation/Drought/Soil/Productivity) cambia visualmente al alternar el selector de capas — implementado con 4 raster sources de NASA GIBS reales (ver §8, ya no `CanvasSource` sintético).
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

### 8. Análisis satelital avanzado con modelos NASA — implementado 2026-09-12

Pedido del usuario ("no quiero datos de demo, ni un caso sintético, eso no da un efecto wow"): reemplazar el patchwork sintético de `LayerCanvas.ts` por capas satelitales **reales** de modelos NASA, con fuente verificable. Investigación ya hecha (APIs confirmadas funcionando sin auth para las coordenadas del lote):

- **NASA GIBS** (`gibs.earthdata.nasa.gov`, WMTS/XYZ, sin auth, EPSG:3857 nativo — se integra directo en MapLibre como raster source). Capas identificadas y verificadas en el catálogo real:
  - Vegetación → `MODIS_Terra_NDVI_8Day` (NDVI real, actualización ~diaria sobre compuesto de 8 días, datos hasta 2026-09-11 al momento de escribir esto)
  - Suelo → `SMAP_L4_Analyzed_Root_Zone_Soil_Moisture` (humedad de suelo real, misión SMAP, dato hasta 2026-09-09)
  - Productividad → `MODIS_Terra_L4_LAI_8Day` (Índice de Área Foliar, proxy real de biomasa/productividad)
  - Sequía → candidato: `MODIS_Terra_L3_Land_Surface_Temp_8Day_Day` (temperatura superficial como proxy de estrés hídrico; falta confirmar si conviene en cambio una capa de anomalía de precipitación)
  - URL template confirmado: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{LayerIdentifier}/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png` (mapea directo a `{z}/{y}/{x}` de XYZ). Cada capa trae su propio `TileMatrixSet` y rango de fechas válidas — hay que leerlos de `GetCapabilities` por capa, no asumir que son iguales entre capas (ya varían: `MODIS_Terra_NDVI_8Day` usa `GoogleMapsCompatible_Level9`, otras pueden diferir).
  - Cada capa GIBS tiene una leyenda SVG oficial descargable (ej. `https://gibs.earthdata.nasa.gov/legends/MODIS_NDVI_H.svg`) — mostrarla es la forma más directa de dar "fuente de verdad" visual.
- **NASA POWER** (`power.larc.nasa.gov/api`, JSON, sin auth) para métricas puntuales (no imagen): climatología 20 años (2001-2020, fuente MERRA-2/SYN1DEG) de precipitación/temperatura/radiación, y datos diarios recientes incluyendo `GWETROOT`/`GWETTOP` (humedad de suelo raíz/superficial, real, ~diario). Útil para complementar los paneles de agentes con otra fuente NASA además de GIBS.

**Implementación final:**

`src/components/map/nasaGibsLayers.ts` (nuevo) define, por capa, el `layerIdentifier`, `tileMatrixSet` y `maxNativeZoom` — verificados contra `WMTSCapabilities.xml` de GIBS (`curl` + parseo con Python), no asumidos:

| Capa | GIBS layer | TileMatrixSet | maxNativeZoom |
|---|---|---|---|
| Vegetación | `MODIS_Terra_NDVI_8Day` | `GoogleMapsCompatible_Level9` | 9 |
| Sequía | `MODIS_Terra_L3_Land_Surface_Temp_8Day_Day` | `GoogleMapsCompatible_Level7` | 7 |
| Suelo | `SMAP_L4_Analyzed_Root_Zone_Soil_Moisture` | `GoogleMapsCompatible_Level6` | 6 |
| Productividad | `MODIS_Terra_L4_LAI_8Day` | `GoogleMapsCompatible_Level8` | 8 |

1. **TileMatrixSet/fechas**: resueltos leyendo `WMTSCapabilities.xml` real en vez de asumir — cada capa usa un `TileMatrixSet` distinto, confirmado. El segmento `{Time}` usa el literal `default` (no una fecha fija), que GIBS resuelve al dato más reciente publicado — evita que las URLs queden obsoletas.
2. **URLs de tiles**: `buildGibsTileUrl()` en `nasaGibsLayers.ts`. `MapLibreField.tsx` agrega las 4 capas como `raster` sources reales (XYZ global, sin `CanvasSource` ni posicionamiento por esquinas) y alterna `visibility` al cambiar el selector, sin recrear sources.
3. **Nubosidad/vacíos**: sin manejo especial — huecos transparentes son una limitación conocida y aceptada para la demo (YAGNI).
4. **Attribution/leyenda**: cada `raster` source lleva su `attribution` (MapLibre la muestra en el control nativo); la leyenda SVG oficial de NASA se muestra junto al selector de capas (`FieldMap.tsx`, componente `.map-satellite-legend`). El badge "DATOS DE DEMO" del mapa se reemplazó por "NASA GIBS EN VIVO".
5. **Verificación visual**: confirmado en navegador (Playwright) sobre el lote real en Marcos Juárez — las 4 capas cargan tiles reales sin errores 400/404 de GIBS. Precaución encontrada y corregida: sin `maxzoom` en el `raster` source, MapLibre pedía tiles a zoom 15 contra un `TileMatrixSet` que solo llega a zoom 6-9 → 400s; se fijó `maxzoom: maxNativeZoom` por fuente para que MapLibre haga over-zoom del tile ancestro en vez de pedir uno inexistente.

`LayerCanvas.ts` (patchwork sintético) fue eliminado — completamente reemplazado.

## 9. Humedad de suelo real (NASA POWER) y capa de límites administrativos — implementado 2026-09-12

Pedido del usuario: sumar NASA POWER como fuente real de humedad de suelo (aclarando que la observación de "sin señal" de la sesión anterior era sobre la Flood API de Open-Meteo, no sobre NASA POWER), y agregar un overlay de límites político/geográficos (departamento, provincia) para ubicar mejor el lote.

**Hecho:**
- `src/services/api/soilMoistureClient.ts` + `src/hooks/useSoilMoistureData.ts`: `GWETROOT`/`GWETTOP` (humedad de raíz/superficial) de NASA POWER (`power.larc.nasa.gov`, sin auth, CORS abierto — verificado con `curl -H "Origin: ..."`), mismo patrón que `climateClient.ts`. Busca hacia atrás hasta 10 días desde `hoy - 7` (lag típico de NASA POWER) y toma el primer valor no-`-999`.
- `SoilPanel.tsx` muestra el nuevo campo "Humedad de raíz (\<fecha\>)" + link "Verificar en NASA POWER" cuando el dato real resuelve — mismo patrón override que `ClimatePanel`. La química de suelo (pH/carbono/textura) sigue simulada; no se encontró fuente real gratuita para eso todavía.
- `src/components/map/adminBoundaries.ts` + `public/boundaries/{marcosJuarezDepartamento,cordobaProvincia}.geojson`: polígonos reales de OpenStreetMap (vía Nominatim `lookup?...&polygon_geojson=1`, relaciones `R1994997` y `R3592494`, confirmadas por nombre/tag), bajados una sola vez y commiteados como archivos estáticos — no se vuelve a pedir a Nominatim en cada carga (respeta su política de uso).
- `MapLibreField.tsx`: 2 `line` sources/layers nuevos, creados de forma perezosa (recién al primer toggle, no al montar el mapa — el polígono de provincia sola pesa ~300KB) y luego solo se alterna `visibility`, sin re-fetch. Toggle nuevo (ícono `LandPlot`) en `map-tools` de `FieldMap.tsx`, independiente del selector Vegetación/Sequía/Suelo/Productividad.
- Verificado en navegador: humedad de suelo real (`44%` al 2026-09-05) visible en el panel de Suelo; boundaries fetch confirmado perezoso (0 requests hasta el primer click) y la línea de límite se ve sobre el mapa al hacer zoom out.

**Pendiente / fuera de alcance de este paso:**
- Química de suelo (pH, carbono, textura) sigue 100% simulada — no se investigó una fuente real gratuita (SoilGrids está documentado en `docs/DATA_SOURCES.md` §4 pero no se verificó en esta sesión).
- El overlay de límites es solo departamento + provincia de Córdoba (donde está el lote demo); no es genérico para cualquier ubicación.
- Módulo satelital de análisis real (NDVI/EVI/NDWI por píxel vía Microsoft Planetary Computer, ver investigación ya hecha y verificada en memoria de sesión) — identificado como la brecha más grande restante, todavía no implementado.

## 10. NDVI real de campo (Microsoft Planetary Computer) — implementado 2026-09-12

Pedido del usuario: cerrar la brecha del punto anterior — reemplazar el NDVI mock (`server/satellite/providers/mockSatellite.ts`, ~0.69) por un valor real calculado sobre la escena Sentinel-2 más reciente.

**Hecho:**
- `src/services/api/satelliteClient.ts`: `fetchRealVegetationIndex(polygon)` — búsqueda STAC real en Microsoft Planetary Computer (`sentinel-2-l2a`, nubosidad < 30%, últimos 90 días, la más reciente), firma el asset con `/api/sas/v1/sign` (sin auth, confirmado CORS abierto incluso para range requests desde el browser), y lee **solo la ventana de píxeles sobre el campo** (no la banda completa de ~190MB) vía `geotiff` (`readRasters({ window })`, en coordenadas de píxel calculadas a mano — el parámetro `bbox` de `readRasters` resultó leer el tile completo silenciosamente, verificado con un script de prueba). Reproyección WGS84→UTM de la escena vía `proj4` (Sentinel-2 no está en lat/lng).
- `src/domain/satellite/ndvi.ts`: fórmula NDVI y `classifyNDVI` duplicados de `server/satellite/indices/ndvi.ts` (mismo texto) — no importados directamente porque `src/` y `server/` son proyectos TS separados (`tsconfig.app.json` no incluye `server/`, distinto `moduleResolution`).
- `src/hooks/useSatelliteData.ts` + `FieldMap.tsx`: cuando la capa activa es "Vegetación", muestra "NDVI real (\<fecha de la escena\>): \<valor\> · \<clasificación en español\>" con link a la escena real en Planetary Computer, debajo de la leyenda GIBS.
- Nuevas dependencias: `geotiff`, `proj4`.
- Verificado con un script Node standalone (búsqueda real, firma real, lectura real de 339×174 px, NDVI medio 0.256) antes de integrarlo, y luego en navegador (sin errores de consola, valor visible y correcto).
- **Nota real e importante**: el NDVI real (0.256, "vegetación moderada") es mucho más bajo que el mock (0.69, "sano") — la escena disponible es del 28/08/2026, que cae **entre campañas** para maíz en Argentina (post-cosecha/pre-siembra de la 2026/27), no indica un cultivo estresado. El valor va rotulado con la fecha de la escena para que el analista no lo malinterprete.

**Pendiente / fuera de alcance de este paso:**
- Solo NDVI — NDWI/EVI/droughtIndex (ya escritos en `server/satellite/indices/`) no se conectaron a datos reales todavía; mismo mecanismo, solo falta repetir el patrón.
- No se implementó el overlay de píxeles reales sobre el mapa (reemplazar el tile GIBS de Vegetación) — decisión explícita del usuario de ir primero por el valor agregado, no por el raster completo.
- `analyzeVegetationHealth`'s desviación histórica ("últimos 5 años") y `detectCropStage` (requiere serie temporal en la temporada) no están conectados — necesitan múltiples búsquedas STAC, no una sola.

## 11. Backend Track A implementado — 2026-09-12

Track A (el otro developer, mismo repo) completó su plan de 13 tareas (`docs/superpowers/plans/2026-09-12-track-a-backend.md`, ledger en `.superpowers/sdd/2026-09-12-track-a-backend/progress.md`), construyendo desde cero el backend Express+Socket.IO que este documento daba como bloqueante en la sección 5. Se documenta acá por la misma razón que las secciones 7-10: dejar registro de qué se hizo y qué queda pendiente sin depender del historial de chat.

**Lo construido:**

- **`server/index.ts`**: bootstrap Express 5 + `http.Server` + Socket.IO 4, con `helmet`/`cors`/`express.json()` y `GET /health`.
- **5 agentes de riesgo** (`server/agents/{financial,climate,soil,news,yield}/`), cada uno con mock fixture + scoring puro + runner async, corridos en paralelo por `runAllAgents` (con callback de progreso por agente, base del WebSocket):
  - **`financial`**: **mock permanente** — BCRA requiere API key no disponible/no verificada, decisión de alcance explícita del usuario, no es un placeholder temporal.
  - **`yield`**: **mock permanente** — USDA PSD también requiere API key, misma decisión de alcance.
  - **`climate`**: **real**, Open-Meteo (`archive-api.open-meteo.com`, sin auth) — mismo patrón ya usado en `src/services/api/climateClient.ts` (Track B, §7), con fallback a mock si el fetch falla.
  - **`soil`**: **real**, SoilGrids (ISRIC, sin auth) con cache de 24h y fallback a mock si el fetch falla o si el punto no tiene cobertura SoilGrids — este fallback es un resultado esperado y documentado, no una falla.
  - **`news`**: **real**, GDELT (`api.gdeltproject.org`, sin auth) con fallback a mock si el fetch falla. Se descubrió en vivo que los artículos de GDELT no siempre traen el campo `tone` (contradice el ejemplo de `docs/DATA_SOURCES.md`) — corregido tratando `tone` como opcional y bajando la confianza cuando falta, en vez de propagar `NaN` silenciosamente.
- **`server/engine/riskSynthesis.ts`**: motor puro que combina los 5 resultados en AgroScore, DSCR (base/estrés), rating y decisión de crédito. Desviaciones de fórmula respecto a `docs/`, documentadas en el propio plan y en el código:
  - `financialScore` se toma directo de `financial.score` (61), sin recomputar vía la fórmula de deltas de `docs/INTEGRATION_GUIDE.md` (que da un resultado distinto al del mock y nunca se ejercita porque financial es mock-only).
  - Los números de ejemplo de `docs/INTEGRATION_GUIDE.md` no cierran con su propia fórmula documentada (`78*0.40+89*0.35+72*0.25=80.35≠82`) — se implementó la fórmula tal cual está documentada (pesos, DSCR, tabla de rating), no los números de ejemplo; el test golden-path usa valores propios verificados a mano.
  - `calculateNewsAdjustment` no tiene fórmula exacta en los docs (solo reglas cualitativas) — se definió como `round((news.score - 50) * 0.2)`.
  - Score base de partida para climate/soil/yield: 70 (no especificado en los docs, que solo dan deltas); para news: 50 (docs sí dicen "50 = neutral").
  - `calculateRecommendedExposure` agrega un clamp inferior a 0 (`Math.max(0, ...)`) que el doc de referencia no tiene — sin él, DSCR negativo bajo el escenario combinado de estrés produce exposición recomendada negativa.
- **`server/engine/stressScenarios.ts`**: escenarios base/sequía(-30%)/precio(-20%)/combinado, con fórmulas de `score` y `risk` definidas en el plan (no estaban en los docs).
- **`POST /api/assessment`** (`server/routes/risk.ts`): valida el request con Zod, corre los 5 agentes, sintetiza el riesgo, calcula escenarios, devuelve `AssessmentResponse`.
- **`server/websocket.ts`**: emite `score-updated` y `alert-triggered` por agente a medida que cada uno resuelve (no un solo evento al final), consumido por el hook ya existente `src/hooks/useLiveAgentUpdates.ts` (Track B, tarea 10).

**Limpieza de frontend (Tarea 12 del plan de Track A):** se eliminó el override climático redundante del lado del cliente en `src/App.tsx`, ya innecesario porque `assessmentClient.ts` (Track B, tarea 4) llama a `POST /api/assessment` y ese backend ahora sí calcula clima real — el override quedaba duplicando lo que el backend ya resuelve.

**Verificado en esta sesión (Tarea 13, verificación end-to-end):**

- `npm run test`: 68/68 tests pasan en 19 archivos (agentes, engine, rutas, websocket de Track A + `server/satellite/**` y `src/` de Track B).
- `npm run typecheck:server && npx tsc -b --noEmit`: ambos limpios, sin errores.
- Con `npm run dev:all` corriendo (Vite :5173 + API :3001), navegador contra `http://localhost:5173`:
  - `POST /api/assessment` → `200`, `caseId: "AG-1789222359156"` (timestamp real, no el `AG-2026-041` estático del fixture viejo — confirma que el backend real está respondiendo, no el fallback mock del frontend).
  - `agents.soil.sources[0].provider` = `"Mock"` (SoilGrids no tuvo cobertura para el punto del lote en esta corrida — fallback esperado y documentado más arriba, no una falla).
  - `agents.climate.data`: `historicalRainfall: 863`, `rainfallAnomaly: 7`, `droughtRisk: "low"` — coincide exactamente con lo mostrado en el panel CLIMA de la UI (863 mm / 7% / Bajo), confirmando que la limpieza de la Tarea 12 no dejó ningún override visible.
  - Consola del navegador: sin errores de conexión de Socket.IO (solo un warning preexistente de React sobre `key` prop en una lista, no relacionado).
  - El badge "CASO SINTÉTICO" sigue visible — esperado y fuera de alcance: `App.tsx` no distingue todavía una respuesta real de un fallback a mock.

**Pendiente / fuera de alcance** (decisiones de alcance explícitas del plan de Track A, no olvidos):

- `server/satellite/integration/agentBridge.ts` sigue con su mock — no se conectó a un fetch satelital real del lado del servidor (el NDVI real de la §10 vive del lado del cliente, en `src/services/api/satelliteClient.ts`).
- Integraciones reales de BCRA (financial) y USDA PSD (yield) — ambas requieren API key, decisión explícita de dejarlas mock permanentemente.
- Evento WebSocket `scenario-changed` — no implementado, solo `score-updated`/`alert-triggered`.
- Badge dinámico "real vs. sintético" en la UI — `App.tsx` no distingue hoy una respuesta real del backend de un fallback a `mockAssessmentResponse.ts`; el badge "CASO SINTÉTICO" queda estático independientemente del origen del dato.

## 6. Documentos de referencia (no duplicar, consultar directamente)

- `docs/SATELLITE_MODULE.md` — módulo satelital completo (interfaces, fórmulas, mocks).
- `docs/AGENT_SPECIFICATION.md` — contratos de los 5 agentes (los consume `agentBridge.ts` y los paneles de la tarea 10).
- `docs/INTEGRATION_GUIDE.md` — contrato `POST /api/assessment`, eventos WebSocket, guion de demo.
- `docs/DATA_SOURCES.md` — APIs externas, rate limits, fallbacks.
- `shared/types/{agent,satellite,assessment}.ts` — contratos TypeScript ya implementados en el repo (FASE 0).
