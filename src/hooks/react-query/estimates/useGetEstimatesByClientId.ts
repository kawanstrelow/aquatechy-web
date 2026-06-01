import { useQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { Estimate as ApiEstimate } from '@/ts/interfaces/Estimate';

import type { TableEstimate } from './useGetEstimates';

export interface GetEstimatesByClientIdResponse {
  estimates: ApiEstimate[];
}

const transformEstimate = (estimate: ApiEstimate): TableEstimate => {
  const toDollars = (cents: number) => (cents ?? 0) / 100;
  return {
    ...estimate,
    clientName: `${estimate.client.firstName} ${estimate.client.lastName}`,
    amount: toDollars(estimate.total)
  };
};

export default function useGetEstimatesByClientId(clientId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['estimates', 'by-client', clientId],
    queryFn: async () => {
      const response = await clientAxios.get<GetEstimatesByClientIdResponse>(`/estimates/by-client/${clientId}`);
      return response.data.estimates.map(transformEstimate);
    },
    enabled: !!clientId && enabled,
    staleTime: 60_000
  });
}
