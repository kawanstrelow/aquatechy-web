'use client';

import { PlusIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { CompanyMemberCard } from '../../CompanyMemberCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import useGetMembersOfACompany from '@/hooks/react-query/companies/getMembers';
import { Company, CompanyMember } from '@/ts/interfaces/Company';

type Props = {
  company: Company;
  actorRole?: string;
};

export function CompanyTeamTab({ company, actorRole }: Props) {
  const router = useRouter();
  const { data: members, isLoading } = useGetMembersOfACompany(company.id);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = members?.filter((member: CompanyMember) =>
    `${member.firstName + member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="w-full p-2">
      <div className="flex w-full flex-col items-start justify-start gap-2 md:flex-row md:items-center md:gap-4">
        <Button
          className="mb-2 w-full md:mb-0 md:w-auto"
          onClick={() => router.push(`/settings/companies/team/${company.id}/add-member`)}
        >
          <PlusIcon className="mr-2" />
          Add member
        </Button>

        <Input
          placeholder="Filter by name"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full min-w-0 md:flex-1"
        />
      </div>

      <div className="mt-3">
        <div className="flex flex-wrap justify-center gap-2 self-stretch md:justify-normal">
          {filteredMembers && (
            <div className="flex flex-wrap justify-start gap-2">
              {filteredMembers.map((member: CompanyMember) => (
                <CompanyMemberCard
                  status={member.status}
                  key={member.id}
                  company={member.company}
                  id={member.id}
                  firstName={member.firstName}
                  lastName={member.lastName}
                  email={member.email}
                  phone={member.phone}
                  role={member.role}
                  address={member.address}
                  city={member.city}
                  state={member.state}
                  zip={member.zip}
                  hideCompanyRow
                  actorRole={actorRole}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
