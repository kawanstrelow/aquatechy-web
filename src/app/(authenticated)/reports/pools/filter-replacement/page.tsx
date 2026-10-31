'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Building2, Calendar, CheckCircle2, Filter, Loader2, MapPin, Waves } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { useGetPoolFilterReplacementReport } from '@/hooks/react-query/reports/useGetPoolFilterReplacementReport';
import { PoolFilterReplacementReportRow } from '@/ts/interfaces/PoolFilterReplacementReport';

import { ReportHeader } from '../../_components/ReportChrome';

const fieldControlClass = 'w-full min-w-[240px] max-w-sm border border-slate-200 bg-white';

function isFilterReplacementOverdue(row: PoolFilterReplacementReportRow): boolean {
  if (!row.nextFilterReplacementDate) return row.lastFilterReplacementDate === null;
  return new Date(row.nextFilterReplacementDate) < new Date();
}

function getOverdueDays(nextFilterReplacementDate: string | null): number {
  if (!nextFilterReplacementDate) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(nextFilterReplacementDate);
  next.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - next.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

function getDaysUntilNext(nextFilterReplacementDate: string | null): number | null {
  if (nextFilterReplacementDate === null) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(nextFilterReplacementDate);
  next.setHours(0, 0, 0, 0);
  const diffTime = next.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getFullAddress(address: string, city: string, state: string, zip: string) {
  return `${address}, ${city}, ${state} ${zip}`;
}

function formatDate(dateString: string | null, emptyLabel: string) {
  if (dateString === null) return emptyLabel;
  return format(new Date(dateString), 'MMM dd, yyyy');
}

function sortReportRows(rows: PoolFilterReplacementReportRow[]) {
  return [...rows].sort((a, b) => {
    const aOverdue = isFilterReplacementOverdue(a);
    const bOverdue = isFilterReplacementOverdue(b);

    if (aOverdue !== bOverdue) {
      return aOverdue ? 1 : -1;
    }

    if (!aOverdue) {
      const aDaysUntil = getDaysUntilNext(a.nextFilterReplacementDate);
      const bDaysUntil = getDaysUntilNext(b.nextFilterReplacementDate);

      if (aDaysUntil !== null && bDaysUntil !== null && aDaysUntil !== bDaysUntil) {
        return bDaysUntil - aDaysUntil;
      }

      const aLast = a.lastFilterReplacementDate ? new Date(a.lastFilterReplacementDate).getTime() : 0;
      const bLast = b.lastFilterReplacementDate ? new Date(b.lastFilterReplacementDate).getTime() : 0;
      return bLast - aLast;
    }

    if (a.lastFilterReplacementDate === null && b.lastFilterReplacementDate !== null) return 1;
    if (b.lastFilterReplacementDate === null && a.lastFilterReplacementDate !== null) return -1;

    return getOverdueDays(a.nextFilterReplacementDate) - getOverdueDays(b.nextFilterReplacementDate);
  });
}

export default function FilterReplacementReportPage() {
  const { data: companies = [], isLoading: isLoadingCompanies } = useGetCompanies();
  const [selectedCompany, setSelectedCompany] = useState('');

  useEffect(() => {
    if (companies.length === 1 && !selectedCompany) {
      setSelectedCompany(companies[0].id);
    }
  }, [companies, selectedCompany]);

  const { data, isLoading: isLoadingReport, error } = useGetPoolFilterReplacementReport(selectedCompany);

  const reportRows = useMemo(() => data?.data?.report ?? [], [data?.data?.report]);
  const sortedReportRows = useMemo(() => sortReportRows(reportRows), [reportRows]);

  const onTimeCount = reportRows.filter(
    (row) => row.nextFilterReplacementDate && !isFilterReplacementOverdue(row)
  ).length;
  const overdueCount = reportRows.filter((row) => isFilterReplacementOverdue(row)).length;

  const getStatusBadge = (row: PoolFilterReplacementReportRow) => {
    if (isFilterReplacementOverdue(row)) {
      return <Badge variant="destructive">Overdue</Badge>;
    }

    return (
      <Badge variant="default" className="border border-success/20 bg-success-soft text-success">
        On Time
      </Badge>
    );
  };

  const isLoadingReportData = !!selectedCompany && isLoadingReport;
  const selectedCompanyName = companies.find((company) => company.id === selectedCompany)?.name;

  if (isLoadingCompanies) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col gap-6">
      <ReportHeader
        title="Filter Replacement Interval"
        description="Filter replacement schedule for all pools in the selected company"
        backHref="/reports/pools"
        backLabel="Back to pool reports"
      />

      <Card className="overflow-hidden border-line bg-surface shadow-lift">
        <div className="border-b border-line bg-surface px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white">
                <Building2 className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0 space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Company</p>
                  <p className="text-sm text-gray-500">Choose which company pools to include in this report</p>
                </div>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger id="company" className={fieldControlClass}>
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
            </div>

            {selectedCompany && selectedCompanyName && (
              <div className="rounded-lg border border-line bg-canvas px-4 py-3 lg:min-w-[240px]">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Viewing</p>
                <p className="mt-1 truncate text-sm font-semibold text-gray-900">{selectedCompanyName}</p>
              </div>
            )}
          </div>
        </div>

        {selectedCompany && (
          <CardContent className="pt-6">
            {isLoadingReportData ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading report summary...
              </div>
            ) : error ? null : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-line bg-canvas p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Waves className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium text-gray-600">Total Pools</span>
                  </div>
                  <p className="text-3xl font-bold text-accent">{reportRows.length}</p>
                </div>

                <div className="rounded-xl border border-success/20 bg-success-soft p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">On Time</span>
                  </div>
                  <p className="text-3xl font-bold text-green-600">{onTimeCount}</p>
                </div>

                <div className="rounded-xl border border-danger/20 bg-danger-soft p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-gray-600">Overdue</span>
                  </div>
                  <p className="text-3xl font-bold text-red-600">{overdueCount}</p>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {!selectedCompany || isLoadingReportData ? null : error ? (
        <Card className="border-line bg-surface shadow-lift">
          <CardContent className="py-8 text-center">
            <p className="text-danger">Error loading filter replacement report</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-line bg-surface shadow-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-accent" />
              Filter Replacement Schedule
            </CardTitle>
            <CardDescription>All pools for the selected company and their filter replacement status</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedReportRows.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500">No filter replacement data available for this company</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-surface">
                    <tr className="border-b border-line bg-surface">
                      <th className="bg-surface p-3 text-left font-medium text-ink-muted">Client</th>
                      <th className="bg-surface p-3 text-left font-medium text-ink-muted">Address</th>
                      <th className="bg-surface p-3 text-left font-medium text-ink-muted">Filter Model</th>
                      <th className="bg-surface p-3 text-left font-medium text-ink-muted">Condition</th>
                      <th className="bg-surface p-3 text-left font-medium text-ink-muted">Last Replacement</th>
                      <th className="bg-surface p-3 text-left font-medium text-ink-muted">Next Replacement</th>
                      <th className="bg-surface p-3 text-left font-medium text-ink-muted">Days Until</th>
                      <th className="bg-surface p-3 text-left font-medium text-ink-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedReportRows.map((row) => {
                      const overdueDays = getOverdueDays(row.nextFilterReplacementDate);
                      const daysUntil = getDaysUntilNext(row.nextFilterReplacementDate);

                      return (
                        <tr key={row.poolId} className="border-b border-line hover:bg-canvas">
                          <td className="p-3">
                            <Link href={`/clients/${row.clientId}`} className="font-medium text-accent hover:underline">
                              {row.clientName}
                            </Link>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                              <span className="text-sm">
                                {getFullAddress(row.address, row.city, row.state, row.zip)}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-sm">{row.filterModel ?? '—'}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm">{row.filterCondition ?? '—'}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{formatDate(row.lastFilterReplacementDate, 'Not set')}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{formatDate(row.nextFilterReplacementDate, 'Unknown')}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            {row.nextFilterReplacementDate ? (
                              <span
                                className={`text-sm font-medium ${
                                  overdueDays > 0
                                    ? 'text-red-600'
                                    : daysUntil !== null && daysUntil <= 3
                                      ? 'text-yellow-600'
                                      : 'text-green-600'
                                }`}
                              >
                                {overdueDays > 0 ? `${overdueDays} days overdue` : `${daysUntil} days`}
                              </span>
                            ) : (
                              <span className="text-sm font-medium text-gray-500">Unknown</span>
                            )}
                          </td>
                          <td className="p-3">{getStatusBadge(row)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
