import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import Cookies from 'js-cookie';
import { TransferService } from '@/ts/interfaces/Service';

import { translateMessage } from '@/i18n/runtime';

export interface ServiceTransferResult {
  serviceId: string;
  success: boolean;
  message?: string;
}

export interface ServiceTransferResponse {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  results: ServiceTransferResult[];
}

export const useTransferService = (
  onSuccessCallback?: (result: ServiceTransferResponse) => void,
  onErrorCallback?: (errorMessage: string) => void
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = Cookies.get('userId');

  const { mutate, isPending } = useMutation({
    mutationFn: async (transfers: TransferService[]): Promise<ServiceTransferResponse> => {
      const response = await clientAxios.post<ServiceTransferResponse>('/services/transfer', transfers, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    onError: (
      error: AxiosError<{
        message: string;
        issues?: Array<{
          code: string;
          path: (string | number)[];
          message: string;
        }>;
      }>
    ) => {
      const errorMessage =
        error.response?.data?.message || translateMessage('toasts.internalServerError', 'Internal server error');
      const issues = error.response?.data?.issues;

      // Necessary because it can return an error but some services may have been transferred successfully
      queryClient.invalidateQueries({ queryKey: ['assignments', userId] });
      queryClient.invalidateQueries({ queryKey: ['schedule', userId] });

      const fullErrorMessage = issues ? `${errorMessage}: ${issues.map((i) => i.message).join(', ')}` : errorMessage;

      // Call the error callback to display error in dialog
      if (onErrorCallback) {
        onErrorCallback(fullErrorMessage);
      } else {
        // Fallback to toast if no callback provided
        toast({
          duration: 5000,
          variant: 'error',
          title: translateMessage('toasts.errorTransferringService', 'Error transferring service'),
          description: fullErrorMessage
        });
      }
    },
    onSuccess: (data: ServiceTransferResponse) => {
      queryClient.invalidateQueries({ queryKey: ['assignments', userId] });
      queryClient.invalidateQueries({ queryKey: ['schedule', userId] });

      // Show toast based on results
      if (data.failureCount === 0) {
        toast({
          duration: 2000,
          title:
            data.totalProcessed > 1
              ? translateMessage(
                  'toasts.allCountServicesTransferredSuccessfully',
                  'All {count} services transferred successfully'
                ).replace('{count}', String(data.totalProcessed))
              : translateMessage('toasts.serviceTransferredSuccessfully', 'Service transferred successfully'),
          variant: 'success'
        });
      } else if (data.successCount > 0) {
        toast({
          duration: 3000,
          title: translateMessage(
            'toasts.successOfTotalServicesTransferred',
            '{success} of {total} services transferred'
          )
            .replace('{success}', String(data.successCount))
            .replace('{total}', String(data.totalProcessed)),
          description: translateMessage(
            'toasts.someTransfersFailedCheckTheDetails',
            'Some transfers failed. Check the details.'
          ),
          variant: 'default'
        });
      }

      // Call the success callback with the result data
      if (onSuccessCallback) {
        onSuccessCallback(data);
      }
    }
  });
  return { mutate, isPending };
};
