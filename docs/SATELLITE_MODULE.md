# AGROSCORE — Modulo de Analisis de Imagenes Satelitales

## Arquitectura del Modulo

```
satellite/
├── index.ts                    # Export principal
├── types.ts                    # Interfaces TypeScript
├── providers/
│   ├── sentinelProvider.ts     # Copernicus CDSE
│   ├── planetaryComputer.ts    # Microsoft Planetary Computer (fallback)
│   └── mockSatellite.ts       # Mock data
├── indices/
│   ├── ndvi.ts                 # Normalized Difference Vegetation Index
│   ├── ndwi.ts                 # Normalized Difference Water Index
│   ├── evi.ts                  # Enhanced Vegetation Index
│   └── droughtIndex.ts         # Indice compuesto de sequia
├── analysis/
│   ├── vegetationHealth.ts     # Salud de la vegetacion
│   ├── moistureStress.ts       # Estres hidrico
│   └── cropGrowth.ts           # Fase de crecimiento
└── integration/
    └── agentBridge.ts          # Conexion con otros agentes
```

## Interfaces

```typescript
// satellite/types.ts

interface SatelliteImage {
  id: string;
  date: string;                // ISO 8601
  bbox: [number, number, number, number]; // [west, south, east, north]
  cloudCover: number;          // 0-100%
  bands: {
    B02: Uint16Array;          // Blue (10m)
    B03: Uint16Array;          // Green (10m)
    B04: Uint16Array;          // Red (10m)
    B08: Uint16Array;          // NIR (10m)
    B8A: Uint16Array;          // Narrow NIR (20m)
    B11: Uint16Array;          // SWIR (20m)
  };
}

interface SpectralIndex {
  name: string;                // e.g., "NDVI"
  values: Float32Array;        // Index values (-1 to 1)
  metadata: {
    min: number;
    max: number;
    mean: number;
    std: number;
    timestamp: string;
  };
}

interface VegetationAnalysis {
  ndvi: SpectralIndex;
  ndwi: SpectralIndex;
  evi: SpectralIndex;
  droughtIndex: number;        // 0-1 (0=severe drought, 1=optimal)
  vegetationHealth: 'excellent' | 'good' | 'stressed' | 'critical';
  moistureStatus: 'optimal' | 'adequate' | 'deficient' | 'critical';
  cropStage: 'planting' | 'vegetative' | 'flowering' | 'grain_fill' | 'harvest';
  alerts: SatelliteAlert[];
  confidence: number;          // 0-1
}

interface SatelliteAlert {
  type: 'vegetation_decline' | 'moisture_stress' | 'drought_detected' | 'frost_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedArea: number;        // percentage of field
  recommendation: string;
}

interface FieldWithSatellite {
  caseId: string;
  field: {
    lat: number;
    lng: number;
    hectares: number;
    polygon: Array<[number, number]>;
  };
  satellite: VegetationAnalysis;
  lastImageDate: string;
  imageCount: number;
}
```

## 1. Sentinel-2 Provider

**Proposito:** Obtener imagenes satelitales de Sentinel-2 L2A.

**Flujo:**
1. Autenticar con Copernicus CDSE (OAuth2)
2. Buscar escenas en el STAC Catalog
3. Filtrar por cobertura de nubes < 20%
4. Descargar bandas requeridas (B02, B03, B04, B08, B8A, B11)
5. Calcular indices espectrales

**Implementacion:**
```typescript
// satellite/providers/sentinelProvider.ts

export async function searchSentinelScenes(
  bbox: [number, number, number, number],
  startDate: string,
  endDate: string
): Promise<SatelliteScene[]> {
  const token = await getOAuthToken();
  
  const response = await fetch('https://sh.dataspace.copernicus.eu/api/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      collections: ['SENTINEL-2'],
      bbox,
      datetime: `${startDate}T00:00:00Z/${endDate}T23:59:59Z`,
      query: {
        'eo:cloud_cover': { lt: 20 }
      },
      limit: 10
    })
  });

  return response.json();
}

export async function downloadBands(
  sceneId: string,
  bands: string[]
): Promise<SatelliteImage> {
  const token = await getOAuthToken();
  
  const response = await fetch('https://sh.dataspace.copernicus.eu/api/v1/process', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: {
        bounds: { bbox: [-62.12, -32.72, -62.08, -32.68] },
        data: [{
          type: 'S2L2A',
          dataFilter: {
            timeRange: { from: '2024-01-01T00:00:00Z', to: '2024-01-31T23:59:59Z' },
            mosaickingOrder: 'leastCC'
          }
        }]
      },
      output: { width: 512, height: 512 },
      evalscript: generateEvalscript(bands)
    })
  });

  return response.arrayBuffer();
}
```

## 2. Indices Espectrales

### NDVI (Normalized Difference Vegetation Index)
```typescript
// satellite/indices/ndvi.ts

export function calculateNDVI(
  nir: Uint16Array,    // B08 o B8A
  red: Uint16Array     // B04
): Float32Array {
  const ndvi = new Float32Array(nir.length);
  
  for (let i = 0; i < nir.length; i++) {
    const nirVal = nir[i] / 10000;  // Scale factor
    const redVal = red[i] / 10000;
    
    const denominator = nirVal + redVal;
    ndvi[i] = denominator === 0 ? 0 : (nirVal - redVal) / denominator;
  }
  
  return ndvi;
}

// NDVI Classification
export function classifyNDVI(ndvi: number): string {
  if (ndvi < 0) return 'water';
  if (ndvi < 0.1) return 'bare_soil';
  if (ndvi < 0.2) return 'sparse_vegetation';
  if (ndvi < 0.4) return 'moderate_vegetation';
  if (ndvi < 0.6) return 'dense_vegetation';
  return 'very_dense_vegetation';
}
```

### NDWI (Normalized Difference Water Index)
```typescript
// satellite/indices/ndwi.ts

export function calculateNDWI(
  green: Uint16Array,  // B03
  nir: Uint16Array     // B08
): Float32Array {
  const ndwi = new Float32Array(green.length);
  
  for (let i = 0; i < green.length; i++) {
    const greenVal = green[i] / 10000;
    const nirVal = nir[i] / 10000;
    
    const denominator = greenVal + nirVal;
    ndwi[i] = denominator === 0 ? 0 : (greenVal - nirVal) / denominator;
  }
  
  return ndwi;
}

// NDWI Classification
export function classifyNDWI(ndwi: number): string {
  if (ndwi > 0.3) return 'water_body';
  if (ndwi > 0.1) return 'high_moisture';
  if (ndwi > -0.1) return 'adequate_moisture';
  if (ndwi > -0.3) return 'moisture_stress';
  return 'severe_stress';
}
```

### Drought Index (Compuesto)
```typescript
// satellite/indices/droughtIndex.ts

export function calculateDroughtIndex(
  ndvi: Float32Array,
  ndwi: Float32Array,
  precipitationAnomaly: number  // From Climate Agent
): number {
  // Weighted average
  const ndviWeight = 0.4;
  const ndwiWeight = 0.35;
  const precipWeight = 0.25;
  
  // Normalize NDVI to 0-1 (assuming typical range -0.1 to 0.8)
  const ndviNormalized = Math.max(0, Math.min(1, (mean(ndvi) + 0.1) / 0.9));
  
  // Normalize NDWI to 0-1 (assuming typical range -0.5 to 0.5)
  const ndwiNormalized = Math.max(0, Math.min(1, (mean(ndwi) + 0.5) / 1.0));
  
  // Normalize precipitation anomaly to 0-1 (-50% to +50%)
  const precipNormalized = Math.max(0, Math.min(1, (precipitationAnomaly + 50) / 100));
  
  return ndviNormalized * ndviWeight + ndwiNormalized * ndwiWeight + precipNormalized * precipWeight;
}
```

## 3. Analysis Modules

### Vegetation Health Analysis
```typescript
// satellite/analysis/vegetationHealth.ts

export function analyzeVegetationHealth(
  ndvi: Float32Array,
  historicalNdvi: Float32Array[]  // Last 5 years same period
): {
  health: 'excellent' | 'good' | 'stressed' | 'critical';
  deviation: number;
  trend: 'improving' | 'stable' | 'declining';
} {
  const currentMean = mean(ndvi);
  const historicalMean = mean(historicalNdvi.map(mean));
  const historicalStd = std(historicalNdvi.map(mean));
  
  const deviation = (currentMean - historicalMean) / historicalStd;
  
  let health: string;
  if (deviation > 1) health = 'excellent';
  else if (deviation > 0) health = 'good';
  else if (deviation > -1) health = 'stressed';
  else health = 'critical';
  
  // Trend calculation
  const recentYears = historicalNdvi.slice(-3);
  const trend = calculateTrend(recentYears.map(mean));
  
  return { health, deviation, trend };
}
```

### Moisture Stress Analysis
```typescript
// satellite/analysis/moistureStress.ts

export function analyzeMoistureStress(
  ndwi: Float32Array,
  soilMoisture: number,  // From Soil Agent (0-1)
  rainfallAnomaly: number  // From Climate Agent (%)
): {
  status: 'optimal' | 'adequate' | 'deficient' | 'critical';
  stressLevel: number;  // 0-1
  riskAreas: number;    // percentage of field with stress
} {
  const ndwiMean = mean(ndwi);
  
  // Combine indicators
  const ndwiScore = (ndwiMean + 0.5) / 1.0;  // Normalize to 0-1
  const soilScore = soilMoisture;
  const rainScore = Math.max(0, Math.min(1, (rainfallAnomaly + 50) / 100));
  
  const stressLevel = 1 - (ndwiScore * 0.4 + soilScore * 0.35 + rainScore * 0.25);
  
  // Calculate risk areas (pixels with NDWI < -0.1)
  const riskPixels = ndwi.filter(v => v < -0.1).length;
  const riskAreas = (riskPixels / ndwi.length) * 100;
  
  let status: string;
  if (stressLevel < 0.2) status = 'optimal';
  else if (stressLevel < 0.4) status = 'adequate';
  else if (stressLevel < 0.6) status = 'deficient';
  else status = 'critical';
  
  return { status, stressLevel, riskAreas };
}
```

## 4. Integration with Other Agents

```typescript
// satellite/integration/agentBridge.ts

import { ClimateAgentResult } from '../../shared/types/agent';
import { SoilAgentResult } from '../../shared/types/agent';
import { YieldAgentResult } from '../../shared/types/agent';

export async function enrichWithSatelliteData(
  field: { lat: number; lng: number; polygon: Array<[number, number]> },
  agents: {
    climate?: ClimateAgentResult;
    soil?: SoilAgentResult;
    yield?: YieldAgentResult;
  }
): Promise<VegetationAnalysis> {
  // 1. Get satellite imagery
  const images = await searchSentinelScenes(
    calculateBBox(field.polygon),
    getStartDate(),
    getEndDate()
  );
  
  // 2. Calculate spectral indices
  const ndvi = calculateNDVI(images.latest.bands.B08, images.latest.bands.B04);
  const ndwi = calculateNDWI(images.latest.bands.B03, images.latest.bands.B08);
  const evi = calculateEVI(images.latest.bands.B08, images.latest.bands.B04, images.latest.bands.B02);
  
  // 3. Get supplementary data from agents
  const precipitationAnomaly = agents.climate?.data?.rainfallAnomaly ?? 0;
  const soilMoisture = (agents.soil?.data?.organicCarbon ?? 15) / 100;
  
  // 4. Calculate drought index
  const droughtIndex = calculateDroughtIndex(ndvi, ndwi, precipitationAnomaly);
  
  // 5. Analyze vegetation health
  const historicalNdvi = await getHistoricalNdvi(field.polygon);
  const vegetationHealth = analyzeVegetationHealth(ndvi, historicalNdvi);
  
  // 6. Analyze moisture stress
  const moistureStress = analyzeMoistureStress(ndwi, soilMoisture, precipitationAnomaly);
  
  // 7. Detect crop stage (based on NDVI temporal profile)
  const cropStage = detectCropStage(ndvi, historicalNdvi);
  
  // 8. Generate alerts
  const alerts = generateSatelliteAlerts(
    vegetationHealth,
    moistureStress,
    droughtIndex,
    agents
  );
  
  return {
    ndvi: { name: 'NDVI', values: ndvi, metadata: calculateStats(ndvi) },
    ndwi: { name: 'NDWI', values: ndwi, metadata: calculateStats(ndwi) },
    evi: { name: 'EVI', values: evi, metadata: calculateStats(evi) },
    droughtIndex,
    vegetationHealth: vegetationHealth.health,
    moistureStatus: moistureStress.status,
    cropStage,
    alerts,
    confidence: calculateConfidence(images.length, images[0].cloudCover)
  };
}
```

## 5. Mock Data for Testing

```typescript
// satellite/providers/mockSatellite.ts

export const mockSatelliteAnalysis: VegetationAnalysis = {
  ndvi: {
    name: 'NDVI',
    values: new Float32Array([0.65, 0.72, 0.68, 0.71, 0.69]),
    metadata: { min: 0.65, max: 0.72, mean: 0.69, std: 0.03, timestamp: new Date().toISOString() }
  },
  ndwi: {
    name: 'NDWI',
    values: new Float32Array([0.12, 0.15, 0.11, 0.14, 0.13]),
    metadata: { min: 0.11, max: 0.15, mean: 0.13, std: 0.02, timestamp: new Date().toISOString() }
  },
  evi: {
    name: 'EVI',
    values: new Float32Array([0.45, 0.52, 0.48, 0.51, 0.49]),
    metadata: { min: 0.45, max: 0.52, mean: 0.49, std: 0.03, timestamp: new Date().toISOString() }
  },
  droughtIndex: 0.78,
  vegetationHealth: 'good',
  moistureStatus: 'adequate',
  cropStage: 'vegetative',
  alerts: [],
  confidence: 0.92
};

// Drought scenario
export const mockDroughtAnalysis: VegetationAnalysis = {
  ...mockSatelliteAnalysis,
  ndvi: {
    ...mockSatelliteAnalysis.ndvi,
    values: new Float32Array([0.35, 0.42, 0.38, 0.41, 0.39]),
    metadata: { min: 0.35, max: 0.42, mean: 0.39, std: 0.03, timestamp: new Date().toISOString() }
  },
  droughtIndex: 0.32,
  vegetationHealth: 'stressed',
  moistureStatus: 'deficient',
  alerts: [{
    type: 'moisture_stress',
    severity: 'high',
    message: 'Significant moisture stress detected across 65% of field',
    affectedArea: 65,
    recommendation: 'Irrigation recommended within 48 hours'
  }],
  confidence: 0.88
};
```

## 6. API Rate Limits y Estrategia

| API             | Rate Limit       | Strategy |
|-----------------|------------------|----------|
| Copernicus CDSE | 30 req/min       | Cache 24h, batch requests |
| Planetary Computer | Sin limite   | Primary fallback |
| SoilGrids       | 5 req/min        | Cache 7 days |
| NASA POWER      | Sin limite       | Cache 24h |

**Caching Strategy:**
```typescript
const cache = new Map<string, { data: any; expiry: number }>();

function getCached(key: string, ttlMs: number): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any, ttlMs: number): void {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}
```
