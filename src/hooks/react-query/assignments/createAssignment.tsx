import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { z } from 'zod';

import { useToast } from '../../../components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';
import { CreateAssignment } from '../../../ts/interfaces/Assignments';

import { translateMessage } from '@/i18n/runtime';

const createAssignmentBodySchema = z.object({
  assignmentToId: z.string().min(1),
  poolId: z.string().min(1),
  serviceTypeId: z.string().min(1),
  weekday: z.string().min(1),
  frequency: z.string().min(1),
  startOn: z.string().min(1),
  endAfter: z.string().min(1),
  instructions: z.string().optional()
});

type CreateAssignmentWithInstructions = z.infer<typeof createAssignmentBodySchema>;

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = Cookies.get('userId');
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: CreateAssignment | CreateAssignmentWithInstructions) =>
      await clientAxios.post('/assignments', data),

    onError: (
      error: AxiosError<{
        message: string;
      }>
    ) => {
      toast({
        variant: 'error',
        title: translateMessage('toasts.errorCreatingAssignment', 'Error creating assignment'),
        description: error.response?.data?.message
          ? error.response.data.message
          : translateMessage('toasts.internalServerError', 'Internal server error')
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', userId] });
      queryClient.invalidateQueries({ queryKey: ['assignments', 'by-pool'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', userId] });
      toast({
        variant: 'success',
        duration: 2000,
        title: translateMessage('toasts.assignmentCreatedSuccessfully', 'Assignment created successfully')
      });
    }
  });
  return { mutate, isPending };
};
