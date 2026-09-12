import { useQuery } from '@tanstack/react-query';
import { fetchRealClimateData } from '../services/api/climateClient';

export function useClimateData(lat: number, lng: number) {
  return useQuery({
    queryKey: ['climate', lat, lng],
    queryFn: () => fetchRealClimateData(lat, lng),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
}
