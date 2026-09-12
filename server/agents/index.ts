import type { AgentInput, AgentResult, ClimateAgentResult, FinancialAgentResult, NewsAgentResult, SoilAgentResult, YieldAgentResult } from '../../shared/types/agent.js';
import { runClimateAgent } from './climate/climateAgent.js';
import { runFinancialAgent } from './financial/financialAgent.js';
import { runNewsAgent } from './news/newsAgent.js';
import { runSoilAgent } from './soil/soilAgent.js';
import { runYieldAgent } from './yield/yieldAgent.js';

export interface RunAllAgentsResult {
  financial: FinancialAgentResult;
  climate: ClimateAgentResult;
  yield: YieldAgentResult;
  soil: SoilAgentResult;
  news: NewsAgentResult;
}

export async function runAllAgents(input: AgentInput, onAgentComplete?: (result: AgentResult) => void): Promise<RunAllAgentsResult> {
  const notify = <T extends AgentResult>(promise: Promise<T>): Promise<T> => promise.then((result) => {
    onAgentComplete?.(result);
    return result;
  });

  const [financial, climate, yieldResult, soil, news] = await Promise.all([
    notify(runFinancialAgent(input)),
    notify(runClimateAgent(input)),
    notify(runYieldAgent(input)),
    notify(runSoilAgent(input)),
    notify(runNewsAgent(input)),
  ]);

  return { financial, climate, yield: yieldResult, soil, news };
}
