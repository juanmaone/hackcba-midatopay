import { historicalYield } from '../../data/demoCase';
import type { HistoricalYield } from '../../types/underwriting';

export interface YieldProvider { getHistoricalYield(): Promise<HistoricalYield[]> }

export const mockYieldProvider: YieldProvider = {
  async getHistoricalYield() { return historicalYield; },
};
