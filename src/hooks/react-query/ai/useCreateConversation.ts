import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import { CreateAiConversationRequest, CreateAiConversationResponse } from '@/ts/interfaces/AiChat';

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateAiConversationRequest): Promise<CreateAiConversationResponse> => {
      // Backend creates the conversation and returns conversation.id (Mongo ObjectId)
      const response = await clientAxios.post<CreateAiConversationResponse>('/ai/conversations', data);
      const conversationId = response.data?.conversation?.id;

      if (!conversationId) {
        throw new Error('Create conversation response missing conversation.id');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    },
    onError: (error: AxiosError<{ message: string | string[] }>) => {
      const errorMessage = error.response?.data?.message;
      const message = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage || 'Failed to create conversation';

      toast({
        duration: 3000,
        variant: 'error',
        title: 'Error creating chat',
        description: message
      });
    }
  });
}
