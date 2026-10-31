import { useQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';

import { asLead } from './leadResponse';

export function useGetLead(leadId: string) {
  return useQuery({
    queryKey: ['leads', leadId],
    enabled: Boolean(leadId),
    queryFn: async () => {
      const response = await clientAxios.get(`/leads/${leadId}`);
      return asLead(response.data);
    }
  });
}
