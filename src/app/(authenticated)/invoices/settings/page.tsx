'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import { CompanyCard } from '@/app/(authenticated)/settings/companies/team/CompanyCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { CompanyWithMyRole } from '@/ts/interfaces/Company';

const VALID_INVOICE_TABS = ['company', 'defaults', 'communication', 'estimates', 'payments'] as const;

function canAccessCompanySettings(role: string | undefined): boolean {
  return role === 'Owner' || role === 'Admin';
}

function buildPreferencesHref(companyId: string, invoiceTab: string | null): string {
  const params = new URLSearchParams({
    tab: 'preferences',
    prefsTab: 'invoice-settings'
  });
  if (invoiceTab && VALID_INVOICE_TABS.includes(invoiceTab as (typeof VALID_INVOICE_TABS)[number]) && invoiceTab !== 'company') {
    params.set('invoiceTab', invoiceTab);
  }
  return `/settings/companies/team/${companyId}?${params.toString()}`;
}

function InvoiceSettingsRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: companies, isLoading } = useGetCompanies();
  const invoiceTab = searchParams.get('tab');

  const manageableCompanies = (companies ?? []).filter((company: CompanyWithMyRole) =>
    canAccessCompanySettings(company.role)
  );

  useEffect(() => {
    if (isLoading || !companies) return;
    const ownedOrAdmin = companies.filter((company: CompanyWithMyRole) => canAccessCompanySettings(company.role));
    if (ownedOrAdmin.length === 1) {
      router.replace(buildPreferencesHref(ownedOrAdmin[0].id, invoiceTab));
    }
  }, [isLoading, companies, router, invoiceTab]);

  if (isLoading || manageableCompanies.length === 1) {
    return <LoadingSpinner />;
  }

  if (manageableCompanies.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2 p-4">
        <p className="text-sm text-gray-600">
          You need to be an Owner or Admin of a company to manage invoice settings.
        </p>
        <Link href="/settings/companies" className="text-sm font-medium text-blue-600 hover:underline">
          Go to Companies
        </Link>
      </div>
    );
  }

  return (
    <div className="p-2">
      <h1 className="mb-1 text-2xl font-bold">Invoice Settings</h1>
      <p className="mb-3 text-sm text-gray-600">Select a company to manage its invoice settings.</p>
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
            href={buildPreferencesHref(company.id, invoiceTab)}
          />
        ))}
      </div>
    </div>
  );
}

export default function InvoiceSettingsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <InvoiceSettingsRedirectContent />
    </Suspense>
  );
}
