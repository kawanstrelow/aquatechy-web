import { useQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { SubscriptionStatusResponse } from '@/ts/interfaces/Subscription';

export default function useGetSubscriptionStatus(enabled = true) {
  return useQuery({
    queryKey: ['subscription-status'],
    enabled,
    queryFn: async () => {
      const { data } = await clientAxios.get<SubscriptionStatusResponse>('/subscriptions/status');
      return data;
    },
    staleTime: 30 * 1000
  });
}
