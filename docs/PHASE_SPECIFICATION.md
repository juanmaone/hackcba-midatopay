# AGROSCORE — Especificacion de Fases

## Diagrama de Dependencias

```
                    FASE 0 (Preparacion)
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           v             v             v
      FASE 1        FASE 2        FASE 4
    (Agentes)    (Satellite)   (Frontend)
           │             │             │
           └──────┬──────┘             │
                  │                    │
                  v                    │
             FASE 3 (Backend)          │
                  │                    │
                  └────────┬───────────┘
                           │
                           v
                    FASE 5 (Integracion)
                           │
                           v
                    FASE 6 (ESP32) [Opcional]
```

---

## FASE 0: Preparacion Compartida

**Duracion:** 30 minutos
**Responsable:** Todos los devs en paralelo
**Dependencias:** Ninguna

### Objetivo
Configurar el entorno de desarrollo, definir contratos de interfaces y crear la estructura de carpetas base que todos los modulos usaran.

### Entradas
- `package.json` existente con React 19, Recharts, MapLibre, Tailwind
- `src/` con estructura actual (components/, services/, domain/, types/, data/)
- `tsconfig.json` existente

### Tareas

| # | Tarea | Tiempo | Responsable |
|---|-------|--------|-------------|
| 0.1 | Instalar dependencias backend | 5 min | Dev 1 |
| 0.2 | Instalar dependencias Three.js | 5 min | Dev 4 |
| 0.3 | Crear estructura de carpetas | 5 min | Todos |
| 0.4 | Definir `shared/types/agent.ts` | 10 min | Dev 1 |
| 0.5 | Definir `shared/types/satellite.ts` | 5 min | Dev 3 |
| 0.6 | Configurar `.env` con API keys | 5 min | Dev 3 |

### Salidas

**Archivos generados:**
```
src/
├── shared/
│   └── types/
│       ├── agent.ts           # Interface AgentResult, Alert, DataSource
│       ├── satellite.ts       # Interface SatelliteImage, SpectralIndex
│       └── index.ts           # Re-exports
├── agents/                    # Empty, waiting for FASE 1
├── engine/                    # Empty, waiting for FASE 3
├── mqtt/                      # Empty, waiting for FASE 3
└── satellite/                 # Empty, waiting for FASE 2
.env                           # API keys
```

**Formato de `shared/types/agent.ts`:**
```typescript
interface AgentResult {
  agentId: string;
  timestamp: string;
  confidence: number;
  score: number;
  data: Record<string, unknown>;
  metrics: AgentMetrics;
  alerts: Alert[];
  sources: DataSource[];
}

interface AgentMetrics {
  primary: number;
  secondary: number;
  trend: 'improving' | 'stable' | 'declining';
  volatility: number;
}

interface Alert {
  level: 'info' | 'warning' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  recommendation: string;
}

interface DataSource {
  provider: string;
  endpoint: string;
  lastUpdated: string;
  reliability: number;
}
```

**Dependencias npm instaladas:**
```bash
# Backend
npm install express socket.io aedes mqtt ws cors helmet dotenv node-fetch zod

# Frontend
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

### Criterios de Validacion
- [ ] Todas las carpetas creadas existen
- [ ] `shared/types/agent.ts` compila sin errores
- [ ] `.env` tiene todas las API keys requeridas
- [ ] `npm install` completa sin errores

### Riesgos y Fallbacks
| Riesgo | Fallback |
|--------|----------|
| npm install falla por permisos | Usar `--legacy-peer-deps` |
| API key no disponible | Usar mock data hasta obtener credenciales |

---

## FASE 1: Agentes Independientes

**Duracion:** 3 horas
**Responsable:** Dev 2 (Agentes IA) + Dev 3 (Agro-tech)
**Dependencias:** FASE 0 completada

### Objetivo
Desarrollar 5 agentes independientes que consuman APIs reales y retornen `AgentResult` estandarizado. Cada agente tiene mock data para testing offline.

### Entradas
- `shared/types/agent.ts` (de FASE 0)
- `DATA_SOURCES.md` con documentacion de APIs
- API keys en `.env`

### Tareas

#### 1.1 Financial Agent (30 min)
**API:** BCRA Central de Deudores
**Endpoint:** `GET https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/{CUIT}`

| # | Tarea | Tiempo |
|---|-------|--------|
| 1.1.1 | Crear `agents/financial/financialAgent.ts` | 10 min |
| 1.1.2 | Crear `agents/financial/financialMock.ts` | 5 min |
| 1.1.3 | Implementar scoring (status 1-5) | 10 min |
| 1.1.4 | Test unitario | 5 min |

**Salida esperada:**
```typescript
interface FinancialAgentResult extends AgentResult {
  agentId: 'financial';
  data: {
    totalDebt: number;
    delinquencyStatus: number;  // 1-5
    daysOverdue: number;
    rejectedChecks: number;
    entities: Array<{name: string; status: number; amount: number}>;
  };
}
```

#### 1.2 Climate Agent (30 min)
**API:** Open-Meteo Historical Weather
**Endpoint:** `GET https://archive-api.open-meteo.com/v1/archive`

| # | Tarea | Tiempo |
|---|-------|--------|
| 1.2.1 | Crear `agents/climate/climateAgent.ts` | 10 min |
| 1.2.2 | Crear `agents/climate/climateMock.ts` | 5 min |
| 1.2.3 | Implementar drought risk calculation | 10 min |
| 1.2.4 | Test unitario | 5 min |

**Salida esperada:**
```typescript
interface ClimateAgentResult extends AgentResult {
  agentId: 'climate';
  data: {
    historicalRainfall: number;
    rainfallAnomaly: number;
    droughtRisk: 'low' | 'medium' | 'high';
    temperatureAnomaly: number;
    consecutiveDryDays: number;
  };
}
```

#### 1.3 Yield Agent (30 min)
**API:** USDA PSD + MAGyP fallback
**Endpoint:** `GET https://api.nass.usda.gov/api/v1/`

| # | Tarea | Tiempo |
|---|-------|--------|
| 1.3.1 | Crear `agents/yield/yieldAgent.ts` | 10 min |
| 1.3.2 | Crear `agents/yield/yieldMock.ts` | 5 min |
| 1.3.3 | Implementar yield volatility | 10 min |
| 1.3.4 | Test unitario | 5 min |

**Salida esperada:**
```typescript
interface YieldAgentResult extends AgentResult {
  agentId: 'yield';
  data: {
    historicalYield: number[];
    expectedYield: number;
    stressYield: number;
    yieldVolatility: number;
    droughtYears: number;
  };
}
```

#### 1.4 Soil Agent (30 min)
**API:** SoilGrids REST API
**Endpoint:** `GET https://rest.isric.org/soilgrids/v2.0/properties/query`

| # | Tarea | Tiempo |
|---|-------|--------|
| 1.4.1 | Crear `agents/soil/soilAgent.ts` | 10 min |
| 1.4.2 | Crear `agents/soil/soilMock.ts` | 5 min |
| 1.4.3 | Implementar soil scoring | 10 min |
| 1.4.4 | Test unitario | 5 min |

**Salida esperada:**
```typescript
interface SoilAgentResult extends AgentResult {
  agentId: 'soil';
  data: {
    ph: number;
    organicCarbon: number;
    clayContent: number;
    sandContent: number;
    textureClass: string;
  };
}
```

#### 1.5 News/Sentiment Agent (30 min)
**API:** GDELT DOC API
**Endpoint:** `GET https://api.gdeltproject.org/api/v2/doc/doc`

| # | Tarea | Tiempo |
|---|-------|--------|
| 1.5.1 | Crear `agents/news/newsAgent.ts` | 10 min |
| 1.5.2 | Crear `agents/news/newsMock.ts` | 5 min |
| 1.5.3 | Implementar sentiment analysis | 10 min |
| 1.5.4 | Test unitario | 5 min |

**Salida esperada:**
```typescript
interface NewsAgentResult extends AgentResult {
  agentId: 'news';
  data: {
    articleCount: number;
    avgSentiment: number;
    positiveShare: number;
    negativeShare: number;
    topThemes: string[];
  };
}
```

#### 1.6 Tests Unitarios (30 min)

| # | Tarea | Tiempo |
|---|-------|--------|
| 1.6.1 | Configurar Vitest | 10 min |
| 1.6.2 | Tests para cada agente | 15 min |
| 1.6.3 | Validar AgentResult valido | 5 min |

### Salidas

**Archivos generados:**
```
src/agents/
├── financial/
│   ├── financialAgent.ts
│   ├── financialMock.ts
│   └── financialAgent.test.ts
├── climate/
│   ├── climateAgent.ts
│   ├── climateMock.ts
│   └── climateAgent.test.ts
├── yield/
│   ├── yieldAgent.ts
│   ├── yieldMock.ts
│   └── yieldAgent.test.ts
├── soil/
│   ├── soilAgent.ts
│   ├── soilMock.ts
│   └── soilAgent.test.ts
├── news/
│   ├── newsAgent.ts
│   ├── newsMock.ts
│   └── newsAgent.test.ts
└── index.ts                    # Export all agents
```

**Formato de salida comun (AgentResult):**
```typescript
{
  "agentId": "financial",
  "timestamp": "2026-09-12T10:30:00Z",
  "confidence": 0.95,
  "score": 61,
  "data": { ... },
  "metrics": {
    "primary": 61,
    "secondary": 0.45,
    "trend": "stable",
    "volatility": 0.1
  },
  "alerts": [],
  "sources": [{
    "provider": "BCRA",
    "endpoint": "/CentralDeDeudores/v1.0/Deudas/30712845399",
    "lastUpdated": "2026-09-12T10:30:00Z",
    "reliability": 0.95
  }]
}
```

### Criterios de Validacion
- [ ] Cada agente retorna `AgentResult` valido
- [ ] Cada agente tiene mock data que funciona offline
- [ ] Tests unitarios pasan (100%)
- [ ] Score normalizado entre 0-100
- [ ] Alerts se generan cuando se superan umbrales

### Riesgos y Fallbacks
| Riesgo | Fallback |
|--------|----------|
| BCRA API no responde | Usar financialMock.ts |
| Open-Meteo rate limit | Cache 24h + mock |
| SoilGrids en beta | Mock data siempre disponible |
| GDELT lento | Cache 1h + maxrecords limitado |

---

## FASE 2: Satellite Module

**Duracion:** 2 horas
**Responsable:** Dev 3 (Agro-tech)
**Dependencias:** FASE 0 completada

### Objetivo
Crear modulo independiente de analisis de imagenes satelitales con.indices espectrales (NDVI, NDWI, EVI) y deteccion de sequia.

### Entradas
- `shared/types/satellite.ts` (de FASE 0)
- `SATELLITE_MODULE.md` con documentacion
- Copernicus OAuth2 credentials

### Tareas

#### 2.1 Sentinel-2 Provider (30 min)
**API:** Copernicus CDSE STAC
**Auth:** OAuth2

| # | Tarea | Tiempo |
|---|-------|--------|
| 2.1.1 | Crear `satellite/providers/sentinelProvider.ts` | 15 min |
| 2.1.2 | Implementar busqueda de escenas | 10 min |
| 2.1.3 | Implementar descarga de bandas | 5 min |

#### 2.2 NDVI Calculation (30 min)
**Formula:** `NDVI = (B08 - B04) / (B08 + B04)`

| # | Tarea | Tiempo |
|---|-------|--------|
| 2.2.1 | Crear `satellite/indices/ndvi.ts` | 10 min |
| 2.2.2 | Implementar clasificacion NDVI | 10 min |
| 2.2.3 | Test con datos sinteticos | 10 min |

#### 2.3 Drought Index (30 min)
**Formula:** Combinacion ponderada NDVI + NDWI + precipitation

| # | Tarea | Tiempo |
|---|-------|--------|
| 2.3.1 | Crear `satellite/indices/droughtIndex.ts` | 15 min |
| 2.3.2 | Integrar con Climate Agent output | 10 min |
| 2.3.3 | Test con escenarios de sequia | 5 min |

#### 2.4 Soil Moisture Proxy (30 min)
**API:** ERA5-Land via Open-Meteo

| # | Tarea | Tiempo |
|---|-------|--------|
| 2.4.1 | Crear `satellite/analysis/moistureStress.ts` | 15 min |
| 2.4.2 | Integrar con Soil Agent output | 10 min |
| 2.4.3 | Test | 5 min |

### Salidas

**Archivos generados:**
```
src/satellite/
├── types.ts
├── providers/
│   ├── sentinelProvider.ts
│   ├── planetaryComputer.ts    # Fallback
│   └── mockSatellite.ts
├── indices/
│   ├── ndvi.ts
│   ├── ndwi.ts
│   ├── evi.ts
│   └── droughtIndex.ts
├── analysis/
│   ├── vegetationHealth.ts
│   ├── moistureStress.ts
│   └── cropGrowth.ts
├── integration/
│   └── agentBridge.ts
└── index.ts
```

**Formato de salida (VegetationAnalysis):**
```typescript
{
  "ndvi": {
    "name": "NDVI",
    "values": "Float32Array",
    "metadata": { "min": 0.35, "max": 0.72, "mean": 0.58, "std": 0.12 }
  },
  "droughtIndex": 0.78,
  "vegetationHealth": "good",
  "moistureStatus": "adequate",
  "cropStage": "vegetative",
  "alerts": [],
  "confidence": 0.92
}
```

### Criterios de Validacion
- [ ] Sentinel-2 search retorna escenas
- [ ] NDVI calculado correctamente (-1 a 1)
- [ ] Drought index combinado con Climate Agent
- [ ] Mock data funciona sin API keys

### Riesgos y Fallbacks
| Riesgo | Fallback |
|--------|----------|
| Copernicus OAuth2 falla | Usar Planetary Computer (sin auth) |
| Sin imagenes disponibles | Usar mockSatellite.ts |
| Calculo NDVI lento | Cache 24h por poligono |

---

## FASE 3: Backend Core + Risk Engine

**Duracion:** 2 horas
**Responsable:** Dev 1 (Backend Core)
**Dependencias:** FASE 1 + FASE 2 completadas

### Objetivo
Crear servidor Express con Socket.IO, endpoint de evaluacion de riesgo, Risk Synthesis Engine y broker MQTT.

### Entradas
- `src/agents/` (de FASE 1)
- `src/satellite/` (de FASE 2)
- `shared/types/` (de FASE 0)

### Tareas

#### 3.1 Express + Socket.IO Server (20 min)

| # | Tarea | Tiempo |
|---|-------|--------|
| 3.1.1 | Crear `server/index.ts` | 10 min |
| 3.1.2 | Configurar CORS y middleware | 5 min |
| 3.1.3 | Configurar Socket.IO events | 5 min |

#### 3.2 POST /api/assessment (30 min)

| # | Tarea | Tiempo |
|---|-------|--------|
| 3.2.1 | Crear `server/routes/risk.ts` | 10 min |
| 3.2.2 | Ejecutar 5 agentes en paralelo | 10 min |
| 3.2.3 | Ejecutar satellite analysis | 5 min |
| 3.2.4 | Retornar RiskAssessmentResponse | 5 min |

#### 3.3 Risk Synthesis Engine (30 min)

| # | Tarea | Tiempo |
|---|-------|--------|
| 3.3.1 | Crear `engine/riskSynthesis.ts` | 15 min |
| 3.3.2 | Implementar weighted aggregation | 10 min |
| 3.3.3 | Implementar DSCR calculation | 5 min |

**Formula de ponderacion:**
```
agroScore = (financialScore * 0.35) + (productiveScore * 0.65)

productiveScore = (yieldScore * 0.40) + (soilScore * 0.35) + (climateScore * 0.25)
```

#### 3.4 Stress Scenarios (20 min)

| # | Tarea | Tiempo |
|---|-------|--------|
| 3.4.1 | Crear `engine/stressScenarios.ts` | 10 min |
| 3.4.2 | Implementar 4 escenarios | 10 min |

**Escenarios:**
| Scenario | Yield | Price | Description |
|----------|-------|-------|-------------|
| BASE | 1.0x | 1.0x | Normal |
| DROUGHT | 0.7x | 1.0x | -30% yield |
| PRICE | 1.0x | 0.8x | -20% price |
| COMBINED | 0.7x | 0.8x | Both |

#### 3.5 MQTT Broker (20 min)

| # | Tarea | Tiempo |
|---|-------|--------|
| 3.5.1 | Crear `mqtt/broker.ts` | 10 min |
| 3.5.2 | Crear `mqtt/simulator.ts` | 10 min |

### Salidas

**Archivos generados:**
```
src/server/
├── index.ts
├── routes/
│   └── risk.ts
└── websocket.ts

src/engine/
├── riskSynthesis.ts
├── dscrCalculator.ts
├── stressScenarios.ts
└── exposureRecommender.ts

src/mqtt/
├── broker.ts
├── simulator.ts
└── topics/
    └── fieldSensors.ts
```

**Formato de RiskAssessmentResponse:**
```typescript
{
  "caseId": "AG-2026-041",
  "timestamp": "2026-09-12T10:30:00Z",
  "agents": {
    "financial": "AgentResult",
    "climate": "AgentResult",
    "yield": "AgentResult",
    "soil": "AgentResult",
    "news": "AgentResult"
  },
  "satellite": "VegetationAnalysis",
  "synthesis": {
    "agroScore": 78,
    "financialCapacity": 61,
    "productiveResilience": 82,
    "recommendedExposure": 76000000,
    "dscr": { "base": 1.82, "stress": 1.24 },
    "rating": "B+",
    "decision": "APPROVE WITH LIMIT"
  },
  "scenarios": {
    "base": { "score": 82, "exposure": 76000000, "dscr": 1.82, "risk": "low" },
    "drought": { "score": 68, "exposure": 49000000, "dscr": 1.13, "risk": "medium" },
    "price": { "score": 72, "exposure": 58000000, "dscr": 1.27, "risk": "medium" },
    "combined": { "score": 56, "exposure": 34000000, "dscr": 0.91, "risk": "high" }
  }
}
```

### Criterios de Validacion
- [ ] Server arranca en puerto 3001
- [ ] POST /api/assessment retorna respuesta completa
- [ ] Risk Engine calcula scores correctamente
- [ ] Stress scenarios generan 4 variantes
- [ ] MQTT broker acepta conexiones
- [ ] WebSocket emite eventos

### Riesgos y Fallbacks
| Riesgo | Fallback |
|--------|----------|
| Agentes no responden | Usar mock data |
| Risk Engine lento | Cache resultados 5 min |
| MQTT broker falla | Skip IoT, continuar demo |

---

## FASE 4: Frontend Three.js

**Duracion:** 2 horas
**Responsable:** Dev 4 (Frontend/UX)
**Dependencias:** FASE 0 completada (puede empezar en paralelo con FASE 1-3)

### Objetivo
Crear mapa 3D interactivo con Three.js, panels de agentes en sidebar y stress engine con animaciones.

### Entradas
- `shared/types/` (de FASE 0)
- API contract de `INTEGRATION_GUIDE.md`
- Componentes UI existentes (ScoreRing, SectionLabel, etc.)

### Tareas

#### 4.1 ThreeGlobe (30 min)

| # | Tarea | Tiempo |
|---|-------|--------|
| 4.1.1 | Crear `components/map/ThreeGlobe.tsx` | 15 min |
| 4.1.2 | Implementar esfera 3D rotatoria | 10 min |
| 4.1.3 | Agregar textura satelital | 5 min |

#### 4.2 Terrain Mesh (30 min)

| # | Tarea | Tiempo |
|---|-------|--------|
| 4.2.1 | Crear `components/map/TerrainMesh.tsx` | 15 min |
| 4.2.2 | Implementar BufferGeometry con elevation | 10 min |
| 4.2.3 | Agregar poligono del campo 3D | 5 min |

#### 4.3 Satellite Overlay (20 min)

| # | Tarea | Tiempo |
|---|-------|--------|
| 4.3.1 | Crear `components/map/SatelliteOverlay.tsx` | 10 min |
| 4.3.2 | Implementar ShaderMaterial NDVI colormap | 10 min |

**Colormap NDVI:**
```
< 0.1: Marron (bare soil)
0.1-0.3: Amarillo (sparse)
0.3-0.5: Naranja (moderate)
0.5-0.7: Verde claro (dense)
> 0.7: Verde oscuro (very dense)
```

#### 4.4 Agent Panels (20 min)

| # | Tarea | Tiempo |
|---|-------|--------|
| 4.4.1 | Crear `components/agents/ClimatePanel.tsx` | 5 min |
| 4.4.2 | Crear `components/agents/FinancialPanel.tsx` | 5 min |
| 4.4.3 | Crear `components/agents/SoilPanel.tsx` | 5 min |
| 4.4.4 | Crear `components/agents/YieldPanel.tsx` | 5 min |

#### 4.5 Stress Engine UI (20 min)

| # | Tarea | Tiempo |
|---|-------|--------|
| 4.5.1 | Mejorar `components/stress/StressTest.tsx` | 10 min |
| 4.5.2 | Agregar animaciones de transicion | 5 min |
| 4.5.3 | Agregar ExposureSlider | 5 min |

### Salidas

**Archivos generados:**
```
src/components/map/
├── ThreeGlobe.tsx
├── TerrainMesh.tsx
├── SatelliteOverlay.tsx
├── DroughtHeatmap.tsx
├── FieldPolygon.tsx
├── OrbitControls.tsx
└── index.ts

src/components/agents/
├── ClimatePanel.tsx
├── FinancialPanel.tsx
├── SoilPanel.tsx
├── YieldPanel.tsx
├── NewsPanel.tsx
└── index.ts

src/components/engine/
├── StressTest.tsx          # Mejorado
├── ExposureSlider.tsx
└── ScenarioTransition.tsx
```

### Criterios de Validacion
- [ ] ThreeGlobe renderiza sin errores
- [ ] Campo aparece en Argentina
- [ ] Overlay NDVI cambia colores
- [ ] Panels muestran datos de agentes
- [ ] Stress engine anima transiciones
- [ ] Responsive en desktop

### Riesgos y Fallbacks
| Riesgo | Fallback |
|--------|----------|
| Three.js lento | Reducir polygonos |
| Textura no carga | Usar color solido |
| Animaciones jank | Usar CSS transitions |

---

## FASE 5: Integracion

**Duracion:** 1 hora
**Responsable:** Todos los devs
**Dependencias:** FASE 3 + FASE 4 completadas

### Objetivo
Conectar backend con frontend, validar flujo completo de datos y preparar demo script.

### Entradas
- Backend de FASE 3 (server, engine, agents)
- Frontend de FASE 4 (Three.js, panels)
- API contracts de `INTEGRATION_GUIDE.md`

### Tareas

#### 5.1 Backend + Frontend Connection (20 min)

| # | Tarea | Tiempo | Responsable |
|---|-------|--------|-------------|
| 5.1.1 | Frontend consume POST /api/assessment | 10 min | Dev 4 |
| 5.1.2 | WebSocket client连接 Socket.IO | 10 min | Dev 4 |

#### 5.2 Agent Data Flow (20 min)

| # | Tarea | Tiempo | Responsable |
|---|-------|--------|-------------|
| 5.2.1 | Satellite data fluye a UI | 10 min | Dev 3+4 |
| 5.2.2 | Agent scores actualizan panels | 10 min | Dev 2+4 |

#### 5.3 Demo Script Rehearsal (20 min)

| # | Tarea | Tiempo | Responsable |
|---|-------|--------|-------------|
| 5.3.1 | Ejecutar demo completa | 10 min | Todos |
| 5.3.2 | Fix issues | 10 min | Todos |

### Salidas
- Demo funcional completa
- Sin errores en consola
- WebSocket actualizando datos

### Criterios de Validacion
- [ ] Frontend carga sin errores
- [ ] Click en stress scenarios funciona
- [ ] Datos de agentes aparecen en UI
- [ ] Satellite overlay visible
- [ ] Demo completa en <3 minutos

---

## FASE 6: ESP32 / IoT (Opcional)

**Duracion:** Variable
**Responsable:** Dev 3 (Agro-tech)
**Dependencias:** FASE 3 completada

### Objetivo
Integrar sensores fisicos para demostracion de monitoreo en tiempo real.

### Entradas
- MQTT broker de FASE 3
- Hardware: ESP32, sensores

### Tareas

| # | Tarea | Tiempo |
|---|-------|--------|
| 6.1 | Configurar ESP32 con Arduino IDE | 30 min |
| 6.2 | Conectar sensor humedad (capacitivo) | 15 min |
| 6.3 | Conectar DHT22 (temp/humedad) | 15 min |
| 6.4 | Publicar datos via MQTT | 15 min |
| 6.5 | Dashboard realtime en UI | 15 min |

### Salidas
- ESP32 publicando datos
- Dashboard mostrando sensor data
- Alertas por umbrales

### Criterios de Validacion
- [ ] ESP32 conecta a MQTT broker
- [ ] Datos llegan al frontend
- [ ] Alertas se generan correctamente

---

## Resumen de Tiempos

| Fase | Duracion | Dependencias | Paralelizable |
|------|----------|--------------|---------------|
| FASE 0 | 30 min | Ninguna | No |
| FASE 1 | 3 h | FASE 0 | Dev 2 + Dev 3 |
| FASE 2 | 2 h | FASE 0 | Dev 3 (parcial) |
| FASE 3 | 2 h | FASE 1 + 2 | No |
| FASE 4 | 2 h | FASE 0 | Si (con FASE 1-3) |
| FASE 5 | 1 h | FASE 3 + 4 | No |
| FASE 6 | Variable | FASE 3 | Si |
| **TOTAL** | **~9 h** | | |

## Critica Path

```
FASE 0 (30 min)
    │
    v
FASE 1 (3 h) ──────────────────┐
    │                          │
    v                          v
FASE 2 (2 h) ──> FASE 3 (2 h) ──> FASE 5 (1 h)
                                                    
FASE 4 (2 h) ─────────────────────────────────────┘
```
