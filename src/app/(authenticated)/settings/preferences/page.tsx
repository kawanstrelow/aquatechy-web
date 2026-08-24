'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { CompanyCard } from '@/app/(authenticated)/settings/companies/team/CompanyCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { CompanyWithMyRole } from '@/ts/interfaces/Company';
import { getManagementCompanies } from '@/utils/aiChatAccess';

export default function PreferencesPage() {
  const router = useRouter();
  const { data: companies, isLoading } = useGetCompanies();

  const manageableCompanies = getManagementCompanies(companies ?? []);

  useEffect(() => {
    if (isLoading || !companies) return;
    const managementCompanies = getManagementCompanies(companies);
    if (managementCompanies.length === 1) {
      router.replace(`/settings/companies/team/${managementCompanies[0].id}?tab=preferences`);
    }
  }, [isLoading, companies, router]);

  if (isLoading || manageableCompanies.length === 1) {
    return <LoadingSpinner />;
  }

  if (manageableCompanies.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2 p-4">
        <p className="text-sm text-gray-600">
          You need to be an Owner, Admin, or Office member of a company to manage preferences.
        </p>
        <Link href="/settings/companies" className="text-sm font-medium text-blue-600 hover:underline">
          Go to Companies
        </Link>
      </div>
    );
  }

  return (
    <div className="p-2">
      <p className="mb-3 text-sm text-gray-600">Select a company to manage its preferences.</p>
      <div className="flex w-full flex-col gap-2 md:flex-row md:flex-wrap md:justify-start">
        {manageableCompanies.map((company: CompanyWithMyRole) => (
          <CompanyCard
            key={company.id}
            name={company.name}
            email={company.email}
            phone={company.phone}
            companyId={company.id}
            role={company.role}
            status={company.status}
            imageUrl={company.imageUrl}
            href={`/settings/companies/team/${company.id}?tab=preferences`}
          />
        ))}
      </div>
    </div>
  );
}
