'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Clock,
  Loader2,
  MapPin,
  Route,
  Timer,
  User
} from 'lucide-react';
import Link from 'next/link';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Weekdays } from '@/constants';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { useGetRouteEfficiencyReport } from '@/hooks/react-query/reports/useGetRouteEfficiencyReport';
import { RouteEfficiencyReportEntry } from '@/ts/interfaces/RouteEfficiencyReport';

function formatDriveTime(minutes: number | null): string {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDistance(miles: number | null): string {
  if (miles == null) return '—';
  return `${miles.toFixed(1)} mi`;
}

function technicianDisplayName(entry: RouteEfficiencyReportEntry): string {
  return `${entry.technician.firstName} ${entry.technician.lastName}`;
}

function formatWeekday(weekday: string): string {
  return Weekdays.find((day) => day.value === weekday)?.name ?? weekday;
}

type TechnicianRouteGroup = {
  id: string;
  name: string;
  routes: RouteEfficiencyReportEntry[];
  totals: {
    stopCount: number;
    totalDistanceInMiles: number;
    totalDriveTimeInMinutes: number;
    totalServiceTimeInMinutes: number;
    totalRouteTimeInMinutes: number;
  };
};

function groupReportByTechnician(report: RouteEfficiencyReportEntry[]): TechnicianRouteGroup[] {
  const byTech = new Map<string, TechnicianRouteGroup>();

  for (const entry of report) {
    const key = entry.technician.id;
    const existing = byTech.get(key);

    if (!existing) {
      byTech.set(key, {
        id: key,
        name: technicianDisplayName(entry),
        routes: [entry],
        totals: { ...entry.summary }
      });
      continue;
    }

    existing.routes.push(entry);
    existing.totals.stopCount += entry.summary.stopCount;
    existing.totals.totalDistanceInMiles += entry.summary.totalDistanceInMiles;
    existing.totals.totalDriveTimeInMinutes += entry.summary.totalDriveTimeInMinutes;
    existing.totals.totalServiceTimeInMinutes += entry.summary.totalServiceTimeInMinutes;
    existing.totals.totalRouteTimeInMinutes += entry.summary.totalRouteTimeInMinutes;
  }

  return Array.from(byTech.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
}

export default function RouteEfficiencyReportPage() {
  const { data: companies = [], isLoading: isLoadingCompanies } = useGetCompanies();
  const [selectedCompany, setSelectedCompany] = useState('');

  useEffect(() => {
    if (companies.length === 1 && !selectedCompany) {
      setSelectedCompany(companies[0].id);
    }
  }, [companies, selectedCompany]);

  const { data, isLoading: isLoadingReport, error } = useGetRouteEfficiencyReport(selectedCompany);

  const report = useMemo(() => data?.data?.report ?? [], [data?.data?.report]);
  const technicianGroups = useMemo(() => groupReportByTechnician(report), [report]);

  const companyTotals = useMemo(
    () =>
      report.reduce(
        (acc, entry) => ({
          routes: acc.routes + 1,
          stopCount: acc.stopCount + entry.summary.stopCount,
          totalDistanceInMiles: acc.totalDistanceInMiles + entry.summary.totalDistanceInMiles,
          totalDriveTimeInMinutes: acc.totalDriveTimeInMinutes + entry.summary.totalDriveTimeInMinutes,
          totalServiceTimeInMinutes: acc.totalServiceTimeInMinutes + entry.summary.totalServiceTimeInMinutes,
          totalRouteTimeInMinutes: acc.totalRouteTimeInMinutes + entry.summary.totalRouteTimeInMinutes
        }),
        {
          routes: 0,
          stopCount: 0,
          totalDistanceInMiles: 0,
          totalDriveTimeInMinutes: 0,
          totalServiceTimeInMinutes: 0,
          totalRouteTimeInMinutes: 0
        }
      ),
    [report]
  );

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
          <Link href="/reports/services">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Service Reports
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Route className="h-6 w-6 text-orange-600" />
          Route Efficiency Report
        </h1>
        <p className="text-gray-600 mt-2">
          Overview of planned route distance and time by technician and weekday
        </p>
      </div>

      <Card className="mb-6 overflow-hidden">
        <div className="border-b bg-slate-50 px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                <Building2 className="h-4 w-4 text-orange-600" />
              </div>
              <div className="min-w-0 space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Company</p>
                  <p className="text-sm text-gray-500">Select the company whose routes to analyze</p>
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
                Loading route summary...
              </div>
            ) : error ? null : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Route className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-600">Routes</span>
                  </div>
                  <p className="text-3xl font-bold text-orange-600">{companyTotals.routes}</p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-600">Total Stops</span>
                  </div>
                  <p className="text-3xl font-bold text-orange-600">{companyTotals.stopCount}</p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-600">Total Distance</span>
                  </div>
                  <p className="text-3xl font-bold text-orange-600">
                    {formatDistance(companyTotals.totalDistanceInMiles)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Timer className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-600">Drive Time</span>
                  </div>
                  <p className="text-3xl font-bold text-orange-600">
                    {formatDriveTime(companyTotals.totalDriveTimeInMinutes)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-600">Total route time (driving + stops)</span>
                  </div>
                  <p className="text-3xl font-bold text-orange-600">
                    {formatDriveTime(companyTotals.totalRouteTimeInMinutes)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {!selectedCompany || isLoadingReportData ? null : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-red-600">Error loading route efficiency report</p>
          </CardContent>
        </Card>
      ) : technicianGroups.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">No active routes for this company</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {technicianGroups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-orange-600" />
                      {group.name}
                    </CardTitle>
                    <CardDescription>
                      {group.routes.length} route{group.routes.length === 1 ? '' : 's'} ·{' '}
                      {group.totals.stopCount} stop{group.totals.stopCount === 1 ? '' : 's'}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-orange-50 text-orange-800">
                      {formatDistance(group.totals.totalDistanceInMiles)} total
                    </Badge>
                    <Badge variant="secondary" className="bg-orange-50 text-orange-800">
                      {formatDriveTime(group.totals.totalRouteTimeInMinutes)} route time
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-3 font-medium text-gray-600">Weekday</th>
                        <th className="text-left p-3 font-medium text-gray-600">Stops</th>
                        <th className="text-left p-3 font-medium text-gray-600">Distance</th>
                        <th className="text-left p-3 font-medium text-gray-600">Drive Time</th>
                        <th className="text-left p-3 font-medium text-gray-600">Service time (20m per stop)</th>
                        <th className="text-left p-3 font-medium text-gray-600">Total route time (driving + stops)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.routes.map((entry) => (
                        <tr
                          key={`${entry.technician.id}-${entry.weekday}`}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="p-3 font-medium">{formatWeekday(entry.weekday)}</td>
                          <td className="p-3">{entry.summary.stopCount}</td>
                          <td className="p-3">{formatDistance(entry.summary.totalDistanceInMiles)}</td>
                          <td className="p-3">{formatDriveTime(entry.summary.totalDriveTimeInMinutes)}</td>
                          <td className="p-3">{formatDriveTime(entry.summary.totalServiceTimeInMinutes)}</td>
                          <td className="p-3 font-medium">{formatDriveTime(entry.summary.totalRouteTimeInMinutes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
