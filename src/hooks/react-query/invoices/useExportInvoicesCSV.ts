import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { useToast } from '@/components/ui/use-toast';

import { translateMessage } from '@/i18n/runtime';

export interface ExportInvoicesCSVParams {
  clientId?: string | null;
  companyOwnerId?: string | null;
  status?: 'paid' | 'unpaid' | 'draft' | 'overdue' | 'cancelled' | null;
  fromDate?: string | null;
  toDate?: string | null;
}

export const useExportInvoicesCSV = () => {
  const { toast } = useToast();

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async (params: ExportInvoicesCSVParams): Promise<void> => {
      // Build query params - only include defined, non-null values
      const queryParams: Record<string, string> = {};

      if (params.clientId) {
        queryParams.clientId = params.clientId;
      }
      if (params.companyOwnerId) {
        queryParams.companyOwnerId = params.companyOwnerId;
      }
      if (params.status) {
        queryParams.status = params.status;
      }
      if (params.fromDate) {
        queryParams.fromDate = params.fromDate;
      }
      if (params.toDate) {
        queryParams.toDate = params.toDate;
      }

      const response = await clientAxios.get(`/invoices/export/csv`, {
        params: queryParams,
        responseType: 'blob',
        headers: {
          Accept: 'text/csv'
        }
      });

      // Create blob from response
      const blob = new Blob([response.data], { type: 'text/csv' });

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `invoices-export-${new Date().toISOString().split('T')[0]}.csv`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        duration: 2000,
        title: translateMessage('toasts.invoicesExportedSuccessfully', 'Invoices exported successfully'),
        variant: 'success'
      });
    },
    onError: async (error: AxiosError) => {
      let errorMessage = translateMessage('toasts.failedToExportInvoicesToCsv', 'Failed to export invoices to CSV');

      // Handle blob error responses
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message || errorData.error || errorMessage;
        } catch {
          // If parsing fails, use default message based on status
          errorMessage =
            error.response?.status === 403
              ? translateMessage(
                  'toasts.permissionDeniedYouDoNotHaveAccessToExportInvoices',
                  'Permission denied. You do not have access to export invoices.'
                )
              : error.response?.status === 400
                ? translateMessage('toasts.invalidFilterParametersProvided', 'Invalid filter parameters provided.')
                : errorMessage;
        }
      } else {
        // Handle regular JSON error responses
        const errorData = error.response?.data as { message?: string | string[]; error?: string };
        if (errorData?.message) {
          errorMessage = Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message;
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }
      }

      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorExportingInvoices', 'Error exporting invoices'),
        description: errorMessage
      });
    }
  });

  return { mutate, mutateAsync, isPending };
};
