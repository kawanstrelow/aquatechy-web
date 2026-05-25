import { useQuery, useQueryClient } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { Estimate as ApiEstimate, EstimateStatus, ListEstimatesResponse } from '@/ts/interfaces/Estimate';

export interface UseGetEstimatesParams {
  page?: number;
  clientId?: string | null;
  companyOwnerId?: string | null;
  status?: EstimateStatus | null;
  fromDate?: string | null;
  toDate?: string | null;
}

export interface TableEstimate extends ApiEstimate {
  clientName: string;
  amount: number;
}

export default function useGetEstimates(params: UseGetEstimatesParams) {
  const queryClient = useQueryClient();

  const transformEstimate = (estimate: ApiEstimate): TableEstimate => {
    const toDollars = (cents: number) => (cents ?? 0) / 100;
    return {
      ...estimate,
      clientName: `${estimate.client.firstName} ${estimate.client.lastName}`,
      amount: toDollars(estimate.total)
    };
  };

  const buildQueryParams = (p: UseGetEstimatesParams): Record<string, string> => {
    const queryParams: Record<string, string> = {};
    if (p.page) queryParams.page = p.page.toString();
    if (p.clientId) queryParams.clientId = p.clientId;
    if (p.companyOwnerId) queryParams.companyOwnerId = p.companyOwnerId;
    if (p.status) queryParams.status = p.status;
    if (p.fromDate) queryParams.fromDate = p.fromDate;
    if (p.toDate) queryParams.toDate = p.toDate;
    return queryParams;
  };

  const fetchEstimates = async (p: UseGetEstimatesParams) => {
    const response = await clientAxios.get<ListEstimatesResponse>('/estimates', {
      params: buildQueryParams(p)
    });
    const transformedEstimates = response.data.estimates.map(transformEstimate);
    return {
      ...response.data,
      estimates: transformedEstimates
    };
  };

  const query = useQuery({
    queryKey: ['estimates', params],
    queryFn: () => fetchEstimates(params),
    staleTime: Infinity
  });

  const refetch = async (newParams: UseGetEstimatesParams) => {
    return queryClient.fetchQuery({
      queryKey: ['estimates', newParams],
      queryFn: () => fetchEstimates(newParams)
    });
  };

  return { ...query, refetch };
}
