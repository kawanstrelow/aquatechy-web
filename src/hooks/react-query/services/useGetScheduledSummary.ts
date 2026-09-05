import { useQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';

import { clientAxios } from '@/lib/clientAxios';
import { ScheduledSummaryResponse } from '@/ts/interfaces/Service';

export function useGetScheduledSummary() {
  const userId = Cookies.get('userId');

  return useQuery({
    queryKey: ['schedule', userId, 'summary'],
    queryFn: async () => {
      const response = await clientAxios.get<ScheduledSummaryResponse>('/services/scheduled/summary');
      return response.data;
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 60
  });
}
