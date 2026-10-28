import { useInfiniteQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { ClientMessageItem, MessagingPage } from '@/ts/interfaces/Messaging';

const CLIENT_MESSAGES_LIMIT = 20;

export const clientMessagesQueryKey = (clientId: string) => ['client-messages', clientId] as const;

export function useGetClientMessages(clientId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: clientMessagesQueryKey(clientId),
    enabled: !!clientId && enabled,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const response = await clientAxios.get<MessagingPage<ClientMessageItem>>(`/clients/${clientId}/messages`, {
        params: {
          limit: CLIENT_MESSAGES_LIMIT,
          ...(pageParam ? { cursor: pageParam } : {})
        }
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });
}
