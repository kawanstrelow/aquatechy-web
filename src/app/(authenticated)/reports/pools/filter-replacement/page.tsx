'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, Calendar, CheckCircle2, AlertTriangle, Filter, Loader2, MapPin, Table, Waves } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { useGetPoolFilterReplacementReport } from '@/hooks/react-query/reports/useGetPoolFilterReplacementReport';
import { PoolFilterReplacementReportRow } from '@/ts/interfaces/PoolFilterReplacementReport';

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
    if (a.lastFilterReplacementDate === null && b.lastFilterReplacementDate === null) {
      return getOverdueDays(b.nextFilterReplacementDate) - getOverdueDays(a.nextFilterReplacementDate);
    }

    if (a.lastFilterReplacementDate === null) return -1;
    if (b.lastFilterReplacementDate === null) return 1;

    return getOverdueDays(b.nextFilterReplacementDate) - getOverdueDays(a.nextFilterReplacementDate);
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

    return <Badge variant="default" className="bg-green-100 text-green-800">On Time</Badge>;
  };

  const isLoadingReportData = !!selectedCompany && isLoadingReport;
  const selectedCompanyName = companies.find((company) => company.id === selectedCompany)?.name;

  if (isLoadingCompanies) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/reports/pools">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pool Reports
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Table className="h-6 w-6 text-[#364D9D]" />
          Filter Replacement Interval
        </h1>
        <p className="text-gray-600 mt-2">
          Filter replacement schedule for all pools in the selected company
        </p>
      </div>

      <Card className="mb-6 overflow-hidden">
        <div className="border-b bg-slate-50 px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                <Building2 className="h-4 w-4 text-[#364D9D]" />
              </div>
              <div className="min-w-0 space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Company</p>
                  <p className="text-sm text-gray-500">Choose which company pools to include in this report</p>
                </div>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger id="company" className="w-full min-w-[240px] max-w-sm bg-white">
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
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 lg:min-w-[240px]">
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
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Waves className="h-4 w-4 text-[#364D9D]" />
                    <span className="text-sm font-medium text-gray-600">Total Pools</span>
                  </div>
                  <p className="text-3xl font-bold text-[#364D9D]">{reportRows.length}</p>
                </div>

                <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">On Time</span>
                  </div>
                  <p className="text-3xl font-bold text-green-600">{onTimeCount}</p>
                </div>

                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
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
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-red-600">Error loading filter replacement report</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-[#364D9D]" />
              Filter Replacement Schedule
            </CardTitle>
            <CardDescription>
              All pools for the selected company and their filter replacement status
            </CardDescription>
          </CardHeader>
          <CardContent>
              {sortedReportRows.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No filter replacement data available for this company</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-3 font-medium text-gray-600">Client</th>
                        <th className="text-left p-3 font-medium text-gray-600">Address</th>
                        <th className="text-left p-3 font-medium text-gray-600">Filter Model</th>
                        <th className="text-left p-3 font-medium text-gray-600">Condition</th>
                        <th className="text-left p-3 font-medium text-gray-600">Last Replacement</th>
                        <th className="text-left p-3 font-medium text-gray-600">Next Replacement</th>
                        <th className="text-left p-3 font-medium text-gray-600">Days Until</th>
                        <th className="text-left p-3 font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedReportRows.map((row) => {
                        const overdueDays = getOverdueDays(row.nextFilterReplacementDate);
                        const daysUntil = getDaysUntilNext(row.nextFilterReplacementDate);

                        return (
                          <tr key={row.poolId} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-3">
                              <Link href={`/clients/${row.clientId}`} className="font-medium text-[#364D9D] hover:underline">
                                {row.clientName}
                              </Link>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                                <span className="text-sm">{getFullAddress(row.address, row.city, row.state, row.zip)}</span>
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
