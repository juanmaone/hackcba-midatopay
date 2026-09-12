# Prompt to give GPT/Codex after uploading this bundle

You are working on an existing React + Vite + TypeScript project called AGROSCORE.

First:
1. Read every file in this research bundle.
2. Inspect the existing source code.
3. Do not rebuild from scratch unless the project is genuinely empty.
4. Preserve functioning business logic.
5. Improve the interface using the competitor patterns without copying any competitor's branding or UI pixel-for-pixel.

The desired synthesis is:

- Traive's institutional credit-case hierarchy
- TerraMagna's map + operational risk / alert structure
- SatSure's parcel-level Earth Intelligence framing
- Nera's clarity around financing decisions

The final application must feel like institutional agricultural underwriting software, not a farmer SaaS tool.

CRITICAL:
The strongest product output is not "AgroScore = 82."

The strongest output is:

REQUESTED EXPOSURE
ARS 100M

RECOMMENDED EXPOSURE
ARS 76M

because the lender needs a decision.

Implement / improve these elements:

A. CREDIT CASE HEADER
- case id
- producer
- campaign
- crop
- hectares
- location
- current review status

B. FIELD INTELLIGENCE
- large map
- polygon
- only 4 useful overlays:
  vegetation / drought / soil / historical productivity

C. CREDIT DECISION
- Financial Capacity
- Productive Resilience
- AgroScore
- Requested Amount
- Recommended Exposure
- Base DSCR
- Stress DSCR
- decision status

D. STRESS ENGINE
Tabs:
BASE
DROUGHT -30%
PRICE -20%
COMBINED

A tab change must update:
- yield
- revenue
- DSCR
- AgroScore
- Recommended Exposure
- decision
- risk overlay

E. WHY THIS DECISION?
Use signed risk contributions / waterfall.

F. UNDERWRITING EVIDENCE
Show actual inputs / source categories.
Do not use fake "AI reasoning" animation.

G. +60 DAY SIMULATION
Clearly label it as simulated.
Show:
- rainfall deterioration
- vegetation deterioration
- lower safe exposure
- lender action: REVIEW NEXT DISBURSEMENT

Do not claim:
- probability of default unless we have a trained/validated model
- live satellite if data is mocked
- that continuous monitoring is a novel category

Visual direction:
institutional, compact, desktop-first, dark navy/charcoal shell, white/off-white data surfaces, one green/lime accent, orange warning, red reject.

Do not use excessive gradients, AI sparkles, crypto aesthetics, emojis, oversized rounded cards or marketing hero sections.

Before stopping:
- run build / typecheck
- fix errors
- verify all scenario interactions
- verify map renders
- verify responsive fallback
- no console errors
