import { useQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { RouteEfficiencyReportResponse } from '@/ts/interfaces/RouteEfficiencyReport';

export const useGetRouteEfficiencyReport = (companyId: string) => {
  return useQuery({
    queryKey: ['route-efficiency-report', companyId],
    queryFn: async (): Promise<RouteEfficiencyReportResponse> => {
      const response = await clientAxios.get('/reports/team/route-efficiency', {
        params: { companyId }
      });
      return response.data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
};
