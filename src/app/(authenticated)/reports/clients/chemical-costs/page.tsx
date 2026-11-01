'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Building2, Calendar, Download, Loader2, Users } from 'lucide-react';

import { MultiSelect, OptionType } from '@/components/MultiSelect';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import useGetAllClients from '@/hooks/react-query/clients/getAllClients';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { useGenerateChemicalCostsReport } from '@/hooks/react-query/reports/useGenerateChemicalCostsReport';

import { ReportHeader } from '../../_components/ReportChrome';

const fieldControlClass = 'w-full border border-slate-200 bg-white text-ink shadow-none hover:bg-slate-50';

export default function ChemicalCostsReportPage() {
  const t = useTranslations('reports');
  const { toast } = useToast();
  const { data: companies = [], isLoading: isLoadingCompanies } = useGetCompanies();
  const { data: allClients = [], isLoading: isLoadingClients } = useGetAllClients();
  const generateReportMutation = useGenerateChemicalCostsReport();

  // Default date range: last 30 days
  const defaultFrom = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<Date | undefined>(defaultFrom);
  const [toDate, setToDate] = useState<Date | undefined>(new Date());

  // Filter clients by selected company - only show clients that belong to the selected company
  const filteredClients = useMemo(() => {
    if (!selectedCompany || !allClients || allClients.length === 0) return [];

    const filtered = allClients.filter((client) => {
      // Match by companyOwnerId
      return client.companyOwner?.id === selectedCompany;
    });

    return filtered;
  }, [allClients, selectedCompany]);

  // Client options for MultiSelect
  const clientOptions: OptionType[] = useMemo(() => {
    return filteredClients.map((client) => ({
      label: `${client.firstName} ${client.lastName}${client.customerCode ? ` (${client.customerCode})` : ''}`,
      value: client.id
    }));
  }, [filteredClients]);

  // Handle select all clients
  const handleSelectAllClients = (checked: boolean) => {
    if (checked) {
      setSelectedClientIds(filteredClients.map((client) => client.id));
    } else {
      setSelectedClientIds([]);
    }
  };

  // Check if all clients are selected
  const allClientsSelected = useMemo(() => {
    return filteredClients.length > 0 && selectedClientIds.length === filteredClients.length;
  }, [filteredClients.length, selectedClientIds.length]);

  // Reset client selection when company changes
  useEffect(() => {
    setSelectedClientIds([]);
  }, [selectedCompany]);

  // Handle form submission
  const handleGenerateReport = async () => {
    if (!selectedCompany) {
      toast({
        variant: 'destructive',
        title: t('chemicalCosts.companyRequired'),
        description: t('chemicalCosts.companyRequiredDescription')
      });
      return;
    }

    if (selectedClientIds.length === 0) {
      toast({
        variant: 'destructive',
        title: t('chemicalCosts.clientsRequired'),
        description: t('chemicalCosts.clientsRequiredDescription')
      });
      return;
    }

    if (!fromDate || !toDate) {
      toast({
        variant: 'destructive',
        title: t('chemicalCosts.dateRangeRequired'),
        description: t('chemicalCosts.dateRangeRequiredDescription')
      });
      return;
    }

    if (fromDate > toDate) {
      toast({
        variant: 'destructive',
        title: t('chemicalCosts.invalidDateRange'),
        description: t('chemicalCosts.invalidDateRangeDescription')
      });
      return;
    }

    try {
      await generateReportMutation.mutateAsync({
        from: fromDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        to: toDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        companyId: selectedCompany,
        clientIds: selectedClientIds
      });

      toast({
        variant: 'success',
        title: t('chemicalCosts.generated'),
        description: t('chemicalCosts.generatedDescription'),
        duration: 3000
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('chemicalCosts.generateError'),
        description: error?.message || t('chemicalCosts.generateErrorDescription')
      });
    }
  };

  const isLoading = isLoadingCompanies || isLoadingClients || generateReportMutation.isPending;
  const isFormValid = selectedCompany && selectedClientIds.length > 0 && fromDate && toDate;

  return (
    <div className="flex flex-col gap-6">
      <ReportHeader
        title={t('chemicalCosts.title')}
        description={t('chemicalCosts.description')}
        backHref="/reports/clients"
        backLabel={t('back.clientReports')}
      />

      <div className="rounded-xl border border-line bg-surface p-5 shadow-lift sm:p-6">
        <div className="mb-6 space-y-1">
          <h2 className="text-base font-semibold text-ink">{t('chemicalCosts.configuration')}</h2>
          <p className="text-sm text-ink-muted">{t('chemicalCosts.configurationHint')}</p>
        </div>
        <div className="space-y-6">
          {/* Company Selection */}
          <div className="space-y-2">
            <Label htmlFor="company" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {t('chemicalCosts.company')} <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany} disabled={isLoadingCompanies}>
              <SelectTrigger id="company" className={fieldControlClass}>
                <SelectValue placeholder={t('chemicalCosts.selectCompany')} />
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

          {/* Client Selection */}
          {selectedCompany && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="clients" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('chemicalCosts.clients')} <span className="text-red-500">*</span>
                </Label>
                {!isLoadingClients && filteredClients.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all-clients"
                      checked={allClientsSelected}
                      onCheckedChange={handleSelectAllClients}
                    />
                    <Label htmlFor="select-all-clients" className="cursor-pointer text-sm font-normal">
                      {t('chemicalCosts.selectAll', { count: filteredClients.length })}
                    </Label>
                  </div>
                )}
              </div>
              {isLoadingClients ? (
                <div className="flex flex-col items-center justify-center space-y-2 py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  <p className="text-sm text-slate-500">{t('chemicalCosts.loadingClients')}</p>
                </div>
              ) : !allClients || allClients.length === 0 ? (
                <Alert className="border-line bg-canvas text-ink">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('chemicalCosts.noClientsTitle')}</AlertTitle>
                  <AlertDescription>{t('chemicalCosts.noClientsDescription')}</AlertDescription>
                </Alert>
              ) : filteredClients.length === 0 ? (
                <Alert className="border-line bg-canvas text-ink">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('chemicalCosts.noClientsForCompanyTitle')}</AlertTitle>
                  <AlertDescription>
                    {t('chemicalCosts.noClientsForCompanyDescription', {
                      company: companies.find((c) => c.id === selectedCompany)?.name || selectedCompany
                    })}
                  </AlertDescription>
                </Alert>
              ) : (
                <MultiSelect
                  options={clientOptions}
                  selected={selectedClientIds}
                  onChange={setSelectedClientIds}
                  placeholder={t('chemicalCosts.selectClients')}
                  disabled={isLoadingClients}
                />
              )}
              {selectedClientIds.length > 0 && (
                <p className="text-sm text-ink-muted">
                  {t('chemicalCosts.clientsSelected', { count: selectedClientIds.length })}
                </p>
              )}
            </div>
          )}

          {/* Date Range Selection */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('chemicalCosts.fromDate')} <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                value={fromDate}
                onChange={setFromDate}
                disabled={toDate ? [{ after: toDate }] : [{ after: new Date() }]}
                placeholder={t('chemicalCosts.selectFromDate')}
                className={fieldControlClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('chemicalCosts.toDate')} <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                value={toDate}
                onChange={setToDate}
                disabled={[...(fromDate ? [{ before: fromDate }] : []), { after: new Date() }]}
                placeholder={t('chemicalCosts.selectToDate')}
                className={fieldControlClass}
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateReport}
            disabled={isLoading || !isFormValid}
            className="w-full border border-accent"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('chemicalCosts.generating')}
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {t('chemicalCosts.generate')}
              </>
            )}
          </Button>

          {/* Info Alert */}
          <Alert className="border-line bg-canvas text-ink">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('chemicalCosts.infoTitle')}</AlertTitle>
            <AlertDescription>{t('chemicalCosts.infoDescription')}</AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
