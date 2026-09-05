import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import Cookies from 'js-cookie';

import { useToast } from '@/components/ui/use-toast';
import { useAssignmentsContext } from '@/context/assignments';
import { clientAxios } from '@/lib/clientAxios';
import { Assignment, TransferAssignment } from '@/ts/interfaces/Assignments';

/** Backend sometimes returns `{ message }`, a string, or a JSON array of strings */
function messageFromAxiosResponseData(data: unknown): string | undefined {
  if (data == null || typeof data === 'undefined') return undefined;
  if (typeof data === 'string') return data.trim() || undefined;
  if (Array.isArray(data)) {
    const parts = data.filter((item): item is string => typeof item === 'string');
    return parts.length ? parts.join(' ') : undefined;
  }
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const m = (data as { message: unknown }).message;
    if (typeof m === 'string') return m.trim() || undefined;
    if (Array.isArray(m)) {
      const parts = m.filter((item): item is string => typeof item === 'string');
      return parts.length ? parts.join(' ') : undefined;
    }
  }
  return undefined;
}

export interface TransferResult {
  assignmentId: string;
  success: boolean;
  message?: string;
}

export interface TransferResponse {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  results: TransferResult[];
}

async function transferPermanently(data: Partial<Assignment>[]): Promise<TransferResponse> {
  const response = await clientAxios.post<TransferResponse>('/assignments/transferpermanently', data);
  return response.data;
}

export const useTransferPermanentlyRoute = (
  assignmentToTransfer?: Assignment | Assignment[],
  onSuccessCallback?: (result: TransferResponse) => void,
  onErrorCallback?: (errorMessage: string) => void
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { assignments } = useAssignmentsContext();
  const userId = Cookies.get('userId');

  const assignmentsToTransfer: Assignment[] = !assignmentToTransfer
    ? assignments.current
    : Array.isArray(assignmentToTransfer)
      ? assignmentToTransfer
      : [assignmentToTransfer];
  const firstAssignment = assignmentsToTransfer[0];

  const { mutate, isPending } = useMutation({
    mutationFn: (form: TransferAssignment) => {
      const assignments = assignmentsToTransfer!.map((assignment) => {
        return {
          ...assignment,
          ...form,
          assignmentId: assignment.id
        };
      });
      return transferPermanently(assignments);
    },
    onError: (error: AxiosError<unknown>) => {
      const errorMessage =
        messageFromAxiosResponseData(error.response?.data) ||
        (typeof error.message === 'string' && error.message ? error.message : undefined) ||
        'Internal server error';

      // Necessary because it can return an error but some assignments may have been transferred successfully
      queryClient.invalidateQueries({ queryKey: ['assignments', userId] });
      queryClient.invalidateQueries({ queryKey: ['assignments', 'by-pool'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', userId] });

      // Invalidate specific client query if we have the client ID from the assignment
      if (firstAssignment?.pool?.clientOwnerId) {
        queryClient.invalidateQueries({ queryKey: ['clients', firstAssignment.pool.clientOwnerId] });
      }

      if (onErrorCallback) {
        onErrorCallback(errorMessage);
      } else {
        toast({
          duration: 5000,
          variant: 'error',
          title: 'Could not transfer assignment(s)',
          description: errorMessage
        });
      }
    },
    onSuccess: (data: TransferResponse) => {
      queryClient.invalidateQueries({ queryKey: ['assignments', userId] });
      queryClient.invalidateQueries({ queryKey: ['assignments', 'by-pool'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', userId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });

      // Invalidate specific client query if we have the client ID from the assignment
      if (firstAssignment?.pool?.clientOwnerId) {
        queryClient.invalidateQueries({ queryKey: ['clients', firstAssignment.pool.clientOwnerId] });
      }

      // Show toast based on results
      if (data.failureCount === 0) {
        toast({
          duration: 2000,
          title: 'All assignments transferred successfully',
          variant: 'success'
        });
      } else if (data.successCount > 0) {
        toast({
          duration: 3000,
          title: `${data.successCount} of ${data.totalProcessed} assignments transferred`,
          description: 'Some transfers failed. Check the details.',
          variant: 'default'
        });
      }

      // Call the success callback with the result data
      if (onSuccessCallback) {
        onSuccessCallback(data);
      }
    }
  });
  return { mutate, isPending };
};
