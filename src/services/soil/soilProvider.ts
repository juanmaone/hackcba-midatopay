import type { UnderwritingCase } from '../../types/underwriting';

export interface SoilProvider { getSoil(caseData: UnderwritingCase): Promise<UnderwritingCase['soil']> }

export const mockSoilProvider: SoilProvider = {
  async getSoil(caseData) { return caseData.soil; },
};
