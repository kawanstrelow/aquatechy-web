import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '../../../components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';
import { CreateAssignment } from '../../../ts/interfaces/Assignments';
import { z } from 'zod';
import { QueryKeys } from '@/constants/query-keys';
import Cookies from 'js-cookie';

import { translateMessage } from '@/i18n/runtime';

export type RemoveAssignmentInput = {
  assignmentId: string;
};

export async function removeAssignmentFn({ assignmentId }: RemoveAssignmentInput) {
  return await clientAxios.delete('/assignments', { data: { assignmentId } });
}

export const useRemoveAssignmentService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = Cookies.get('userId');

  return useMutation({
    mutationFn: (assignmentId: RemoveAssignmentInput) => removeAssignmentFn(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', userId] });
      queryClient.invalidateQueries({ queryKey: ['assignments', 'by-pool'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', userId] });
      toast({
        variant: 'success',
        duration: 2000,
        title: translateMessage('toasts.assignmentRemovedSuccessfully', 'Assignment removed successfully'),
        description: translateMessage(
          'toasts.theAssignmentHasBeenRemovedSuccessfully',
          'The assignment has been removed successfully'
        )
      });
    },
    onError: (
      error: AxiosError<{
        message: string;
      }>
    ) => {
      toast({
        variant: 'error',
        title: translateMessage('toasts.errorRemovingAssignment', 'Error removing assignment'),
        description: error.response?.data?.message
          ? error.response.data.message
          : translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });
};
