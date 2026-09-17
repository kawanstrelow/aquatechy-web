import { dataTagSymbol, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';

import { IUserSchema } from '@/app/(authenticated)/settings/profile/page';
import { updateUserBootstrap } from '@/hooks/react-query/user/getUser';

import { useToast } from '../../../components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';

export const useUpdateUser = (userId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: async (data: IUserSchema) => await clientAxios.patch('/users', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      updateUserBootstrap(data.data.user);
    },
    onError: (
      error: AxiosError<{
        message: string;
      }>
    ) => {
      toast({
        duration: 5000,
        variant: 'error',
        title: 'Error updating user',
        description: error.response?.data?.message ? error.response.data.message : 'Internal server error'
      });
    }
  });
  return { mutate, isPending, isSuccess };
};
