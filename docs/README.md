# AGROSCORE — Documentacion

## Estructura

```
docs/
├── README.md                    # Este archivo
├── DEVELOPMENT_PLAN.md          # Plan de desarrollo y orden de implementacion
├── PHASE_SPECIFICATION.md       # Especificacion detallada de cada fase
├── AGENT_SPECIFICATION.md       # Contratos de interfaces y formato de salida
├── DATA_SOURCES.md              # Documentacion de APIs y fuentes de datos
├── SATELLITE_MODULE.md          # Modulo de analisis de imagenes satelitales
└── INTEGRATION_GUIDE.md         # Guia de integracion y demo script
```

## Resumen Rapido

### Para Dev 1 (Backend Core)
1. Leer `PHASE_SPECIFICATION.md` — FASE 3: Backend Core + Risk Engine
2. Leer `INTEGRATION_GUIDE.md` — Risk Engine Implementation + Server Implementation
3. Implementar: Express + Socket.IO + Risk Synthesis Engine

### Para Dev 2 (Agentes IA)
1. Leer `PHASE_SPECIFICATION.md` — FASE 1: Agentes Independientes
2. Leer `AGENT_SPECIFICATION.md` — Interfaces y formato de salida
3. Leer `DATA_SOURCES.md` — Documentacion de cada API
4. Implementar: 5 agentes independientes con mock data

### Para Dev 3 (Agro-tech)
1. Leer `PHASE_SPECIFICATION.md` — FASE 2: Satellite Module
2. Leer `SATELLITE_MODULE.md` — Arquitectura y proveedores
3. Leer `DATA_SOURCES.md` — Secciones 4, 6, 7, 8
4. Implementar: Satellite module + MQTT broker + API providers

### Para Dev 4 (Frontend/UX)
1. Leer `PHASE_SPECIFICATION.md` — FASE 4: Frontend Three.js
2. Leer `INTEGRATION_GUIDE.md` — Frontend Integration
3. Implementar: Three.js map + Agent panels + Stress engine UI

## Dependencias Criticas

```bash
# Backend
npm install express socket.io aedes mqtt ws cors helmet

# Frontend (Three.js)
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three

# APIs
npm install node-fetch zod dotenv
```

## URLs Importantes

- **BCRA API:** https://deudores.bcra.apidocs.ar/
- **Open-Meteo:** https://open-meteo.com/en/docs
- **SoilGrids:** https://dev-rest.isric.org/
- **GDELT:** https://www.gdeltproject.org/data.html
- **Copernicus:** https://dataspace.copernicus.eu/
- **NASA POWER:** https://power.larc.nasa.gov/docs/

## Variables de Entorno

```bash
# .env
BCRA_API_KEY=your_key
USDA_API_KEY=your_key
COPERNICUS_CLIENT_ID=your_id
COPERNICUS_CLIENT_SECRET=your_secret
PORT=3001
MQTT_PORT=1883
```
