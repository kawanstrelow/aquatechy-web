import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import { ShoppingItemResponse, UpdateShoppingItemRequest } from '@/ts/interfaces/Shopping';

type ErrorResponse = {
  message?: string | string[];
};

function getErrorMessage(error: AxiosError<ErrorResponse>): string {
  const message = error.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message || 'An error occurred';
}

export function useUpdateShoppingItem(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shoppingItemId,
      data
    }: {
      shoppingItemId: string;
      data: UpdateShoppingItemRequest;
    }): Promise<ShoppingItemResponse> => {
      const response = await clientAxios.patch(`/shopping-items/${shoppingItemId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-items', companyId] });
      toast({
        title: 'Shopping item updated',
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: 'Error updating shopping item',
        description: getErrorMessage(error),
        variant: 'error'
      });
    }
  });
}
