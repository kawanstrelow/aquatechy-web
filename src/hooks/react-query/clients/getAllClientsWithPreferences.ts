import { useQuery } from '@tanstack/react-query';
import { clientAxios } from '@/lib/clientAxios';
import { Client } from '@/ts/interfaces/Client';
import { getClientCompanyOwnerId } from '@/utils/clientUtils';

function normalizeClient(client: Client): Client {
  const companyOwnerId = getClientCompanyOwnerId(client);

  return {
    ...client,
    fullName: client.fullName || `${client.firstName} ${client.lastName}`.trim(),
    companyOwnerId
  };
}

export default function useGetAllClientsWithPreferences() {
  return useQuery({
    queryKey: ['allClientsWithPreferences'],
    queryFn: async () => {
      const response = await clientAxios.get('/clients/all-with-preferences');
      const clients: Client[] = response.data?.clients || [];

      return clients.map(normalizeClient);
    }
  });
}
