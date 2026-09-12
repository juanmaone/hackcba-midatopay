# AGROSCORE — Fuentes de Datos (Data Sources)

## Resumen de APIs

| API               | Costo  | Auth           | Rate Limit     | Cobertura        |
|-------------------|--------|----------------|----------------|------------------|
| BCRA              | Gratis | API Key        | Sin limite明确o | Argentina        |
| Open-Meteo        | Gratis | Ninguna        | 10,000 req/day | Global           |
| USDA PSD          | Gratis | API Key        | Sin limite明确o | Global           |
| SoilGrids         | Gratis | Ninguna        | 5 req/min      | Global (250m)    |
| GDELT             | Gratis | Ninguna        | Sin limite明确o | Global           |
| Copernicus CDSE   | Gratis | OAuth2         | 30 req/min     | Global (Sentinel)|
| Yahoo Finance     | Gratis | Ninguna        | Sin limite明确o | Global           |
| NASA POWER        | Gratis | Ninguna        | Sin limite明确o | Global           |

---

## 1. BCRA Central de Deudores

**URL Base:** `https://api.bcra.gob.ar`

**Descripcion:** API oficial del Banco Central de la Republica Argentina para consultar la situacion crediticia de personas fisicas y juridicas.

**Endpoints:**
```
GET /CentralDeDeudores/v1.0/Deudas/{identificacion}
GET /CentralDeDeudores/v1.0/Deudas/Historicas/{identificacion}
GET /CentralDeDeudores/v1.0/Deudas/ChequesRechazados/{identificacion}
```

**Parametros:**
- `identificacion`: CUIT, CUIL o CDI (11 caracteres)

**Ejemplo Response (Deudas):**
```json
{
  "status": 200,
  "results": {
    "identificacion": "30-71284539-9",
    "denominacion": "MARCOS JUAREZ S.A.",
    "periodos": [{
      "periodo": "202407",
      "entidades": [{
        "entidad": "BANCO DE LA NACION ARGENTINA",
        "situacion": 1,
        "fechaSit1": "2024-05-30",
        "monto": 59.0,
        "diasAtrasoPago": 0,
        "refinanciaciones": false
      }]
    }]
  }
}
```

**Campos Clave:**
- `situacion`: 1=normal, 2=1-30 dias, 3=31-90 dias, 4=91-180 dias, 5=>180 dias
- `monto`: Deuda en miles de pesos
- `diasAtrasoPago`: Dias de atraso

**Documentacion:** https://deudores.bcra.apidocs.ar/

---

## 2. Open-Meteo Historical Weather API

**URL Base:** `https://archive-api.open-meteo.com`

**Descripcion:** API gratuita de datos historicos climaticos. No requiere autenticacion. Datos desde 1940 hasta presente.

**Endpoint Principal:**
```
GET /v1/archive?
  latitude={lat}&longitude={lng}
  &start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}
  &daily=precipitation_sum,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean
  &timezone=America/Argentina/Buenos_Aires
```

**Variables Disponibles:**
- `precipitation_sum` — Precipitacion diaria (mm)
- `temperature_2m_max/min/mean` — Temperatura (°C)
- `relative_humidity_2m_mean` — Humedad relativa (%)
- `wind_speed_10m_mean` — Viento (km/h)
- `shortwave_radiation_sum` — Radiacion solar (MJ/m²)
- `soil_moisture_0_to_10cm_mean` — Humedad del suelo (m³/m³)

**Ejemplo Response:**
```json
{
  "daily": {
    "time": ["2024-01-01", "2024-01-02"],
    "precipitation_sum": [0.0, 12.5],
    "temperature_2m_max": [32.1, 28.4],
    "temperature_2m_min": [18.2, 16.8]
  }
}
```

**Documentacion:** https://open-meteo.com/en/docs

---

## 3. USDA Production, Supply and Distribution (PSD)

**URL Base:** `https://api.nass.usda.gov`

**Descripcion:** Datos oficiales de produccion agricola de EE.UU. y global. Requiere API key gratuita.

**Endpoint:**
```
GET /api/v1/api_GET?
  key={API_KEY}
  &commodity_desc=Maize
  &country_desc=Argentina
  &statisticcat_desc=Yield
  &unit_desc=MT
  &year>={startYear}
```

**Obtener API Key:** https://quickstats.nass.usda.gov/api

**Variables Clave:**
- `commodity_desc`: Maize, Wheat, Soybeans, etc.
- `country_desc`: Argentina, Brazil, United States
- `statisticcat_desc`: Yield, Production, Area Planted
- `year`: Ano de la campana

**Ejemplo Response:**
```json
{
  "data": [{
    "commodity_desc": "MAIZE",
    "country_desc": "ARGENTINA",
    "year": 2024,
    "yield": 8.2,
    "unit_desc": "MT",
    "area_planted": 6500000
  }]
}
```

**Documentacion:** https://quickstats.nass.usda.gov/api

**Fallback:** Si no hay API key, usar datos hardcoded de MAGyP:
```typescript
const MAGYP_DATA = {
  'maiz': { avgYield: 8.2, region: 'Cordoba', source: 'MAGyP' },
  'soja': { avgYield: 3.1, region: 'Santa Fe', source: 'MAGyP' },
  'trigo': { avgYield: 2.8, region: 'Buenos Aires', source: 'MAGyP' },
};
```

---

## 4. SoilGrids REST API

**URL Base:** `https://rest.isric.org`

**Descripcion:** Datos globales de propiedades del suelo a 250m resolucion. Gratuito pero rate-limited.

**Endpoint:**
```
GET /soilgrids/v2.0/properties/query?
  lat={lat}&lon={lng}
  &property=phh2o
  &property=soc
  &property=clay
  &property=sand
  &property=nitrogen
  &depth=0-30cm
```

**Propiedades Disponibles:**
- `phh2o` — pH del suelo
- `soc` — Carbono organico (g/kg)
- `clay` — Contenido de arcilla (%)
- `sand` — Contenido de arena (%)
- `nitrogen` — Nitrogeno total (g/kg)
- `cfvo` — Fraccion de piedras (cm³/dm³)

**Profundidades:**
- `0-5cm`, `5-15cm`, `15-30cm`, `30-60cm`, `60-100cm`, `100-200cm`

**Ejemplo Response:**
```json
{
  "properties": {
    "layers": [{
      "name": "phh2o",
      "depth": {"top": 0, "bottom": 30, "unit": "cm"},
      "values": {"mean": 6.2, "Q0.5": 6.2}
    }, {
      "name": "soc",
      "depth": {"top": 0, "bottom": 30, "unit": "cm"},
      "values": {"mean": 21.0, "Q0.5": 21.0}
    }]
  }
}
```

**Rate Limit:** 5 llamadas por minuto

**Documentacion:** https://dev-rest.isric.org/

**Nota:** SoilGrids esta en beta, puede tener intermitencias. Usar mock data como fallback.

---

## 5. GDELT DOC API

**URL Base:** `https://api.gdeltproject.org/api/v2`

**Descripcion:** Base de datos de eventos globales. Monitorea noticias en 100+ idiomas. Gratuito, sin autenticacion.

**Endpoint:**
```
GET /doc/doc?
  query=agriculture%20Argentina%20{crop}
  &mode=artlist
  &maxrecords=50
  &format=json
  &sort=DateDesc
```

**Parametros Clave:**
- `query`: Terminos de busqueda (URL encoded)
- `mode`: `artlist` (lista de articulos), `artgallery` (galeria), `tone` (sentimiento)
- `maxrecords`: Maximo 250
- `sort`: `DateDesc`, `DateAsc`, `ToneDesc`

**Ejemplo Response:**
```json
{
  "articles": [{
    "url": "https://example.com/article",
    "title": "Sequía afecta cultivos en Córdoba",
    "seendate": "20240115T120000Z",
    "domain": "example.com",
    "language": "Spanish",
    "tone": -2.5
  }]
}
```

**Campos Utiles:**
- `tone`: Sentimiento del articulo (-10 a +10, negativo = malas noticias)
- `socialimage`: Imagen del articulo
- `domain`: Dominio de la fuente
- `language`: Idioma detectado

**Filtros para Agro:**
```
query=(agriculture OR agriculture OR crop OR drought OR harvest) AND Argentina AND (maize OR corn OR wheat OR soybean)
```

**Documentacion:** https://www.gdeltproject.org/data.html

---

## 6. Copernicus Data Space Ecosystem (Sentinel-2)

**URL Base:** `https://sh.dataspace.copernicus.eu`

**Descripcion:** Acceso a imagenes satelitales Sentinel-2 (NDVI, EVI, etc.). Requiere OAuth2.

**Flujo de Autenticacion:**
1. Registrar en https://dataspace.copernicus.eu/
2. Obtener client_id y client_secret
3. POST a `https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token`
4. Usar access_token en requests

**Endpoints:**
- **STAC Catalog:** `GET /stac/catalog` — Buscar escenas
- **Process API:** `POST /api/v1/process` — Obtener imagenes
- **Statistical API:** `POST /api/v1/statistics` — Estadisticas por poligono

**Bandas Sentinel-2:**
| Banda | Nombre         | Resolucion | Uso |
|-------|----------------|------------|-----|
| B02   | Blue           | 10m        | True color |
| B03   | Green          | 10m        | True color |
| B04   | Red            | 10m        | NDVI, True color |
| B08   | NIR            | 10m        | NDVI |
| B8A   | Narrow NIR     | 20m        | NDVI preciso |
| B11   | SWIR           | 20m        | NDWI, humedad |
| B12   | SWIR           | 20m        | Fuego, burn |

**Indices Espectrales:**
```javascript
// NDVI (Vegetation)
NDVI = (B08 - B04) / (B08 + B04)

// NDWI (Water/Moisture)
NDWI = (B03 - B08) / (B03 + B08)

// EVI (Enhanced Vegetation)
EVI = 2.5 * (B08 - B04) / (B08 + 6*B04 - 7.5*B02 + 1)
```

**Ejemplo Request (STAC Search):**
```json
{
  "collections": ["SENTINEL-2"],
  "bbox": [-62.12, -32.72, -62.08, -32.68],
  "datetime": "2024-01-01T00:00:00Z/2024-12-31T23:59:59Z",
  "query": {
    "eo:cloud_cover": {"lt": 20}
  }
}
```

**Documentacion:** https://documentation.dataspace.copernicus.eu/

**Alternativa Sin Auth:** Microsoft Planetary Computer (STAC sin autenticacion):
```
GET https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-2-l2a/items
```

---

## 7. Yahoo Finance (Grain Prices)

**URL Base:** `https://query1.finance.yahoo.com`

**Descripcion:** Precios de commodities agricolas. Sin autenticacion, sin rate limit oficial.

**Endpoints:**
```
GET /v8/finance/chart/{symbol}?interval=1d&range=1mo
GET /v6/finance/quote?symbols={symbols}
```

**Simbolos Argentina:**
- `ZC=F` — Corn Futures (CBOT)
- `ZS=F` — Soybean Futures (CBOT)
- `ZW=F` — Wheat Futures (CBOT)
- `ARS=X` — USD/ARS exchange rate

**Ejemplo Response:**
```json
{
  "chart": {
    "result": [{
      "meta": {
        "regularMarketPrice": 445.50,
        "currency": "USD",
        "symbol": "ZC=F"
      },
      "indicators": {
        "quote": [{
          "close": [445.50, 442.25],
          "high": [448.00, 445.00],
          "low": [442.00, 440.50]
        }]
      }
    }]
  }
}
```

**Conversion ARS:**
```
pricePerTon_ARS = pricePerBushel_USD * (1 tonne / 39.3679 bushels) * exchangeRate_ARS
```

**Documentacion:** https://finance.yahoo.com

---

## 8. NASA POWER API

**URL Base:** `https://power.larc.nasa.gov`

**Descripcion:** Datos climaticos historicos y proyecciones. Sin autenticacion.

**Endpoint:**
```
GET /api/temporal/daily/point?
  parameters=PRECTOT,PS,T2M,T2M_MAX,T2M_MIN,RH2M
  &community=AG
  &longitude={lng}&latitude={lat}
  &start={YYYYMMDD}&end={YYYYMMDD}
  &format=JSON
```

**Parametros Agricultura:**
- `PRECTOT` — Precipitacion total (mm/day)
- `T2M` — Temperatura a 2m (°C)
- `T2M_MAX/MIN` — Temperatura max/min
- `RH2M` — Humedad relativa (%)
- `WS2M` — Viento a 2m (m/s)
- `ALLSKY_SFC_SW_DWN` — Radiacion solar (MJ/m²/day)
- `GWETROOT` — Humedad del suelo (0-1)
- `EVPTRNS` — Evapotranspiracion (mm/day)

**Ejemplo Response:**
```json
{
  "properties": {
    "parameter": {
      "PRECTOT": {
        "20240101": 0.0,
        "20240102": 12.5
      },
      "T2M": {
        "20240101": 28.5,
        "20240102": 26.2
      }
    }
  }
}
```

**Documentacion:** https://power.larc.nasa.gov/docs/

---

## Configuracion de APIs (.env)

```bash
# BCRA
BCRA_API_KEY=your_bcra_api_key

# USDA
USDA_API_KEY=your_usda_api_key

# Copernicus
COPERNICUS_CLIENT_ID=your_client_id
COPERNICUS_CLIENT_SECRET=your_client_secret

# MongoDB (opcional)
MONGODB_URI=mongodb://localhost:27017/agroscore

# Server
PORT=3001
WS_PORT=3002
MQTT_PORT=1883
```

---

## Fallbacks y Mock Data

Si una API no esta disponible, cada agente debe tener mock data:

```typescript
// Ejemplo: Financial Agent Mock
export const financialMock: FinancialAgentResult = {
  agentId: 'financial',
  timestamp: new Date().toISOString(),
  confidence: 0.95,
  score: 61,
  data: {
    totalDebt: 138000,
    delinquencyStatus: 1,
    daysOverdue: 0,
    rejectedChecks: 0,
    entities: [{ name: 'BANCO NACION', status: 1, amount: 138000 }]
  },
  metrics: {
    primary: 61,
    secondary: 0.45,
    trend: 'stable',
    volatility: 0.1
  },
  alerts: [],
  sources: [{ provider: 'Mock', endpoint: 'mock', lastUpdated: new Date().toISOString(), reliability: 1.0 }]
};
```
