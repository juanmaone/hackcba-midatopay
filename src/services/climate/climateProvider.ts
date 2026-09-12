import type { UnderwritingCase } from '../../types/underwriting';

export interface ClimateProvider { getClimate(caseData: UnderwritingCase): Promise<UnderwritingCase['climate']> }

export const mockClimateProvider: ClimateProvider = {
  async getClimate(caseData) { return caseData.climate; },
};
