import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import { SendAiMessageResponse } from '@/ts/interfaces/AiChat';

type SendMessageVariables = {
  /** Backend-issued conversation ObjectId — used only in the URL path */
  conversationId: string;
  content: string;
};

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ conversationId, content }: SendMessageVariables): Promise<SendAiMessageResponse> => {
      if (!conversationId) {
        throw new Error('conversationId is required');
      }

      // conversationId is path-only; body is { content } exclusively
      const response = await clientAxios.post<SendAiMessageResponse>(
        `/ai/conversations/${conversationId}/messages`,
        { content },
        // AI turns can take several seconds while tools run
        { timeout: 120_000 }
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['ai-conversation', variables.conversationId] });
    },
    onError: (error: AxiosError<{ message: string | string[] }>) => {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.message;
      const message = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage ||
          (status === 503 ? 'AI assistant is not configured on the server.' : 'Failed to send message');

      toast({
        duration: 4000,
        variant: 'error',
        title: 'Error sending message',
        description: message
      });
    }
  });
}
