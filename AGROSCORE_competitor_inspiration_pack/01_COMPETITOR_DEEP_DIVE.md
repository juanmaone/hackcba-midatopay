# Competitor Deep Dive — What to Copy, What NOT to Claim

## 1) Nera — Argentina

### What it is
Nera is a digital payments and financing ecosystem for Argentine agriculture. It connects producers, suppliers and banks. Santander acquired 50% of Nera in 2025 and partnered with Grupo Galicia.

### Strongest product points
- Very clear **transactional workflow**: producer finds financing -> agrees purchase with supplier -> supplier sends digital order -> financial institution pays supplier and creates producer credit.
- Producer can compare financing in pesos, USD or grain-linked structures.
- Supplier tooling includes:
  - credit calculator
  - credit evaluator using only a CUIT
  - business metrics
- Uses real agricultural assets / production as guarantees:
  - available grain
  - future grain / forward contracts
  - cattle
- Excellent distribution: banks + thousands of suppliers + producers.

### Current scale / validation
- Nera homepage states roughly USD 1.7B placed in credit, 6,000+ financed producers, 1,800 merchants and 80+ operations/day.
- Santander's 2025 announcement described Nera as a platform with 1,800 suppliers and tens of thousands of financing operations.

### What AGROSCORE should copy
- Financial information must be **understandable immediately**.
- A lender should see:
  REQUESTED / RECOMMENDED / TERM / DECISION
  without interpreting 20 agronomic variables first.
- Product flows should terminate in an action, not merely a score.

### What AGROSCORE should NOT claim
- "CUIT-based agricultural credit evaluation is novel."
- "A marketplace to compare agro loans is novel."
- "Using grain or livestock as collateral is novel."

### Visual takeaway
Nera is simpler and more commercial than the institutional risk platforms.
Use its clarity, not necessarily its look.

---

## 2) Traive — Brazil / US

### What it is
Institutional agricultural credit infrastructure connecting agribusiness credit with capital markets.

### Strongest product points
- Proprietary AI reportedly analyzes **2,500+ variables**.
- Full agricultural credit workflow:
  - risk analysis
  - credit flow management
  - receivables negotiation
- Risk analysis includes:
  - AI score
  - document library
  - dashboards and reports
  - financial analysis
  - AI chat
- Configurable credit policies.
- ERP integrations.
- Treats credit as an operational workflow, not a single score.
- Very strong B2B / lender framing.

### Funding validation
- BASF Venture Capital led a USD 10M investment round in 2022.
- Public reporting also references an earlier USD 17M Series A.

### What AGROSCORE should copy
- Institutional visual tone.
- Credit request should have a clear object / case identity.
- Requested credit limit should be visually dominant.
- Actions should be explicit: approve, limit, review.
- Keep AI behind evidence and workflow; do not make the product look like "ChatGPT for farming."

### Visual takeaway from Traive screenshot
Observed official platform screenshot:
- navy top navigation
- lime/green accent
- white content area
- "Pedido de Crédito" header
- campaign / season label
- huge requested limit
- action dropdown
- strong business hierarchy

This is a very good reference for AGROSCORE's shell.

---

## 3) TerraMagna — Brazil

### Why this competitor matters most
TerraMagna overlaps heavily with the AGROSCORE thesis.

It publicly offers:
- producer analysis
- area analysis
- historical crop analysis
- satellite monitoring
- agricultural / socioenvironmental risk
- crop classification
- technical reports
- monitoring before and during the crop cycle

Its current messaging explicitly describes proprietary underwriting + continuous monitoring + operational intelligence.

### Strongest product points
#### Pre-credit
- area perimeter and total area
- land-use classification
- agronomic potential
- environmental compliance
- historical crop dynamics
- historical productivity estimates
- drought / frost occurrence

#### During crop cycle
- planted percentage
- crop identification / mismatch detection
- development monitoring
- risk events:
  - frost
  - flooding
  - development failure
  - burning
  - green harvest
- daily monitoring
- collections / recovery support

#### Output
- technical reports
- evidence
- agronomic / climate / market risk indicators

### Funding validation
TerraMagna announced USD 40M of equity + debt financing led by SoftBank Latin America Fund and others in 2022.

### What AGROSCORE should copy
- "map + risk evidence + alerts" is proven and intuitive.
- Portfolio / case monitoring should look operational, not decorative.
- A map should answer a financial question.
- Historical production should be shown as evidence, not as a generic line chart.

### What AGROSCORE should NOT claim
Do NOT claim these as unique:
- satellite credit monitoring
- pre- and post-credit crop monitoring
- historical crop analysis
- daily monitoring
- agricultural digital risk platform
- continuous underwriting as a generic concept

### Where AGROSCORE can still differentiate
Focus the demo on a highly visible **Stress-to-Exposure Engine**:
- a shock is applied
- expected yield / revenue changes
- DSCR changes
- recommended exposure changes
- decision changes

Public competitor material heavily emphasizes monitoring and risk detection.
AGROSCORE should make the **financial consequence of the agronomic shock** the hero interaction.

### Visual takeaway from TerraMagna screenshot
Observed official platform screenshot:
- persistent left sidebar
- white dashboard canvas
- top filters
- KPI chart cards
- geographic map
- operations / alerts panel
- warning icons and operational exceptions

Copy the information architecture, not the exact styling.

---

## 4) SatSure — India

### What it is
Earth-observation and geospatial intelligence platform used by banks / NBFCs for agricultural lending.

### Strongest product points
- Farm Credit Score combining:
  - cropping patterns
  - irrigation access
  - rainfall trends
  - historical yield
- Parcel-level analytics.
- Underwriting + portfolio monitoring + collections.
- Climate risk is linked directly to rural credit workflows.
- Strong empirical-validation language.

### Public evidence / metrics
SatSure states:
- 60,000+ plots assessed for repayment-behavior correlation
- 15,000+ farmer accounts modeled
- 20% reduction in underwriting turnaround time
- 85%+ geospatial-data match with RM/CAM validation

### Funding validation
- USD 15M Series A in 2023.
- TransUnion took a minority stake in 2024.
- Several large Indian banks have invested in SatSure.

### What AGROSCORE should copy
- Treat parcel intelligence as **credit infrastructure**, not as agronomy software.
- Use the phrase "farm-level / parcel-level intelligence" rather than generic "AI satellite analysis."
- Show measurable lender outcomes.
- Separate:
  UNDERWRITING
  MONITORING
  COLLECTIONS / EARLY WARNING

### What AGROSCORE should NOT claim
- "Going beyond bureau data with satellite signals is novel."
- "Farm-level credit score using rainfall/yield is novel."
- "Real-time portfolio monitoring from space is novel."

---

## 5) Agrolend — Brazil

### What it is
Agricultural lending / embedded finance platform focusing strongly on farmers buying agricultural inputs through retailers, industries and cooperatives.

### Strongest product points
- Financing is embedded where farmers already transact.
- Large partner network (retailers, industries, cooperatives).
- Loans can be formalized digitally; public coverage highlights WhatsApp-based signing.
- Clear focus on speed / access rather than building a huge analytics dashboard for farmers.

### Funding validation
- USD 53M Series C in 2024.
- Nearly USD 100M total funding according to Syngenta Group Ventures.

### What AGROSCORE should copy
- Underwriting is only useful when connected to an actual distribution point / credit decision.
- Keep a future API / embedded model in mind:
  `POST /underwrite`
  -> max exposure
  -> risk drivers
  -> stress case
  -> recommendation

---

## 6) ProducePay — Latin America / global fresh produce

### What it is
Financing + commerce + supply-chain platform for fresh produce.

### Strongest product points
- Combines financing with the underlying commercial flow.
- Uses data and predictive analytics to reduce uncertainty for growers / buyers.
- Product is not "score as a service"; it participates in the economic transaction.

### Funding validation
- USD 38M Series D in 2024.
- In September 2026 ProducePay announced more than USD 140M in new equity + financing capacity.

### Lesson for AGROSCORE
The valuable output is not a score.
The valuable output is a **better financial decision**.

---

# Synthesis

The strongest competitors converge on the same pattern:

DATA
-> UNDERWRITING
-> DECISION
-> MONITORING
-> ACTION

A dashboard that stops at "score = 82" is weak.

AGROSCORE should visually center:

1. How much was requested?
2. How much is safe?
3. What evidence caused that recommendation?
4. What happens under drought / price shock?
5. What action should the lender take?
