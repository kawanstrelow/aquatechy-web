import { useQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { GetAiConversationResponse } from '@/ts/interfaces/AiChat';

type UseGetConversationOptions = {
  enabled?: boolean;
};

export default function useGetConversation(
  conversationId: string | null,
  options: UseGetConversationOptions = {}
) {
  const enabled = options.enabled ?? Boolean(conversationId);

  return useQuery({
    queryKey: ['ai-conversation', conversationId],
    queryFn: async () => {
      const response = await clientAxios.get<GetAiConversationResponse>(`/ai/conversations/${conversationId}`);
      return response.data;
    },
    enabled: Boolean(conversationId) && enabled
  });
}
