import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';

export type ExportClientsFormat = 'csv' | 'xlsx';

export interface ExportClientsCSVParams {
  companyIds: string[];
  format: ExportClientsFormat;
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const useExportClientsCSV = () => {
  const { toast } = useToast();

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async (params: ExportClientsCSVParams): Promise<void> => {
      const format = params.format;
      const mimeType = format === 'xlsx' ? XLSX_MIME : 'text/csv';

      const response = await clientAxios.get('/clients/export', {
        params: { companyIds: params.companyIds, format },
        paramsSerializer: {
          indexes: null
        },
        responseType: 'blob',
        headers: {
          Accept: mimeType
        }
      });

      const blob = new Blob([response.data], { type: mimeType });

      const contentDisposition = response.headers['content-disposition'];
      let filename = format === 'xlsx' ? 'clients-export.xlsx' : 'clients-export.csv';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        duration: 2000,
        title: 'Clients exported successfully',
        variant: 'success'
      });
    },
    onError: async (error: AxiosError) => {
      const permissionDeniedMessage = 'You need Owner, Admin, or Office access on every selected company.';
      let errorMessage = 'Failed to export clients';

      if (error.response?.status === 403) {
        errorMessage = permissionDeniedMessage;
      } else if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message || errorData.error || errorMessage;
        } catch {
          if (error.response?.status === 400) {
            errorMessage = 'companyIds must contain at least one company ID.';
          }
        }
      } else {
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
        title: 'Error exporting clients',
        description: errorMessage
      });
    }
  });

  return { mutate, mutateAsync, isPending };
};
