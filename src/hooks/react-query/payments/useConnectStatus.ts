import { useQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { ConnectStatusResponse } from '@/ts/interfaces/StripeConnect';

export default function useConnectStatus(companyId: string | undefined) {
  return useQuery({
    queryKey: ['payments-connect-status', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await clientAxios.get<ConnectStatusResponse>('/payments/connect/status', {
        params: { companyId }
      });
      return data;
    },
    staleTime: 30 * 1000
  });
}
