import { useQuery } from '@tanstack/react-query';
import { fetchRealVegetationIndex } from '../services/api/satelliteClient';

export function useSatelliteData(polygon: Array<[number, number]>) {
  return useQuery({
    queryKey: ['satelliteNdvi', polygon],
    queryFn: () => fetchRealVegetationIndex(polygon),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
}
