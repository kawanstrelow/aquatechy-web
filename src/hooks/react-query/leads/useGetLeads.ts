import { useQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { Lead } from '@/ts/interfaces/Lead';

export function useGetLeads(companyOwnerIds: string[]) {
  const ids = [...companyOwnerIds].sort();

  return useQuery({
    queryKey: ['leads', ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const responses = await Promise.all(
        ids.map((companyOwnerId) => clientAxios.get('/leads', { params: { companyOwnerId } }))
      );

      const leads = responses.flatMap((response) => {
        const payload = response.data?.leads;
        return Array.isArray(payload) ? (payload as Lead[]) : [];
      });

      const unique = new Map(leads.map((lead) => [lead.id, lead]));

      return Array.from(unique.values()).sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      );
    }
  });
}
