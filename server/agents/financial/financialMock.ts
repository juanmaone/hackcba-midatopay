// Verbatim from docs/DATA_SOURCES.md "Fallbacks y Mock Data" §Financial Agent Mock. Financial
// stays mock-only permanently in this build (BCRA needs an API key, out of scope) — this fixture
// IS the agent's source of truth, not a fallback for a formula that never runs. See plan
// "Deviations from the docs" #1.
import type { FinancialAgentResult } from '../../../shared/types/agent.js';

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
    entities: [{ name: 'Banco Nación', status: 1, amount: 138000 }],
  },
  metrics: {
    primary: 61,
    secondary: 0.45,
    trend: 'stable',
    volatility: 0.1,
  },
  alerts: [],
  sources: [{ provider: 'Mock', endpoint: 'mock', lastUpdated: new Date().toISOString(), reliability: 1.0 }],
};
