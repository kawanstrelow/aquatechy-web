import { useQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { PoolFilterReplacementReportResponse } from '@/ts/interfaces/PoolFilterReplacementReport';

export const useGetPoolFilterReplacementReport = (companyId: string) => {
  return useQuery({
    queryKey: ['pool-filter-replacement-report', companyId],
    queryFn: async (): Promise<PoolFilterReplacementReportResponse> => {
      const response = await clientAxios.get('/reports/pools/filter-replacement', {
        params: { companyId }
      });
      return response.data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
};
