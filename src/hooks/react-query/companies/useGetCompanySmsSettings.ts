import { useQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { CompanySmsSettingsPublic } from '@/ts/interfaces/CompanySmsSettings';

export const companySmsSettingsQueryKey = (companyId: string) => ['company-sms-settings', companyId] as const;

export function useGetCompanySmsSettings(companyId: string) {
  return useQuery({
    queryKey: companySmsSettingsQueryKey(companyId),
    enabled: !!companyId,
    queryFn: async () => {
      const response = await clientAxios.get<CompanySmsSettingsPublic>(`/companies/${companyId}/sms-settings`);
      return response.data;
    }
  });
}
