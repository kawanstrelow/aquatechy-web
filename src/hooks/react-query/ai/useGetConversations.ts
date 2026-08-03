import { useQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { ListAiConversationsResponse } from '@/ts/interfaces/AiChat';

export default function useGetConversations(page = 1, enabled = true) {
  return useQuery({
    queryKey: ['ai-conversations', page],
    queryFn: async () => {
      const response = await clientAxios.get<ListAiConversationsResponse>('/ai/conversations', {
        params: { page }
      });
      return response.data;
    },
    enabled
  });
}
