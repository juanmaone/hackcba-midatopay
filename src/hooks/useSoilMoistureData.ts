import { useQuery } from '@tanstack/react-query';
import { fetchRealSoilMoisture } from '../services/api/soilMoistureClient';

export function useSoilMoistureData(lat: number, lng: number) {
  return useQuery({
    queryKey: ['soilMoisture', lat, lng],
    queryFn: () => fetchRealSoilMoisture(lat, lng),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
}
