import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '../../../components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

export const useDeleteCompanyMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ companyId, memberId }: { companyId: string; memberId: string }) =>
      await clientAxios.delete(`/companies/members`, {
        data: {
          companyId,
          memberId
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyMembers'] });
      // exact: true so we do not invalidate ['companies', id] detail queries (refetch would 404 after quit)
      queryClient.invalidateQueries({ queryKey: ['companies'], exact: true });
      toast({
        duration: 5000,
        title: translateMessage(
          'toasts.companyMemberWasRemovedSuccessfully',
          'Company member was removed successfully.'
        ),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast({
        duration: 5000,
        title: translateMessage('toasts.errorRemovingCompanyMember', 'Error removing company member.'),
        description:
          error.response?.data?.message ?? translateMessage('toasts.somethingWentWrong', 'Something went wrong.'),
        variant: 'error'
      });
    }
  });
  return { mutate, isPending };
};
