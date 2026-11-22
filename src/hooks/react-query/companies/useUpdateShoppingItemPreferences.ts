import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { translateMessage } from '@/i18n/runtime';
import { clientAxios } from '@/lib/clientAxios';

type ErrorResponse = {
  message?: string | string[];
};

function getErrorMessage(error: AxiosError<ErrorResponse>): string {
  const message = error.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message || translateMessage('toasts.anErrorOccurred', 'An error occurred');
}

export function useUpdateShoppingItemPreferences(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requireShoppingItemInstallPhotos: boolean) => {
      await clientAxios.patch(`/companies/${companyId}/shopping-item-preferences`, {
        requireShoppingItemInstallPhotos
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: translateMessage('settings.shoppingItems.saved', 'Shopping list preference saved'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('settings.shoppingItems.saveError', 'Could not save the shopping list preference'),
        description: getErrorMessage(error),
        variant: 'error'
      });
    }
  });
}
