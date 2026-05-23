import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';

type ErrorResponse = {
  message: string;
};

export function useDeleteShoppingItem(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shoppingItemId: string): Promise<void> => {
      await clientAxios.delete(`/shopping-items/${shoppingItemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-items', companyId] });
      toast({
        title: 'Item removed from shopping list',
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: 'Error removing item',
        description: error.response?.data?.message || 'An error occurred',
        variant: 'error'
      });
    }
  });
}
