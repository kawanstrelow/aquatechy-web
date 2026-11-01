import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import { CreateShoppingItemRequest, ShoppingItemResponse } from '@/ts/interfaces/Shopping';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message: string;
};

export type CreateShoppingItemParams = {
  companyId: string;
  data: CreateShoppingItemRequest;
};

export function useCreateShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, data }: CreateShoppingItemParams): Promise<ShoppingItemResponse> => {
      const response = await clientAxios.post(`/shopping-items/companies/${companyId}`, data);
      return response.data;
    },
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-items', companyId] });
      toast({
        title: translateMessage('toasts.itemAddedToShoppingList', 'Item added to shopping list'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorAddingItem', 'Error adding item'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
}
