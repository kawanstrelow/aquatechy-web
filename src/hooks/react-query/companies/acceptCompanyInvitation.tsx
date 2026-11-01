import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '../../../components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';
import { AcceptInvitation } from '@/ts/interfaces/Company';

import { translateMessage } from '@/i18n/runtime';

export const useAcceptCompanyInvitation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: AcceptInvitation) => await clientAxios.patch('/users/invitation', data),

    onError: (
      error: AxiosError<{
        message: string;
      }>
    ) => {
      return toast({
        variant: 'error',
        title: translateMessage('toasts.errorAcceptingInvitation', 'Error accepting invitation.'),
        description: error.response?.data?.message
          ? error.response.data.message
          : translateMessage('toasts.internalServerError', 'Internal server error')
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'], exact: true });
      return toast({
        variant: 'success',
        duration: 5000,
        title: translateMessage('toasts.invitationAcceptedSuccessfully', 'Invitation accepted successfully.')
      });
    }
  });
  return { mutate, isPending };
};
