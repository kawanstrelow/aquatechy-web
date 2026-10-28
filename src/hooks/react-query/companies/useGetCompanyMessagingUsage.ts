import { useQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { CompanyMessagingUsage } from '@/ts/interfaces/Messaging';

export const companyMessagingUsageQueryKey = (companyId: string) => ['company-messaging-usage', companyId] as const;

export function useGetCompanyMessagingUsage(companyId: string) {
  return useQuery({
    queryKey: companyMessagingUsageQueryKey(companyId),
    enabled: !!companyId,
    queryFn: async () => {
      const response = await clientAxios.get<CompanyMessagingUsage>(`/companies/${companyId}/messaging-usage`);
      return response.data;
    }
  });
}
