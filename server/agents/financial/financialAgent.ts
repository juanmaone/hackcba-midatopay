import type { AgentInput, FinancialAgentResult } from '../../../shared/types/agent.js';
import { financialMock } from './financialMock.js';

export async function runFinancialAgent(_input: AgentInput): Promise<FinancialAgentResult> {
  const now = new Date().toISOString();
  return { ...financialMock, timestamp: now, sources: [{ ...financialMock.sources[0], lastUpdated: now }] };
}
