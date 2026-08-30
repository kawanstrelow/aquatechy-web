'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import useGetAllClients from '@/hooks/react-query/clients/getAllClients';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { useUserStore } from '@/store/user';
import { DataTableClients } from './DataTableClients';
import { columns } from './DataTableClients/columns';
import { Client } from '@/ts/interfaces/Client';

export default function Page() {
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const { data: allClients = [], isLoading } = useGetAllClients();
  const { data: companies = [] } = useGetCompanies();
  const user = useUserStore((state) => state.user);
  const router = useRouter();

  // Set initial filtered clients to active only
  useEffect(() => {
    if (allClients && allClients.length > 0 && filteredClients.length === 0) {
      setFilteredClients(allClients.filter((client) => client.isActive));
    }
  }, [allClients, filteredClients.length]);

  // Auth check
  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [user, router]);

  const handleFilters = (filters: any) => {
    if (!allClients) return;

    const filtered = allClients.filter((client) => {
      // Company filter
      const companyMatch =
        !filters.companyOwnerId || filters.companyOwnerId === 'all' || client.companyOwnerId === filters.companyOwnerId;

      // Search across all text fields
      const searchMatch =
        !filters.search ||
        [client.firstName, client.lastName, client.email, client.phone, client.customerCode].some((field) =>
          field?.toLowerCase().includes(filters.search.toLowerCase())
        );

      // Status filter by isActive
      const statusMatch =
        !filters.isActive ||
        filters.isActive === 'all' ||
        (filters.isActive === 'active' && client.isActive) ||
        (filters.isActive === 'inactive' && !client.isActive);

      // City filter
      const cityMatch = !filters.city || filters.city === 'all' || client.city === filters.city;

      // Type filter
      const typeMatch = !filters.type || filters.type === 'all' || client.type === filters.type;

      return companyMatch && searchMatch && statusMatch && cityMatch && typeMatch;
    });

    setFilteredClients(filtered);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-6 p-2">
      <DataTableClients columns={columns} data={filteredClients} onFiltersChange={handleFilters} />
    </div>
  );
}
