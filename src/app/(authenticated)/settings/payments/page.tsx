'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Stripe Connect UI disabled until launch — restore OnlinePaymentsTab below.
// import { OnlinePaymentsTab } from '@/app/(authenticated)/invoices/settings/components/OnlinePaymentsTab';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { CompanyWithMyRole } from '@/ts/interfaces/Company';
import { useUserStore } from '@/store/user';

function PaymentsSettingsContent() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { data: companies = [], isLoading } = useGetCompanies();
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithMyRole | null>(null);

  useEffect(() => {
    if (companies.length === 0) {
      setSelectedCompany(null);
      return;
    }
    if (!selectedCompany || !companies.some((c) => c.id === selectedCompany.id)) {
      setSelectedCompany(companies[0]);
    }
  }, [companies, selectedCompany]);

  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [user.firstName, router]);

  const handleCompanyChange = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    if (company) setSelectedCompany(company);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="mt-1 text-sm text-slate-600">
            Online invoice payments via Stripe Connect are not enabled yet. When they are, Connect return and refresh URLs
            can use this route (e.g.{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">/settings/payments?status=return</code>
            ).
          </p>
        </div>
        <Link
          href="/invoices/settings"
          className="shrink-0 text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          Invoice branding & messaging → Invoice settings
        </Link>
      </div>

      {companies.length === 0 ? (
        <p className="text-sm text-slate-600">No companies yet. Create a company to manage billing settings.</p>
      ) : (
        <>
          <div className="w-full max-w-md">
            <Select value={selectedCompany?.id ?? ''} onValueChange={handleCompanyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCompany ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
              Stripe Connect and online payments are turned off for now. This screen will show connection status and
              onboarding when the feature is enabled again.
            </div>
          ) : (
            <LoadingSpinner />
          )}
          {/* {selectedCompany ? <OnlinePaymentsTab selectedCompany={selectedCompany} /> : <LoadingSpinner />} */}
        </>
      )}
    </div>
  );
}

export default function PaymentsSettingsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PaymentsSettingsContent />
    </Suspense>
  );
}
