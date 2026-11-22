import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import { ShoppingItemResponse, UpdateShoppingItemStatusRequest } from '@/ts/interfaces/Shopping';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message?: string | string[];
};

function getErrorMessage(error: AxiosError<ErrorResponse>): string {
  const message = error.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message || translateMessage('toasts.anErrorOccurred', 'An error occurred');
}

export type UpdateShoppingItemStatusVariables = {
  shoppingItemId: string;
  data: UpdateShoppingItemStatusRequest;
  photos?: File[];
};

export function useUpdateShoppingItemStatus(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shoppingItemId,
      data,
      photos
    }: UpdateShoppingItemStatusVariables): Promise<ShoppingItemResponse> => {
      if (photos && photos.length > 0) {
        const formData = new FormData();
        formData.append('status', data.status);
        if (data.notes !== undefined) {
          formData.append('notes', data.notes);
        }
        photos.forEach((photo) => formData.append('photo', photo));

        const response = await clientAxios.patch(`/shopping-items/${shoppingItemId}/status`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
      }

      const response = await clientAxios.patch(`/shopping-items/${shoppingItemId}/status`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-items', companyId] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: translateMessage('toasts.statusUpdated', 'Status updated'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorUpdatingStatus', 'Error updating status'),
        description: getErrorMessage(error),
        variant: 'error'
      });
    }
  });
}
