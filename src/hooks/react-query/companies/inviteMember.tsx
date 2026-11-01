import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '../../../components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';
import { InviteMember } from '@/ts/interfaces/Company';

import { translateMessage } from '@/i18n/runtime';

export const useInviteMemberToACompany = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: InviteMember) => await clientAxios.post('/companies/invite', data),

    onError: (
      error: AxiosError<{
        message: string;
      }>
    ) => {
      toast({
        variant: 'error',
        title: translateMessage('toasts.errorInvitingMemberToACompany', 'Error inviting member to a company.'),
        description: error.response?.data?.message
          ? error.response.data.message
          : translateMessage('toasts.internalServerError', 'Internal server error')
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyMembers'] });
      toast({
        variant: 'success',
        duration: 5000,
        title: translateMessage('toasts.memberInvitedSuccessfully', 'Member invited successfully.')
      });
    }
  });
  return { mutate, isPending };
};
