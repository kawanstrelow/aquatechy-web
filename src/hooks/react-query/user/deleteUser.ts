import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';

import { toast } from '../../../components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

export const useDeleteUser = () => {
  const router = useRouter();
  const { mutate, isPending, isError } = useMutation({
    mutationFn: async () => await clientAxios.delete('/users'),
    onSuccess: async () => {
      toast({
        duration: 2000,
        title: translateMessage('toasts.yourAccountHasBeenDeleted', 'Your account has been deleted'),
        variant: 'success'
      });
      router.push('/login');
    },
    onError: (
      error: AxiosError<{
        message: string;
      }>
    ) => {
      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorDeletingYourAccount', 'Error deleting your account'),
        description: error.response?.data?.message
          ? error.response.data.message
          : translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });
  return { mutate, isPending, isError };
};
