import { useQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { Request } from '@/ts/interfaces/Request';

export default function useGetRequestsByPool(poolId: string | null | undefined) {
  return useQuery({
    queryKey: ['requests', 'by-pool', poolId],
    queryFn: async () => {
      const response = await clientAxios.get<{ requests: Request[] }>('/requests/by-pool', {
        params: { poolId }
      });
      response.data.requests.forEach((request) => {
        if (request.client) {
          request.client.fullName = `${request.client.firstName} ${request.client.lastName}`.trim();
        }
      });
      return response.data.requests;
    },
    enabled: !!poolId
  });
}
