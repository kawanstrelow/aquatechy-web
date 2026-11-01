import { useQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

export default function useGetClient(clientId: string) {
  const { data, isLoading, isSuccess, isError } = useQuery({
    queryKey: ['clients', clientId],
    queryFn: async () => {
      const response = await clientAxios(`/client/${clientId}`);

      if (response.status === 404) {
        throw new Error(translateMessage('toasts.clientNotFound', 'Client not found'));
      }

      if (response.data.clientWithLastService) {
        response.data.clientWithLastService.fullName = `${response.data.clientWithLastService.firstName} ${response.data.clientWithLastService.lastName}`;
      }

      return { ...response.data.clientWithLastService };
    },
    staleTime: Infinity
  });
  return { data, isLoading, isSuccess, isError };
}
