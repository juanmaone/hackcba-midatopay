# AGROSCORE — Agent Specification & Output Format

## Agent Interface Contract

Every agent MUST implement this TypeScript interface:

```typescript
// src/shared/types/agent.ts

interface AgentResult {
  agentId: string;           // e.g., "climate", "financial", "soil", "yield", "news"
  timestamp: string;         // ISO 8601
  confidence: number;        // 0-1 (0.0 = no confidence, 1.0 = full confidence)
  score: number;             // 0-100 (normalized risk score)
  data: Record<string, unknown>;  // Raw data from API
  metrics: AgentMetrics;     // Normalized metrics for risk engine
  alerts: Alert[];           // Threshold-based alerts
  sources: DataSource[];     // Data provenance
}

interface AgentMetrics {
  // Normalized values (0-100 scale) for risk engine aggregation
  primary: number;           // Main metric (e.g., NDVI, debt ratio, yield)
  secondary: number;         // Supporting metric
  trend: 'improving' | 'stable' | 'declining';
  volatility: number;        // 0-1 (0 = stable, 1 = highly volatile)
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
  provider: string;          // e.g., "Open-Meteo", "BCRA", "Sentinel-2"
  endpoint: string;          // API endpoint used
  lastUpdated: string;       // ISO 8601
  reliability: number;       // 0-1
}
```

## Agent Input Contract

```typescript
interface AgentInput {
  caseId: string;
  applicant: {
    cuit: string;
    name: string;
  };
  field: {
    lat: number;
    lng: number;
    hectares: number;
    crop: string;
    campaign: string;
    polygon?: Array<[number, number]>;
  };
  loan: {
    requestedAmount: number;
    termMonths: number;
  };
  stressScenario?: 'base' | 'drought' | 'price' | 'combined';
}
```

## 1. Financial Agent

**Purpose:** Evaluate credit history and financial capacity via BCRA Central de Deudores.

**API:** `https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/{CUIT}`

**Endpoints:**
- `GET /Deudas/{identificacion}` — Current debt status
- `GET /Deudas/Historicas/{identificacion}` — 24-month history
- `GET /Deudas/ChequesRechazados/{identificacion}` — Rejected checks

**Output Format:**
```typescript
interface FinancialAgentResult extends AgentResult {
  agentId: 'financial';
  data: {
    totalDebt: number;           // ARS (thousands)
    delinquencyStatus: number;   // 1-5 (1=current, 5=written off)
    daysOverdue: number;
    rejectedChecks: number;
    entities: Array<{
      name: string;
      status: number;
      amount: number;
    }>;
  };
  metrics: {
    primary: number;    // Financial capacity score (0-100)
    secondary: number;  // Debt-to-revenue ratio
    trend: 'improving' | 'stable' | 'declining';
    volatility: number;
  };
}
```

**Scoring Logic:**
- Status 1 (current): +20 points
- Status 2 (1-30 days): -10 points
- Status 3 (31-90 days): -25 points
- Status 4 (91-180 days): -40 points
- Status 5 (>180 days): -60 points
- Rejected checks: -5 points each (max -20)

**Thresholds:**
- Critical: daysOverdue > 90 OR delinquencyStatus >= 4
- Warning: daysOverdue > 30 OR delinquencyStatus >= 3

---

## 2. Climate Agent

**Purpose:** Assess rainfall patterns, drought risk, and climate anomalies.

**API:** Open-Meteo Historical Weather API (free, no auth)

**Endpoint:**
```
GET https://archive-api.open-meteo.com/v1/archive?
  latitude={lat}&longitude={lng}
  &start_date={start}&end_date={end}
  &daily=precipitation_sum,temperature_2m_max,temperature_2m_min
  &timezone=America/Argentina/Buenos_Aires
```

**Output Format:**
```typescript
interface ClimateAgentResult extends AgentResult {
  agentId: 'climate';
  data: {
    historicalRainfall: number;      // mm (annual average)
    rainfallAnomaly: number;         // % deviation from normal
    droughtRisk: 'low' | 'medium' | 'high';
    temperatureAnomaly: number;      // °C deviation
    rainyDays: number;               // days with >1mm
    consecutiveDryDays: number;      // max streak
  };
  metrics: {
    primary: number;    // Climate resilience score (0-100)
    secondary: number;  // Drought probability
    trend: 'improving' | 'stable' | 'declining';
    volatility: number;
  };
}
```

**Scoring Logic:**
- Rainfall anomaly < -20%: drought risk = high, -15 points
- Rainfall anomaly -10% to -20%: drought risk = medium, -8 points
- Consecutive dry days > 30: -10 points
- Temperature anomaly > +2°C: -5 points

**Thresholds:**
- Critical: rainfallAnomaly < -30% OR consecutiveDryDays > 45
- Warning: rainfallAnomaly < -15% OR consecutiveDryDays > 20

---

## 3. Yield Agent

**Purpose:** Evaluate historical crop yields and productivity trends.

**API:** USDA PSD API (free, API key required) + MAGyP data

**Endpoints:**
- USDA: `https://api.nass.usda.gov/api/v1/` (requires API key)
- Fallback: Mock data from MAGyP historical records

**Output Format:**
```typescript
interface YieldAgentResult extends AgentResult {
  agentId: 'yield';
  data: {
    historicalYield: number[];       // tn/ha (last 5 years)
    expectedYield: number;           // tn/ha (current season)
    stressYield: number;             // tn/ha (drought scenario)
    yieldVolatility: number;         // % (standard deviation)
    cropType: string;
    region: string;
    droughtYears: number;            // count of drought years
  };
  metrics: {
    primary: number;    // Productive resilience score (0-100)
    secondary: number;  // Yield stability score
    trend: 'improving' | 'stable' | 'declining';
    volatility: number;
  };
}
```

**Scoring Logic:**
- Yield volatility > 25%: -12 points
- 2+ drought years in last 5: -10 points
- Expected yield < regional average: -8 points
- Positive trend (last 3 years): +5 points

**Thresholds:**
- Critical: yieldVolatility > 30% OR expectedYield < 4.0 tn/ha
- Warning: yieldVolatility > 20% OR expectedYield < 6.0 tn/ha

---

## 4. Soil Agent

**Purpose:** Analyze soil characteristics and suitability for agriculture.

**API:** SoilGrids REST API (free, rate-limited)

**Endpoint:**
```
GET https://rest.isric.org/soilgrids/v2.0/properties/query?
  lat={lat}&lon={lng}
  &property=phh2o&property=soc&property=clay&property=sand
  &depth=0-30cm
```

**Output Format:**
```typescript
interface SoilAgentResult extends AgentResult {
  agentId: 'soil';
  data: {
    ph: number;                      // pH level (0-14)
    organicCarbon: number;           // g/kg
    clayContent: number;             // %
    sandContent: number;             // %
    soilScore: number;               // 0-100 (composite)
    textureClass: string;            // e.g., "Loam", "Clay Loam"
    drainageClass: string;           // e.g., "Well drained"
  };
  metrics: {
    primary: number;    // Soil quality score (0-100)
    secondary: number;  // Drainage suitability
    trend: 'stable';    // Soil changes slowly
    volatility: number; // Always low for soil
  };
}
```

**Scoring Logic:**
- pH 6.0-7.0: optimal, +10 points
- pH < 5.5 or > 7.5: -10 points (acidic/alkaline)
- Organic carbon > 15 g/kg: +8 points
- Organic carbon < 5 g/kg: -8 points
- Clay content 20-40%: optimal for agriculture

**Thresholds:**
- Critical: pH < 4.5 OR pH > 8.5 OR organicCarbon < 3 g/kg
- Warning: pH < 5.0 OR pH > 8.0 OR organicCarbon < 8 g/kg

---

## 5. News/Sentiment Agent

**Purpose:** Monitor agricultural news and market sentiment for risk signals.

**API:** GDELT DOC API (free, no auth)

**Endpoint:**
```
GET https://api.gdeltproject.org/api/v2/doc/doc?
  query=agriculture%20Argentina%20{crop}
  &mode=artlist
&maxrecords=50
```

**Output Format:**
```typescript
interface NewsAgentResult extends AgentResult {
  agentId: 'news';
  data: {
    articleCount: number;            // Total articles found
    avgSentiment: number;            // -1 to +1
    positiveShare: number;           // 0-1
    negativeShare: number;           // 0-1
    topThemes: string[];             // e.g., ["drought", "export", "futures"]
    riskEvents: Array<{
      title: string;
      sentiment: number;
      source: string;
      date: string;
    }>;
  };
  metrics: {
    primary: number;    // Sentiment score (0-100, 50=neutral)
    secondary: number;  // News volume intensity
    trend: 'improving' | 'stable' | 'declining';
    volatility: number;
  };
}
```

**Scoring Logic:**
- Avg sentiment > +0.3: +10 points (positive news)
- Avg sentiment < -0.3: -10 points (negative news)
- Article count > 100: high intensity, check for risk events
- Keywords "drought", "crisis", "default": -5 points each

**Thresholds:**
- Critical: avgSentiment < -0.5 OR articleCount > 200 with negative trend
- Warning: avgSentiment < -0.2 OR negativeShare > 0.6

---

## Risk Engine Aggregation

The Risk Synthesis Engine combines all agent outputs:

```typescript
interface RiskSynthesisInput {
  financial: FinancialAgentResult;
  climate: ClimateAgentResult;
  yield: YieldAgentResult;
  soil: SoilAgentResult;
  news: NewsAgentResult;
}

interface RiskSynthesisOutput {
  agroScore: number;           // 0-100 (weighted average)
  recommendedExposure: number; // ARS
  dscr: {
    base: number;
    stress: number;
  };
  rating: string;              // A+, A, B+, B, C+, C, D
  decision: string;            // APPROVE, APPROVE WITH LIMIT, REJECT
  breakdown: {
    financialWeight: number;   // 35%
    productiveWeight: number;  // 65%
  };
}
```

**Weight Formula:**
```
agroScore = (financialScore * 0.35) + (productiveScore * 0.65)

productiveScore = (yieldScore * 0.40) + (soilScore * 0.35) + (climateScore * 0.25)
```

**Exposure Recommendation:**
```
recommendedExposure = requestedAmount * min(1, dscr / 1.2)

Where:
  dscr = (revenue - operatingCost) / debtService
  revenue = hectares * yieldPerHa * pricePerTon
  operatingCost = revenue * 0.65 (65% of revenue)
  debtService = requestedAmount / termMonths * 12
```

**Rating Table:**
| Score Range | Rating | Decision |
|-------------|--------|----------|
| 90-100      | A+     | APPROVE  |
| 80-89       | A      | APPROVE  |
| 70-79       | B+     | APPROVE WITH LIMIT |
| 60-69       | B      | APPROVE WITH LIMIT |
| 50-59       | C+     | APPROVE WITH LIMIT |
| 40-49       | C      | REJECT / RESTRUCTURE |
| <40         | D      | REJECT   |

---

## Stress Scenarios

The engine calculates exposure under 4 scenarios:

| Scenario     | Yield Multiplier | Price Multiplier | Description |
|--------------|------------------|------------------|-------------|
| BASE         | 1.0x             | 1.0x             | Normal conditions |
| DROUGHT -30% | 0.7x             | 1.0x             | 30% yield reduction |
| PRICE -20%   | 1.0x             | 0.8x             | 20% price drop |
| COMBINED     | 0.7x             | 0.8x             | Both stress factors |

**Formula:**
```
stressRevenue = hectares * (yield * yieldMultiplier) * (price * priceMultiplier)
stressDSCR = (stressRevenue - operatingCost) / debtService
stressExposure = requestedAmount * min(1, stressDSCR / 1.2)
```
