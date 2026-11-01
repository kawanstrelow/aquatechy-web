import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '../../../components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';
import { CreateService } from '@/ts/interfaces/Service';
import Cookies from 'js-cookie';

import { translateMessage } from '@/i18n/runtime';

export const useCreateService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = Cookies.get('userId');

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: CreateService) => await clientAxios.post('/services', data),

    onError: (
      error: AxiosError<{
        message: string;
      }>
    ) => {
      toast({
        variant: 'error',
        title: translateMessage('toasts.errorCreatingService', 'Error creating service.'),
        description: error.response?.data?.message
          ? error.response.data.message
          : translateMessage('toasts.internalServerError', 'Internal server error')
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', userId] });
      toast({
        variant: 'success',
        duration: 5000,
        title: translateMessage('toasts.serviceCreatedSuccessfully', 'Service created successfully')
      });
    }
  });
  return { mutate, isPending };
};
