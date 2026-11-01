import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useTranslations } from 'next-intl';

import { IUserSchema } from '@/app/(authenticated)/settings/profile/page';
import { updateUserBootstrap } from '@/hooks/react-query/user/getUser';

import { useToast } from '../../../components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';

export const useUpdateUser = (userId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('common');

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
        title: t('errorUpdatingUser'),
        description: error.response?.data?.message ? error.response.data.message : t('internalServerError')
      });
    }
  });
  return { mutate, isPending, isSuccess };
};
