import type { AssessmentRequest, AssessmentResponse } from '../../../shared/types';
import { mockAssessmentResponse } from '../../data/mockAssessmentResponse';

export async function requestAssessment(req: AssessmentRequest): Promise<AssessmentResponse> {
  try {
    const res = await fetch('/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`assessment failed: ${res.status}`);
    return await res.json();
  } catch {
    return mockAssessmentResponse;
  }
}
