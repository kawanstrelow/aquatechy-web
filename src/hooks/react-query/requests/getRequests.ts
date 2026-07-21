import { useQuery, useQueryClient } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { Request } from '@/ts/interfaces/Request';

export interface GetRequestsResponse {
  requests: Request[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
}

export interface UseGetRequestsParams {
  from: string;
  to: string;
  status: string[] | null;
  category: string | null;
  clientId: string | null;
  companyId: string | null;
  page: number;
  limit: number;
}

function toApiParams(params: UseGetRequestsParams) {
  const { status, ...rest } = params;
  return {
    ...rest,
    ...(status?.length ? { status: status.join(',') } : {})
  };
}

export default function useGetRequests(params: UseGetRequestsParams) {
  const queryClient = useQueryClient();

  const query = useQuery<GetRequestsResponse>({
    queryKey: ['requests', params],
    queryFn: async () => {
      const response = await clientAxios.get('/requests', { params: toApiParams(params) });
      response?.data?.requests.forEach((request: Request) => {
        request.client.fullName = `${request.client.firstName} ${request.client.lastName}`;
      });
      return response.data;
    },
    staleTime: Infinity
  });

  const refetch = async (newParams: UseGetRequestsParams) => {
    return queryClient.fetchQuery<GetRequestsResponse>({
      queryKey: ['requests', newParams],
      queryFn: async () => {
        const response = await clientAxios.get('/requests', { params: toApiParams(newParams) });
        response?.data?.requests.forEach((request: Request) => {
          request.client.fullName = `${request.client.firstName} ${request.client.lastName}`;
        });
        return response.data;
      }
    });
  };

  return { ...query, refetch };
}
