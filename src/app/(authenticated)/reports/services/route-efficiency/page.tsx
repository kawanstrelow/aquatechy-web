'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, Clock, Loader2, MapPin, Route, Timer, User } from 'lucide-react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Weekdays } from '@/constants';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { useGetRouteEfficiencyReport } from '@/hooks/react-query/reports/useGetRouteEfficiencyReport';
import { RouteEfficiencyReportEntry } from '@/ts/interfaces/RouteEfficiencyReport';

import { ReportHeader } from '../../_components/ReportChrome';

const fieldControlClass = 'w-full min-w-[240px] max-w-sm border border-slate-200 bg-white';

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

  return Array.from(byTech.values()).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
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
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col gap-6">
      <ReportHeader
        title="Route Efficiency Report"
        description="Planned route distance and time by technician and weekday"
        backHref="/reports/services"
        backLabel="Back to service reports"
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
                  <p className="text-sm text-gray-500">Select the company whose routes to analyze</p>
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
                Loading route summary...
              </div>
            ) : error ? null : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-xl border border-line bg-canvas p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Route className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium text-gray-600">Routes</span>
                  </div>
                  <p className="text-3xl font-bold text-accent">{companyTotals.routes}</p>
                </div>

                <div className="rounded-xl border border-line bg-canvas p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium text-gray-600">Total Stops</span>
                  </div>
                  <p className="text-3xl font-bold text-accent">{companyTotals.stopCount}</p>
                </div>

                <div className="rounded-xl border border-line bg-canvas p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium text-gray-600">Total Distance</span>
                  </div>
                  <p className="text-3xl font-bold text-accent">{formatDistance(companyTotals.totalDistanceInMiles)}</p>
                </div>

                <div className="rounded-xl border border-line bg-canvas p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Timer className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium text-gray-600">Drive Time</span>
                  </div>
                  <p className="text-3xl font-bold text-accent">
                    {formatDriveTime(companyTotals.totalDriveTimeInMinutes)}
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-canvas p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium text-gray-600">Total route time (driving + stops)</span>
                  </div>
                  <p className="text-3xl font-bold text-accent">
                    {formatDriveTime(companyTotals.totalRouteTimeInMinutes)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {!selectedCompany || isLoadingReportData ? null : error ? (
        <Card className="border-line bg-surface shadow-lift">
          <CardContent className="py-8 text-center">
            <p className="text-danger">Error loading route efficiency report</p>
          </CardContent>
        </Card>
      ) : technicianGroups.length === 0 ? (
        <Card className="border-line bg-surface shadow-lift">
          <CardContent className="py-8 text-center">
            <p className="text-ink-muted">No active routes for this company</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {technicianGroups.map((group) => (
            <Card key={group.id} className="overflow-hidden border-line bg-surface shadow-lift">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-accent" />
                      {group.name}
                    </CardTitle>
                    <CardDescription>
                      {group.routes.length} route{group.routes.length === 1 ? '' : 's'} · {group.totals.stopCount} stop
                      {group.totals.stopCount === 1 ? '' : 's'}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="border border-line bg-canvas text-ink">
                      {formatDistance(group.totals.totalDistanceInMiles)} total
                    </Badge>
                    <Badge variant="secondary" className="border border-line bg-canvas text-ink">
                      {formatDriveTime(group.totals.totalRouteTimeInMinutes)} route time
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-surface">
                      <tr className="border-b border-line bg-surface">
                        <th className="bg-surface p-3 text-left font-medium text-ink-muted">Weekday</th>
                        <th className="bg-surface p-3 text-left font-medium text-ink-muted">Stops</th>
                        <th className="bg-surface p-3 text-left font-medium text-ink-muted">Distance</th>
                        <th className="bg-surface p-3 text-left font-medium text-ink-muted">Drive Time</th>
                        <th className="bg-surface p-3 text-left font-medium text-ink-muted">
                          Service time (20m per stop)
                        </th>
                        <th className="bg-surface p-3 text-left font-medium text-ink-muted">
                          Total route time (driving + stops)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.routes.map((entry) => (
                        <tr
                          key={`${entry.technician.id}-${entry.weekday}`}
                          className="border-b border-line hover:bg-canvas"
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
