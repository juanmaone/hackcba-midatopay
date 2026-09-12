import type { UnderwritingCase } from '../../types/underwriting';

export interface FinancialProvider { getFinancials(caseData: UnderwritingCase): Promise<UnderwritingCase['financial']> }

export const mockFinancialProvider: FinancialProvider = {
  async getFinancials(caseData) { return caseData.financial; },
};
