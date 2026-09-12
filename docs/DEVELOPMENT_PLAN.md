# AGROSCORE — Plan de Desarrollo MVP (10 horas)

## Arquitectura General

```
FRONTEND (React + Three.js + MapLibre)
├── ThreeGlobe (3D Map)
├── AgentPanels (Sidebar)
├── StressEngine (Simulator)
└── Satellite Overlay
        │ WebSocket + REST
        │
BACKEND (Node.js + TypeScript)
├── 5 Agents (Independent)
├── Risk Engine (Aggregator)
├── MQTT Broker (Aedes)
└── Satellite Service
```

## Orden de Implementación

### FASE 0: Preparación (30 min)
- Instalar dependencias: three @react-three/fiber @react-three/drei @types/three
- Crear estructura de carpetas: agents/, engine/, mqtt/, satellite/
- Definir contratos de interfaces TypeScript
- Configurar variables de entorno (.env)

### FASE 1: Agentes Independientes (3h) — Dev 2 + Dev 3
Cada agente se desarrolla por separado con mock data para testing.

| Orden | Agente        | API Principal                    | Mock Data         | Tiempo |
|-------|---------------|----------------------------------|-------------------|--------|
| 1     | Financial     | BCRA Central de Deudores         | financialMock.ts  | 30 min |
| 2     | Climate       | Open-Meteo Historical Weather    | climateMock.ts    | 30 min |
| 3     | Yield         | USDA FAS + MAGyP                 | yieldMock.ts      | 30 min |
| 4     | Soil          | SoilGrids REST API               | soilMock.ts       | 30 min |
| 5     | News/Sentiment| GDELT DOC API                    | newsMock.ts       | 30 min |
| 6     | Tests unitarios| —                               | —                 | 30 min |

### FASE 2: Satellite Module (2h) — Dev 3 (Agro-tech)
Modulo independiente de analisis de imagenes satelitales.

| Orden | Componente               | API                        | Tiempo |
|-------|--------------------------|----------------------------|--------|
| 1     | Sentinel-2 search + download | Copernicus CDSE STAC  | 30 min |
| 2     | NDVI calculation         | Sentinel-2 bands B04/B08   | 30 min |
| 3     | Drought index            | NDWI + precipitation anomaly| 30 min |
| 4     | Soil moisture proxy      | SMAP or ERA5-Land          | 30 min |

### FASE 3: Backend Core + Risk Engine (2h) — Dev 1
Integracion de agentes + motor de riesgo.

| Orden | Componente                              | Tiempo |
|-------|-----------------------------------------|--------|
| 1     | Express + Socket.IO server              | 20 min |
| 2     | POST /api/assessment endpoint           | 30 min |
| 3     | Risk Synthesis Engine (weighted aggregation) | 30 min |
| 4     | Stress scenarios: BASE/DROUGHT/PRICE/COMBINED | 20 min |
| 5     | MQTT broker (Aedes) + simulator         | 20 min |

### FASE 4: Frontend Three.js (2h) — Dev 4 (Producto/UX)
Mapa 3D interactivo + panels de agentes.

| Orden | Componente                    | Libreria               | Tiempo |
|-------|-------------------------------|------------------------|--------|
| 1     | ThreeGlobe (esfera 3D)       | @react-three/fiber     | 30 min |
| 2     | Terrain mesh (elevation)     | Three.js BufferGeometry| 30 min |
| 3     | Satellite overlay (NDVI)     | Three.js ShaderMaterial| 20 min |
| 4     | Agent panels (sidebar)       | React + Tailwind       | 20 min |
| 5     | Stress engine UI (mejorado)  | React + Recharts       | 20 min |

### FASE 5: Integracion (1h) — Todos
Conexion de todos los modulos.

| Dev       | Integracion                                  |
|-----------|----------------------------------------------|
| Dev 1+2   | Agentes se conectan al Risk Engine           |
| Dev 1+3   | MQTT broker + Satellite service              |
| Dev 1+4   | Frontend consume API + WebSocket             |
| Dev 3+4   | Datos satelitales fluyen a UI                |
| Todos     | Demo script completo                         |

### FASE 6: ESP32 / IoT (ultimo, opcional)
- Sensor de humedad del suelo (capacitivo)
- Sensor de temperatura/humedad (DHT22)
- Estacion meteorologica basica
- Conexion MQTT al broker Aedes
- Dashboard en tiempo real

## Equipo de Desarrollo

| Dev | Rol              | Modulo Principal         | Archivos                    |
|-----|------------------|--------------------------|-----------------------------|
| 1   | Backend Core     | API Server + Risk Engine | server/, engine/            |
| 2   | Agentes IA       | 5 Agentes independientes | agents/*/                   |
| 3   | Agro-tech        | MQTT + Satellite + APIs  | mqtt/, satellite/, providers/|
| 4   | Frontend/UX      | Three.js Map + UI        | components/map/, components/agents/ |

## Dependencias npm

```bash
# Backend
npm install express socket.io aedes mqtt ws cors helmet

# Frontend (Three.js)
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three

# MapLibre (ya instalado, activar)
npm install maplibre-gl react-map-gl

# APIs
npm install node-fetch zod dotenv

# Testing
npm install -D vitest @testing-library/react
```

## Criterios de Aceptacion MVP

- 5 agentes retornan AgentResult valido
- Risk Engine agrega scores con pesos correctos (Financial 35%, Productive 65%)
- Stress engine muestra 4 escenarios con transiciones
- Three.js globe renderiza campo con overlay satelital
- WebSocket actualiza datos en tiempo real
- Demo script completa en <3 minutos
- Sin errores en consola del navegador
