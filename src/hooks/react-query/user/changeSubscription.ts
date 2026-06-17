import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { useUserStore } from '@/store/user';
import { UserSubscription } from '@/ts/enums/enums';

import { clientAxios } from '../../../lib/clientAxios';

export const useChangeSubscription = (subscriptionPlan: UserSubscription) => {
  const user = useUserStore((state) => state.user);
  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const { data } = await clientAxios.post<string>('/subscriptions', {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        subscriptionPlan
      });
      return data;
    },
    onSuccess: (checkoutUrl) => {
      window.location.href = checkoutUrl;
    },
    onError: (error): Error | AxiosError => {
      toast({
        variant: 'error',
        title: 'Error on request to change subscription',
        description: 'Please try again later or contact support'
      });
      return error;
    }
  });
  return { mutate, isPending };
};
