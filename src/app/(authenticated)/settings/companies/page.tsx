'use client';

import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CompanyCard } from '@/app/(authenticated)/settings/companies/team/CompanyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { useUserStore } from '@/store/user';
import { CompanyWithMyRole } from '@/ts/interfaces/Company';

export default function Page() {
  const user = useUserStore((state) => state.user);
  const { data: companies } = useGetCompanies();

  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const filteredCompanies = companies?.filter((company: CompanyWithMyRole) =>
    `${company.name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [user, router]);

  return (
    <div>
      <div className="mb-3 overflow-hidden rounded-xl border border-line bg-surface px-5 py-4 shadow-lift">
        <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center">
          <Button onClick={() => router.push('/settings/companies/team/add-company')}>
            <PlusIcon className="mr-2" />
            Add company
          </Button>

          <Input
            placeholder="Filter by name..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full min-w-0 md:flex-1"
          />
        </div>
      </div>

      <div>
        <div className="flex flex-wrap justify-center gap-2 self-stretch md:justify-normal">
          {filteredCompanies && (
            <div className="flex w-full flex-col gap-2 md:flex-row md:flex-wrap md:justify-start">
              {filteredCompanies.map((company: CompanyWithMyRole) => (
                <CompanyCard
                  key={company.id}
                  name={company.name}
                  email={company.email}
                  phone={company.phone}
                  companyId={company.id}
                  role={company.role}
                  status={company.status}
                  imageUrl={company.imageUrl}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
