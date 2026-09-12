import { useQuery } from '@tanstack/react-query';
import type { AssessmentRequest } from '../../shared/types';
import { requestAssessment } from '../services/api/assessmentClient';

export function useAssessment(request: AssessmentRequest) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['assessment', request.cuit, request.field.campaign],
    queryFn: () => requestAssessment(request),
  });
  return { data, isLoading, error };
}
