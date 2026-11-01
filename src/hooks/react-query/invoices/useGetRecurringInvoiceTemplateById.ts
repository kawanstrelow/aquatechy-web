import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { GetRecurringInvoiceTemplateByIdResponse } from '@/ts/interfaces/RecurringInvoiceTemplate';

import { translateMessage } from '@/i18n/runtime';

export default function useGetRecurringInvoiceTemplateById(templateId: string | undefined) {
  const query = useQuery({
    queryKey: ['recurring-invoice-template', templateId],
    queryFn: async () => {
      if (!templateId) {
        throw new Error('Template ID is required');
      }

      try {
        const response = await clientAxios.get<GetRecurringInvoiceTemplateByIdResponse>(
          `/recurring-invoice-templates/${templateId}`
        );

        // Backend stores prices in cents; convert to dollars for display
        const toDollars = (cents: number) => (cents ?? 0) / 100;
        const template = response.data.template;
        const transformedTemplate = {
          ...template,
          subtotal: toDollars(template.subtotal),
          taxAmount: toDollars(template.taxAmount),
          discountAmount: toDollars(template.discountAmount),
          total: toDollars(template.total),
          lineItems: template.lineItems.map((item) => ({
            ...item,
            unitPrice: toDollars(item.unitPrice),
            amount: toDollars(item.amount),
            taxRate: item.taxRate ?? 0,
            taxAmount: item.taxAmount !== undefined ? toDollars(item.taxAmount) : 0
          })),
          ...(template.invoices?.length
            ? {
                invoices: template.invoices.map((inv) => ({
                  ...inv,
                  total: toDollars(inv.total)
                }))
              }
            : {})
        };

        return { ...response.data, template: transformedTemplate };
      } catch (error) {
        // Handle axios errors with proper error messages
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          const errorMessage = error.response?.data?.message;

          if (
            status === 404 ||
            (errorMessage && typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('not found'))
          ) {
            throw new Error(
              translateMessage('toasts.recurringInvoiceTemplateNotFound', 'Recurring invoice template not found')
            );
          }

          if (status === 400 && errorMessage) {
            // Handle validation errors or permission denied
            const message = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage;
            throw new Error(message);
          }

          // For other errors, use the error message from the API or a generic message
          throw new Error(
            errorMessage
              ? Array.isArray(errorMessage)
                ? errorMessage.join(', ')
                : errorMessage
              : translateMessage(
                  'toasts.failedToFetchRecurringInvoiceTemplate',
                  'Failed to fetch recurring invoice template'
                )
          );
        }

        // Re-throw non-axios errors
        throw error;
      }
    },
    enabled: !!templateId, // Only run query if templateId is provided
    staleTime: Infinity
  });

  return query;
}
