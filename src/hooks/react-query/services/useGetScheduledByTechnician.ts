import { useQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';

import { clientAxios } from '@/lib/clientAxios';
import { ScheduledByTechnicianResponse } from '@/ts/interfaces/Service';

export function useGetScheduledByTechnician(assignedToId: string, date: string, enabled = true) {
  const userId = Cookies.get('userId');

  return useQuery({
    queryKey: ['schedule', userId, 'by-technician', assignedToId, date],
    queryFn: async () => {
      const response = await clientAxios.get<ScheduledByTechnicianResponse>('/services/scheduled/by-technician', {
        params: { assignedToId, date }
      });
      return response.data;
    },
    enabled: Boolean(userId && assignedToId && date && enabled),
    staleTime: 1000 * 60 * 60
  });
}
