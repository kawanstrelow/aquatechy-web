import { useQuery } from '@tanstack/react-query';

import { useIsClient } from '@/hooks/useIsClient';
import { clientAxios } from '@/lib/clientAxios';
import { CompanyWithMyRole } from '@/ts/interfaces/Company';

export default function useGetCompanies() {
  const isClient = useIsClient();
  const {
    data = [],
    isLoading,
    isSuccess
  } = useQuery({
    queryKey: ['companies'],
    enabled: isClient,
    queryFn: async () => {
      const response = await clientAxios.get(`/companies`);

      const companies: CompanyWithMyRole[] | [] = response.data.companies ? response.data.companies : [];

      return companies;
    }
  });
  return { data, isLoading, isSuccess };
}
