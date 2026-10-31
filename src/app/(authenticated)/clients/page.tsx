'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import useGetAllClients from '@/hooks/react-query/clients/getAllClients';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { useUserStore } from '@/store/user';
import { DataTableClients } from './DataTableClients';
import { columns } from './DataTableClients/columns';
import { Client } from '@/ts/interfaces/Client';

type ClientListFilters = {
  companyOwnerId?: string;
  search?: string;
  isActive?: string;
  city?: string;
  type?: string;
};

function applyClientFilters(clients: Client[], filters: ClientListFilters | null) {
  if (!filters) {
    return clients.filter((client) => client.isActive);
  }

  return clients.filter((client) => {
    const companyMatch =
      !filters.companyOwnerId || filters.companyOwnerId === 'all' || client.companyOwnerId === filters.companyOwnerId;
    const searchMatch =
      !filters.search ||
      [client.firstName, client.lastName, client.email, client.phone, client.customerCode].some((field) =>
        field?.toLowerCase().includes(filters.search!.toLowerCase())
      );
    const statusMatch =
      !filters.isActive ||
      filters.isActive === 'all' ||
      (filters.isActive === 'active' && client.isActive) ||
      (filters.isActive === 'inactive' && !client.isActive);
    const cityMatch = !filters.city || filters.city === 'all' || client.city === filters.city;
    const typeMatch = !filters.type || filters.type === 'all' || client.type === filters.type;

    return companyMatch && searchMatch && statusMatch && cityMatch && typeMatch;
  });
}

export default function Page() {
  const [filters, setFilters] = useState<ClientListFilters | null>(null);
  const { data: allClients = [], isLoading } = useGetAllClients();
  const { data: companies = [] } = useGetCompanies();
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  const filteredClients = useMemo(() => applyClientFilters(allClients, filters), [allClients, filters]);

  // Auth check
  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [user, router]);

  const handleFilters = (nextFilters: ClientListFilters) => {
    setFilters(nextFilters);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-6 p-2">
      <DataTableClients columns={columns} data={filteredClients} onFiltersChange={handleFilters} />
    </div>
  );
}
