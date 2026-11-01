import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import {
  CreateRecurringInvoiceTemplateRequest,
  CreateRecurringInvoiceTemplateResponse
} from '@/ts/interfaces/RecurringInvoiceTemplate';

import { useToast } from '@/components/ui/use-toast';

import { translateMessage } from '@/i18n/runtime';

export const useCreateRecurringInvoiceTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, mutateAsync, isPending, isSuccess } = useMutation({
    mutationFn: async (
      data: CreateRecurringInvoiceTemplateRequest
    ): Promise<CreateRecurringInvoiceTemplateResponse> => {
      const payload = {
        ...data,
        userToday: new Date().toString()
      };
      const response = await clientAxios.post<CreateRecurringInvoiceTemplateResponse>(
        '/recurring-invoice-templates',
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate recurring invoice templates list queries
      queryClient.invalidateQueries({ queryKey: ['recurring-invoice-templates'] });

      toast({
        duration: 2000,
        title: translateMessage(
          'toasts.recurringInvoiceTemplateCreatedSuccessfully',
          'Recurring invoice template created successfully'
        ),
        variant: 'success'
      });
    },
    onError: (
      error: AxiosError<{
        message: string | string[];
      }>
    ) => {
      const errorMessage = error.response?.data?.message;
      const message = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage ||
          translateMessage(
            'toasts.failedToCreateRecurringInvoiceTemplate',
            'Failed to create recurring invoice template'
          );

      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage(
          'toasts.errorCreatingRecurringInvoiceTemplate',
          'Error creating recurring invoice template'
        ),
        description: message
      });
    }
  });

  return { mutate, mutateAsync, isPending, isSuccess };
};
