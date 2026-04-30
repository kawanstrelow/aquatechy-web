import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientAxios } from '@/lib/clientAxios';
import { AxiosError } from 'axios';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

export type CreateManyClientsInput = {
  clientAddress: string;
  clientCity: string;
  customerCode?: string;
  email: string;
  invoiceEmail?: string;
  firstName: string;
  lastName: string;
  clientNotes?: string;
  phone: string;
  clientState: string;
  clientZip: string;
  clientCompany?: string;
  clientType: 'Commercial' | 'Residential';
  timezone:
    | 'America/New_York'
    | 'America/Chicago'
    | 'America/Denver'
    | 'America/Los_Angeles'
    | 'America/Anchorage'
    | 'America/Adak'
    | 'Pacific/Honolulu';
  companyOwnerId: string;
  poolAddress: string;
  animalDanger: boolean;
  poolCity: string;
  enterSide: string;
  lockerCode?: string;
  monthlyPayment?: number;
  poolNotes?: string;
  poolType: 'Chlorine' | 'Salt' | 'Other';
  poolState: string;
  poolZip: string;
  poolAddressLine2?: string;
  bodyOfWater?: string | null;
}[];

export function useCreateManyClients() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateManyClientsInput) => {
      const response = await clientAxios.post('/clients/many', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['allClients'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });

      toast({
        duration: 5000,
        title: 'Clients added successfully',
        variant: 'success'
      });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      throw error.response?.data?.message || 'Error creating clients';
    }
  });
}
