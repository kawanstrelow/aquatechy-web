import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';
import { UpdateServiceTypeRequest, ServiceTypeResponse } from '../../../ts/interfaces/ServiceTypes';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message: string;
};

export const useUpdateServiceType = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceTypeId,
      data
    }: {
      serviceTypeId: string;
      data: UpdateServiceTypeRequest;
    }): Promise<ServiceTypeResponse> => {
      const response = await clientAxios.patch(`/service-types/${serviceTypeId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: translateMessage('toasts.serviceTypeUpdatedSuccessfully', 'Service type updated successfully'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorUpdatingServiceType', 'Error updating service type'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
};
