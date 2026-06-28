import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';

import { clientAxios } from '@/lib/clientAxios';
import { createFormData } from '@/utils/formUtils';
import { useToast } from '@/components/ui/use-toast';
import { Frequency } from '@/ts/enums/enums';

// Update the Assignment interface to match the form schema
export interface Assignment {
  assignmentToId: string;
  serviceTypeId: string;
  frequency: Frequency;
  // Fields for recurring assignments (not ONCE)
  weekday?: "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";
  startOn?: string;
  endAfter?: string;
  // Field for one-time assignment (ONCE)
  scheduledTo?: string;
}

// Define the client creation data type with assignments array
export interface CreateClientWithAssignmentsData {
  // Client data
  companyOwnerId: string;
  firstName: string;
  lastName: string;
  clientCompany?: string;
  customerCode?: string;
  clientAddress: string;
  clientCity: string;
  clientState: string;
  clientZip: string;
  clientType: 'Commercial' | 'Residential';
  timezone: string;
  phone: string;
  email: string;
  secondaryEmail?: string;
  invoiceEmail?: string;
  clientNotes?: string;
  clientAddressLine2?: string;
  // Pool data
  sameBillingAddress: boolean;
  animalDanger: boolean;
  poolAddress?: string;
  addressLine2?: string;
  poolAddressLine2?: string;
  poolState?: string;
  poolCity?: string;
  poolZip?: string;
  monthlyPayment?: number;
  lockerCode?: string;
  enterSide?: string;
  poolType?: string;
  poolNotes?: string;
  bodyOfWater?: string | null;
  volumeInGallons?: number;
  estimatesConvertedFrom?: number;

  // Assignments array
  assignments: Assignment[];
}

export const useCreateClientWithMultipleAssignments = (options?: { redirectTo?: string }) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateClientWithAssignmentsData) => {
      // Process assignments - remove weekday when frequency is ONCE
      const processedAssignments = data.assignments.map(assignment => {
        if (assignment.frequency === Frequency.ONCE) {
          // For ONCE frequency, only include scheduledTo and exclude weekday, startOn, endAfter
          const { weekday, startOn, endAfter, ...rest } = assignment;
          return rest;
        } else {
          // For other frequencies, only include weekday, startOn, endAfter and exclude scheduledTo
          const { scheduledTo, ...rest } = assignment;
          return rest;
        }
      });

      // Stringify the assignments array
      const formData = {
        ...data,
        assignments: JSON.stringify(processedAssignments)
      };

      return await clientAxios.post('/client-pool-assignment', createFormData(formData), {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['allClients'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      router.push(options?.redirectTo || '/clients');
      toast({
        duration: 5000,
        title: 'Client added successfully',
        variant: 'success'
      });
    },
    onError: (
      error: AxiosError<{
        message: string;
      }>
    ) => {
      console.log(error);
      toast({
        duration: 5000,
        title: 'Error adding client',
        variant: 'error',
        description: error.response?.data?.message ? error.response.data.message : 'Internal server error'
      });
    }
  });
};
