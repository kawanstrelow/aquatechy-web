'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { Building2, FileText, Mail, CreditCard, ClipboardList } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { CompanyInformationTab } from '@/app/(authenticated)/invoices/settings/components/CompanyInformationTab';
import { DefaultValuesTab } from '@/app/(authenticated)/invoices/settings/components/DefaultValuesTab';
import { CommunicationTab } from '@/app/(authenticated)/invoices/settings/components/CommunicationTab';
import { EstimateCommunicationTab } from '@/app/(authenticated)/invoices/settings/components/EstimateCommunicationTab';
import { OnlinePaymentsTab } from '@/app/(authenticated)/invoices/settings/components/OnlinePaymentsTab';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import {
  Company,
  CompanyWithMyRole,
  InvoiceCompanyInformation,
  InvoiceDefaultValues,
  InvoiceCommunication,
  EstimateCommunication
} from '@/ts/interfaces/Company';

interface InvoiceSettingsFormData {
  company: InvoiceCompanyInformation;
  defaults: InvoiceDefaultValues;
  communication: InvoiceCommunication;
  estimateCommunication: EstimateCommunication;
}

const createDefaultFormValues = (company?: Company): InvoiceSettingsFormData => ({
  company: {
    replyToEmail:
      company?.preferences?.invoiceSettingsPreferences?.companyInformation?.replyToEmail ??
      company?.email ??
      null
  },
  defaults: {
    paymentInstructions: company?.preferences?.invoiceSettingsPreferences?.defaultValues?.paymentInstructions ?? null,
    notes: company?.preferences?.invoiceSettingsPreferences?.defaultValues?.notes ?? null,
    defaultFrequency: company?.preferences?.invoiceSettingsPreferences?.defaultValues?.defaultFrequency ?? null,
    defaultPaymentTerm: company?.preferences?.invoiceSettingsPreferences?.defaultValues?.defaultPaymentTerm ?? null
  },
  communication: {
    invoiceMessage: company?.preferences?.invoiceSettingsPreferences?.communication?.invoiceMessage ?? null,
    thankYouMessage: company?.preferences?.invoiceSettingsPreferences?.communication?.thankYouMessage ?? null,
    reminderMessage: company?.preferences?.invoiceSettingsPreferences?.communication?.reminderMessage ?? null
  },
  estimateCommunication: {
    estimateMessage: company?.preferences?.estimateSettingsPreferences?.communication?.estimateMessage ?? null,
    acceptedNotificationMessage:
      company?.preferences?.estimateSettingsPreferences?.communication?.acceptedNotificationMessage ?? null,
    declinedNotificationMessage:
      company?.preferences?.estimateSettingsPreferences?.communication?.declinedNotificationMessage ?? null
  }
});

const VALID_INVOICE_TABS = ['company', 'defaults', 'communication', 'estimates', 'payments'] as const;
type InvoiceTab = (typeof VALID_INVOICE_TABS)[number];

function parseInvoiceTab(value: string | null): InvoiceTab {
  if (value && VALID_INVOICE_TABS.includes(value as InvoiceTab)) {
    return value as InvoiceTab;
  }
  return 'company';
}

const tabTriggerClassName =
  'flex-1 min-w-[45%] sm:min-w-0 flex items-center justify-center gap-2 rounded-md px-2 py-2 text-sm transition-all data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700';

interface InvoiceSettingsCardProps {
  company: Company;
}

export function InvoiceSettingsCard({ company }: InvoiceSettingsCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: companies = [] } = useGetCompanies();
  const previousCompanyIdRef = useRef(company.id);

  const companyWithRole: CompanyWithMyRole | undefined = companies.find((c) => c.id === company.id) as
    | CompanyWithMyRole
    | undefined;

  const selectedCompany: CompanyWithMyRole = companyWithRole ?? {
    ...company,
    role: undefined,
    userCompanyId: ''
  };

  const [activeTab, setActiveTab] = useState<InvoiceTab>(() => parseInvoiceTab(searchParams.get('invoiceTab')));

  useEffect(() => {
    setActiveTab(parseInvoiceTab(searchParams.get('invoiceTab')));
  }, [searchParams]);

  const form = useForm<InvoiceSettingsFormData>({
    defaultValues: createDefaultFormValues(company)
  });

  // Only reset when switching companies — not on initial mount (that races with tab loaders)
  useEffect(() => {
    if (previousCompanyIdRef.current === company.id) return;
    previousCompanyIdRef.current = company.id;
    form.reset(createDefaultFormValues(company));
  }, [company, form]);

  const handleTabChange = (value: string) => {
    const next = parseInvoiceTab(value);
    setActiveTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'preferences');
    params.set('prefsTab', 'invoice-settings');
    if (next === 'company') {
      params.delete('invoiceTab');
    } else {
      params.set('invoiceTab', next);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <FormProvider {...form}>
      <Card className="w-full border-2">
        <CardContent className="px-6 pt-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-lg bg-slate-100 p-1 text-slate-500">
              <TabsTrigger value="company" className={tabTriggerClassName}>
                <Building2 className="h-4 w-4" />
                Company Information
              </TabsTrigger>
              <TabsTrigger value="defaults" className={tabTriggerClassName}>
                <FileText className="h-4 w-4" />
                Default Values
              </TabsTrigger>
              <TabsTrigger value="communication" className={tabTriggerClassName}>
                <Mail className="h-4 w-4" />
                Communication
              </TabsTrigger>
              <TabsTrigger value="estimates" className={tabTriggerClassName}>
                <ClipboardList className="h-4 w-4" />
                Estimates
              </TabsTrigger>
              <TabsTrigger value="payments" className={tabTriggerClassName}>
                <CreditCard className="h-4 w-4" />
                Online Payments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="mt-6">
              <CompanyInformationTab companyId={company.id} />
            </TabsContent>

            <TabsContent value="defaults" className="mt-6">
              <DefaultValuesTab companyId={company.id} />
            </TabsContent>

            <TabsContent value="communication" className="mt-6">
              <CommunicationTab companyId={company.id} />
            </TabsContent>

            <TabsContent value="estimates" className="mt-6">
              <EstimateCommunicationTab companyId={company.id} userRole={selectedCompany.role} />
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <OnlinePaymentsTab selectedCompany={selectedCompany} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </FormProvider>
  );
}
