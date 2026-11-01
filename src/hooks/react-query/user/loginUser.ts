import { useMutation } from '@tanstack/react-query';
import { AxiosError, isAxiosError } from 'axios';
import Cookies from 'js-cookie';

import { toast } from '../../../components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

type LoginData = {
  email: string;
  password: string;
};

export const useResendConfirmation = (email: string) => {
  return useMutation({
    mutationFn: async () => await clientAxios.post('/users/resend-account-confirmation-email', { email }),
    onError: (error) => {
      throw new Error(
        isAxiosError(error)
          ? error.response?.data.message
          : translateMessage('toasts.errorResendingConfirmation', 'Error resending confirmation')
      );
    }
  });
};

export const useLoginUser = () => {
  const { mutate, isPending, error } = useMutation({
    mutationFn: async (data: LoginData) => await clientAxios.post('/sessions/v2', data),
    onSuccess: ({ data }) => {
      // Use path: '/' so there is a single site-wide cookie (avoids duplicates with backend or path-specific cookies)
      Cookies.set('accessToken', data.accessToken, { path: '/' });
      Cookies.set('userId', data.user.id, { path: '/' });
      // Redirect is handled by the caller (login page)
    },
    onError: (error): Error | AxiosError => {
      if (isAxiosError(error)) {
        if (error.response?.status === 401) {
          if (error.response?.data.message === 'Invalid email or password.') {
            toast({
              variant: 'error',
              duration: 5000,
              title: translateMessage('toasts.invalidEmailOrPassword', 'Invalid email or password')
            });
            return error;
          } else if (error.response?.data.message === 'User not activated.') {
            return error;
          } else {
            toast({
              variant: 'error',
              duration: 5000,
              title: translateMessage('toasts.internalError', 'Internal error')
            });
            return error;
          }
        }
      }

      return error;
    }
  });
  return { mutate, isPending, error };
};
