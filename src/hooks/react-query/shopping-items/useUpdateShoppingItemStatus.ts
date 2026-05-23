import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import { ShoppingItemResponse, UpdateShoppingItemStatusRequest } from '@/ts/interfaces/Shopping';

type ErrorResponse = {
  message: string;
};

export function useUpdateShoppingItemStatus(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shoppingItemId,
      data
    }: {
      shoppingItemId: string;
      data: UpdateShoppingItemStatusRequest;
    }): Promise<ShoppingItemResponse> => {
      const response = await clientAxios.patch(`/shopping-items/${shoppingItemId}/status`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-items', companyId] });
      toast({
        title: 'Status updated',
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: 'Error updating status',
        description: error.response?.data?.message || 'An error occurred',
        variant: 'error'
      });
    }
  });
}
