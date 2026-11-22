import { useQuery } from '@tanstack/react-query';
import { clientAxios } from '@/lib/clientAxios';

export default function useGetCompany(companyId: string) {
  const { data, isLoading, isSuccess } = useQuery({
    queryKey: ['companies', companyId],
    queryFn: async () => {
      const response = await clientAxios(`/companies/${companyId}`);

      return response.data;
    },
    enabled: !!companyId,
    staleTime: Infinity
  });
  return { data, isLoading, isSuccess };
}
