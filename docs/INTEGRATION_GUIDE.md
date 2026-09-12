# AGROSCORE — Guia de Integracion

## Flujo de Datos

```
                    ┌─────────────────┐
                    │   Agent Input   │
                    │  (Case Data)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              v              v              v
        ┌─────────┐   ┌─────────┐   ┌─────────┐
        │Climate  │   │Financial│   │  Soil   │
        │Agent    │   │Agent    │   │  Agent  │
        └────┬────┘   └────┬────┘   └────┬────┘
             │              │              │
             v              v              v
        ┌─────────┐   ┌─────────┐   ┌─────────┐
        │  Yield  │   │  News   │   │Satellite│
        │  Agent  │   │  Agent  │   │ Module  │
        └────┬────┘   └────┬────┘   └────┬────┘
             │              │              │
             └──────────────┼──────────────┘
                            │
                            v
                    ┌─────────────────┐
                    │   Risk Engine   │
                    │  (Aggregation)  │
                    └────────┬────────┘
                            │
                            v
                    ┌─────────────────┐
                    │  API Response   │
                    │  + WebSocket    │
                    └─────────────────┘
```

## Endpoint Principal

### POST /api/assessment

**Request:**
```json
{
  "cuit": "30-71284539-9",
  "applicant": {
    "name": "Marcos Juarez"
  },
  "field": {
    "lat": -32.69,
    "lng": -62.10,
    "hectares": 300,
    "crop": "maiz",
    "campaign": "2026/27",
    "polygon": [
      [-62.105, -32.685],
      [-62.094, -32.688],
      [-62.091, -32.698],
      [-62.103, -32.704],
      [-62.113, -32.697]
    ]
  },
  "loan": {
    "requestedAmount": 100000000,
    "termMonths": 12
  }
}
```

**Response:**
```json
{
  "caseId": "AG-2026-041",
  "timestamp": "2026-09-12T10:30:00Z",
  "agents": {
    "financial": {
      "agentId": "financial",
      "score": 61,
      "confidence": 0.95,
      "data": {
        "totalDebt": 138000,
        "delinquencyStatus": 1,
        "daysOverdue": 0
      },
      "alerts": []
    },
    "climate": {
      "agentId": "climate",
      "score": 72,
      "confidence": 0.88,
      "data": {
        "historicalRainfall": 645,
        "rainfallAnomaly": -12,
        "droughtRisk": "medium"
      },
      "alerts": [{
        "level": "warning",
        "message": "Rainfall 12% below average"
      }]
    },
    "yield": {
      "agentId": "yield",
      "score": 78,
      "confidence": 0.82,
      "data": {
        "expectedYield": 8.2,
        "stressYield": 5.7,
        "yieldVolatility": 18
      },
      "alerts": []
    },
    "soil": {
      "agentId": "soil",
      "score": 89,
      "confidence": 0.90,
      "data": {
        "ph": 6.2,
        "organicCarbon": 21.0,
        "textureClass": "Loam"
      },
      "alerts": []
    },
    "news": {
      "agentId": "news",
      "score": 55,
      "confidence": 0.75,
      "data": {
        "articleCount": 45,
        "avgSentiment": -0.15,
        "topThemes": ["drought", "export_restrictions"]
      },
      "alerts": [{
        "level": "info",
        "message": "Negative sentiment in agricultural news"
      }]
    }
  },
  "synthesis": {
    "agroScore": 78,
    "financialCapacity": 61,
    "productiveResilience": 82,
    "recommendedExposure": 76000000,
    "dscr": {
      "base": 1.82,
      "stress": 1.24
    },
    "rating": "B+",
    "decision": "APPROVE WITH LIMIT",
    "breakdown": {
      "financialWeight": 0.35,
      "productiveWeight": 0.65
    }
  },
  "scenarios": {
    "base": {
      "score": 82,
      "exposure": 76000000,
      "dscr": 1.82,
      "risk": "low"
    },
    "drought": {
      "score": 68,
      "exposure": 49000000,
      "dscr": 1.13,
      "risk": "medium"
    },
    "price": {
      "score": 72,
      "exposure": 58000000,
      "dscr": 1.27,
      "risk": "medium"
    },
    "combined": {
      "score": 56,
      "exposure": 34000000,
      "dscr": 0.91,
      "risk": "high"
    }
  }
}
```

## WebSocket Events

### Connection
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to AGROSCORE server');
});
```

### Events

**score-updated** — Cuando un agente actualiza su score:
```typescript
socket.on('score-updated', (data: {
  caseId: string;
  agentId: string;
  score: number;
  timestamp: string;
}) => {
  console.log(`${data.agentId}: ${data.score}`);
});
```

**alert-triggered** — Cuando se genera una alerta:
```typescript
socket.on('alert-triggered', (data: {
  caseId: string;
  alert: Alert;
  agentId: string;
}) => {
  console.log(`Alert: ${data.alert.message}`);
});
```

**scenario-changed** — Cuando cambia el escenario de stress:
```typescript
socket.on('scenario-changed', (data: {
  caseId: string;
  scenario: string;
  exposure: number;
  dscr: number;
}) => {
  console.log(`${data.scenario}: ARS ${data.exposure}`);
});
```

**sensor-data** — Datos IoT en tiempo real (MQTT bridge):
```typescript
socket.on('sensor-data', (data: {
  fieldId: string;
  sensors: {
    soilMoisture: number;
    temperature: number;
    humidity: number;
  };
  timestamp: string;
}) => {
  console.log(`Soil: ${data.sensors.soilMoisture}%`);
});
```

## Risk Engine Implementation

```typescript
// engine/riskSynthesis.ts

import { AgentResult, RiskSynthesisInput, RiskSynthesisOutput } from '../shared/types';

export function synthesizeRisk(input: RiskSynthesisInput): RiskSynthesisOutput {
  const { financial, climate, yield: yieldAgent, soil, news } = input;
  
  // 1. Calculate Financial Capacity (35%)
  const financialScore = calculateFinancialScore(financial);
  
  // 2. Calculate Productive Resilience (65%)
  const productiveScore = calculateProductiveScore(climate, yieldAgent, soil);
  
  // 3. Calculate AgroScore (weighted average)
  const agroScore = Math.round(
    financialScore * 0.35 + productiveScore * 0.65
  );
  
  // 4. Apply news sentiment adjustment
  const newsAdjustment = calculateNewsAdjustment(news);
  const adjustedScore = Math.max(0, Math.min(100, agroScore + newsAdjustment));
  
  // 5. Calculate DSCR
  const dscr = calculateDSCR(input);
  
  // 6. Calculate recommended exposure
  const recommendedExposure = calculateRecommendedExposure(
    input.loan.requestedAmount,
    dscr.base
  );
  
  // 7. Determine rating and decision
  const rating = getRating(adjustedScore);
  const decision = getDecision(adjustedScore, dscr.stress);
  
  return {
    agroScore: adjustedScore,
    financialCapacity: financialScore,
    productiveResilience: productiveScore,
    recommendedExposure,
    dscr,
    rating,
    decision,
    breakdown: {
      financialWeight: 0.35,
      productiveWeight: 0.65
    }
  };
}

function calculateFinancialScore(financial: AgentResult): number {
  let score = 50; // Base score
  
  // Delinquency status adjustment
  const status = financial.data.delinquencyStatus as number;
  if (status === 1) score += 20;
  else if (status === 2) score -= 10;
  else if (status === 3) score -= 25;
  else if (status === 4) score -= 40;
  else score -= 60;
  
  // Days overdue adjustment
  const daysOverdue = financial.data.daysOverdue as number;
  if (daysOverdue > 90) score -= 20;
  else if (daysOverdue > 30) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

function calculateProductiveScore(
  climate: AgentResult,
  yieldAgent: AgentResult,
  soil: AgentResult
): number {
  const yieldScore = yieldAgent.score * 0.40;
  const soilScore = soil.score * 0.35;
  const climateScore = climate.score * 0.25;
  
  return Math.round(yieldScore + soilScore + climateScore);
}

function calculateDSCR(input: RiskSynthesisInput): { base: number; stress: number } {
  const { field, loan } = input;
  const yieldPerHa = input.yield.data.expectedYield as number;
  const stressYield = input.yield.data.stressYield as number;
  const pricePerTon = 178000; // Default maize price ARS
  
  const revenue = field.hectares * yieldPerHa * pricePerTon;
  const stressRevenue = field.hectares * stressYield * pricePerTon;
  const operatingCost = revenue * 0.65;
  const debtService = (loan.requestedAmount / loan.termMonths) * 12;
  
  return {
    base: Math.round((revenue - operatingCost) / debtService * 100) / 100,
    stress: Math.round((stressRevenue - operatingCost) / debtService * 100) / 100
  };
}

function calculateRecommendedExposure(requested: number, dscr: number): number {
  const threshold = 1.2;
  const ratio = Math.min(1, dscr / threshold);
  return Math.round(requested * ratio / 1000000) * 1000000;
}

function getRating(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  return 'D';
}

function getDecision(score: number, stressDscr: number): string {
  if (score >= 80 && stressDscr >= 1.2) return 'APPROVE';
  if (score >= 50) return 'APPROVE WITH LIMIT';
  return 'REJECT / RESTRUCTURE';
}
```

## Server Implementation

```typescript
// server/index.ts

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

import { synthesizeRisk } from '../engine/riskSynthesis';
import { runAllAgents } from '../agents';
import { startMQTTBroker } from '../mqtt/broker';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: 'http://localhost:5173' }
});

app.use(cors());
app.use(express.json());

// REST API
app.post('/api/assessment', async (req, res) => {
  try {
    const { cuit, applicant, field, loan } = req.body;
    const caseId = `AG-${Date.now()}`;
    
    // Run all agents in parallel
    const agentResults = await runAllAgents({
      caseId,
      applicant,
      field,
      loan
    });
    
    // Synthesize risk
    const synthesis = synthesizeRisk({
      financial: agentResults.financial,
      climate: agentResults.climate,
      yield: agentResults.yield,
      soil: agentResults.soil,
      news: agentResults.news
    });
    
    // Calculate stress scenarios
    const scenarios = calculateScenarios(field, loan, agentResults);
    
    // Emit updates via WebSocket
    io.emit('assessment-complete', { caseId, synthesis, scenarios });
    
    res.json({
      caseId,
      timestamp: new Date().toISOString(),
      agents: agentResults,
      synthesis,
      scenarios
    });
  } catch (error) {
    console.error('Assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// WebSocket
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('subscribe-case', (caseId) => {
    socket.join(caseId);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`AGROSCORE server running on port ${PORT}`);
});

// Start MQTT broker
startMQTTBroker(1883);
```

## MQTT Integration

```typescript
// mqtt/broker.ts

import Aedes from 'aedes';
import { Server as NetServer } from 'net';

export function startMQTTBroker(port: number) {
  const broker = Aedes();
  const server = NetServer.createServer(broker.handle);
  
  server.listen(port, () => {
    console.log(`MQTT broker running on port ${port}`);
  });
  
  // Subscribe to sensor topics
  broker.subscribe('field/+/sensors', (packet) => {
    const topic = packet.topic;
    const fieldId = topic.split('/')[1];
    const data = JSON.parse(packet.payload.toString());
    
    // Forward to WebSocket
    io.emit('sensor-data', { fieldId, ...data });
  });
  
  return broker;
}
```

## Frontend Integration

```typescript
// components/agents/AgentPanel.tsx

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function AgentPanel({ caseId }: { caseId: string }) {
  const [agents, setAgents] = useState<Record<string, AgentResult>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  useEffect(() => {
    const socket = io('http://localhost:3001');
    
    socket.emit('subscribe-case', caseId);
    
    socket.on('score-updated', (data) => {
      setAgents(prev => ({
        ...prev,
        [data.agentId]: { ...prev[data.agentId], score: data.score }
      }));
    });
    
    socket.on('alert-triggered', (data) => {
      setAlerts(prev => [...prev, data.alert]);
    });
    
    return () => {
      socket.disconnect();
    };
  }, [caseId]);
  
  return (
    <div className="agent-panel">
      <h3>Agent Status</h3>
      {Object.entries(agents).map(([id, agent]) => (
        <div key={id} className="agent-status">
          <span>{id}</span>
          <span>{agent.score}/100</span>
          <span>{agent.confidence * 100}%</span>
        </div>
      ))}
      
      {alerts.length > 0 && (
        <div className="alerts">
          <h4>Alerts</h4>
          {alerts.map((alert, i) => (
            <div key={i} className={`alert alert-${alert.level}`}>
              {alert.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Demo Script

```
MINUTO 0-30: Frontend carga
  - Three.js globe aparece
  - Campo se destaca en Argentina
  - Sidebar muestra caso AG-2026-041

MINUTO 30-60: Stress Engine
  - Click en "BASE CASE" → ARS 76M
  - Click en "DROUGHT -30%" → ARS 49M (animacion)
  - Click en "PRICE -20%" → ARS 58M (animacion)
  - Click en "COMBINED" → ARS 34M (alerta roja)

MINUTO 60-90: Agentes en vivo
  - Climate: rainfall 645mm, anomaly -12%
  - Financial: BCRA status 1, no delinquency
  - Yield: 8.2 tn/ha expected
  - Soil: pH 6.2, organic carbon 21 g/kg
  - News: 45 articles, sentiment -0.15

MINUTO 90-120: Satellite
  - NDVI overlay aparece en mapa
  - Vegetation health: GOOD
  - Moisture status: ADEQUATE
  - Drought index: 0.78

MINUTO 120-180: Continuous Monitoring
  - Click "Simulate +60 days"
  - Score drops to 67
  - Alert: "Review next disbursement"
  - Exposure drops to ARS 52M

MINUTO 180-240: Q&A
  - Responder preguntas del jurado
  - Mostrar flexibilidad del sistema
```
