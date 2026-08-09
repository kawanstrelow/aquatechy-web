'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserStore } from '@/store/user';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { CompanyWithMyRole } from '@/ts/interfaces/Company';

import { CompanyInformationTab } from './components/CompanyInformationTab';
import { DefaultValuesTab } from './components/DefaultValuesTab';
import { CommunicationTab } from './components/CommunicationTab';
import { OnlinePaymentsTab } from './components/OnlinePaymentsTab';
import {
  InvoiceCompanyInformation,
  InvoiceDefaultValues,
  InvoiceCommunication,
  EstimateCommunication
} from '@/ts/interfaces/Company';

import { EstimateCommunicationTab } from './components/EstimateCommunicationTab';

interface InvoiceSettingsFormData {
  company: InvoiceCompanyInformation;
  defaults: InvoiceDefaultValues;
  communication: InvoiceCommunication;
  estimateCommunication: EstimateCommunication;
}

const createDefaultFormValues = (): InvoiceSettingsFormData => ({
  company: {
    replyToEmail: null
  },
  defaults: {
    paymentInstructions: null,
    notes: null,
    defaultFrequency: null,
    defaultPaymentTerm: null
  },
  communication: {
    invoiceMessage: null,
    thankYouMessage: null,
    reminderMessage: null
  },
  estimateCommunication: {
    estimateMessage: null,
    acceptedNotificationMessage: null,
    declinedNotificationMessage: null
  }
});

const VALID_TABS = ['company', 'defaults', 'communication', 'estimates', 'payments'] as const;

function InvoiceSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUserStore((state) => state.user);
  const { data: companies = [], isLoading: isLoadingCompanies } = useGetCompanies();
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithMyRole | null>(null);
  const tabFromUrl = searchParams.get('tab');
  const tabFromParams =
    tabFromUrl && VALID_TABS.includes(tabFromUrl as (typeof VALID_TABS)[number])
      ? tabFromUrl
      : 'company';
  const [activeTab, setActiveTab] = useState<(typeof VALID_TABS)[number]>(
    tabFromParams as (typeof VALID_TABS)[number]
  );

  useEffect(() => {
    setActiveTab(tabFromParams as (typeof VALID_TABS)[number]);
  }, [tabFromParams]);

  // Ensure we always have a valid company selected when companies list changes
  useEffect(() => {
    if (companies.length === 0) {
      setSelectedCompany(null);
      return;
    }

    if (!selectedCompany || !companies.some((company) => company.id === selectedCompany.id)) {
      setSelectedCompany(companies[0]);
    }
  }, [companies, selectedCompany]);

  const form = useForm<InvoiceSettingsFormData>({
    defaultValues: createDefaultFormValues()
  });

  // Reset form state when switching companies so tab components can load fresh data
  useEffect(() => {
    form.reset(createDefaultFormValues());
  }, [selectedCompany?.id, form]);

  const handleCompanyChange = (companyId: string) => {
    const company = companies.find((item) => item.id === companyId);
    if (company) {
      setSelectedCompany(company);
    }
  };

  // Note: Form values are loaded by individual tab components to ensure fresh data
  // when switching tabs or companies. This prevents stale data issues.

  // Auth check
  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [user, router]);

  if (isLoadingCompanies) {
    return <LoadingSpinner />;
  }

  const hasCompanies = companies.length > 0;

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-6 p-2">
        <h1 className="text-2xl font-bold">Invoice Settings</h1>

        {!hasCompanies ? (
          <p className="text-sm text-slate-600">No companies available. Create a company to manage invoice settings.</p>
        ) : (
          <>
            <div className="w-full">
              <Select value={selectedCompany?.id ?? ''} onValueChange={handleCompanyChange}>
                  <SelectTrigger className="w-full">
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
              <Tabs
                key={selectedCompany.id}
                value={activeTab}
                onValueChange={(v) => {
                  const next = v as (typeof VALID_TABS)[number];
                  setActiveTab(next);
                  router.push(`/invoices/settings?tab=${next}`);
                }}
                className="w-full"
              >
                <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500">
                  <TabsTrigger
                    value="company"
                    className="inline-flex items-center justify-center rounded-md px-3 py-1 text-sm transition-all data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow"
                  >
                    Company Information
                  </TabsTrigger>
                  <TabsTrigger
                    value="defaults"
                    className="inline-flex items-center justify-center rounded-md px-3 py-1 text-sm transition-all data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow"
                  >
                    Default Values
                  </TabsTrigger>
                  <TabsTrigger
                    value="communication"
                    className="inline-flex items-center justify-center rounded-md px-3 py-1 text-sm transition-all data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow"
                  >
                    Communication
                  </TabsTrigger>
                  <TabsTrigger
                    value="estimates"
                    className="inline-flex items-center justify-center rounded-md px-3 py-1 text-sm transition-all data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow"
                  >
                    Estimates
                  </TabsTrigger>
                  <TabsTrigger
                    value="payments"
                    className="inline-flex items-center justify-center rounded-md px-3 py-1 text-sm transition-all data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow"
                  >
                    Online Payments
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="company" className="mt-6">
                  <CompanyInformationTab companyId={selectedCompany?.id} />
                </TabsContent>

                <TabsContent value="defaults" className="mt-6">
                  <DefaultValuesTab companyId={selectedCompany?.id} />
                </TabsContent>

                <TabsContent value="communication" className="mt-6">
                  <CommunicationTab companyId={selectedCompany?.id} />
                </TabsContent>

                <TabsContent value="estimates" className="mt-6">
                  <EstimateCommunicationTab companyId={selectedCompany?.id} userRole={selectedCompany?.role} />
                </TabsContent>

                <TabsContent value="payments" className="mt-6">
                  <OnlinePaymentsTab selectedCompany={selectedCompany} />
                </TabsContent>
              </Tabs>
            ) : (
              <LoadingSpinner />
            )}
          </>
        )}
      </div>
    </FormProvider>
  );
}

export default function InvoiceSettingsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <InvoiceSettingsContent />
    </Suspense>
  );
}
