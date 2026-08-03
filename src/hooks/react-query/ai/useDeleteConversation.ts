import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (conversationId: string): Promise<void> => {
      await clientAxios.delete(`/ai/conversations/${conversationId}`);
    },
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      queryClient.removeQueries({ queryKey: ['ai-conversation', conversationId] });
    },
    onError: (error: AxiosError<{ message: string | string[] }>) => {
      const errorMessage = error.response?.data?.message;
      const message = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage || 'Failed to delete conversation';

      toast({
        duration: 3000,
        variant: 'error',
        title: 'Error deleting chat',
        description: message
      });
    }
  });
}
