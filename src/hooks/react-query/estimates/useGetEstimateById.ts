import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { GetEstimateByIdResponse } from '@/ts/interfaces/Estimate';

export default function useGetEstimateById(estimateId: string | undefined) {
  return useQuery({
    queryKey: ['estimate', estimateId],
    queryFn: async () => {
      if (!estimateId) {
        throw new Error('Estimate ID is required');
      }

      try {
        const response = await clientAxios.get<GetEstimateByIdResponse>(`/estimates/${estimateId}`);
        return response.data;
      } catch (error) {
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          const errorMessage = error.response?.data?.message;

          if (
            status === 404 ||
            (errorMessage && typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('not found'))
          ) {
            throw new Error('Estimate not found');
          }

          if (status === 400 && errorMessage) {
            const message = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage;
            throw new Error(message);
          }

          throw new Error(
            errorMessage
              ? Array.isArray(errorMessage)
                ? errorMessage.join(', ')
                : errorMessage
              : 'Failed to fetch estimate'
          );
        }
        throw error;
      }
    },
    enabled: !!estimateId,
    staleTime: Infinity
  });
}
