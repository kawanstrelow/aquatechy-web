'use client';

import { ArrowRight, Table } from 'lucide-react';
import Link from 'next/link';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useGetTechnicianSummary } from '@/hooks/react-query/reports/useGetTechnicianSummary';
import { cn } from '@/lib/utils';

import { borderedButtonClass, ReportHeader } from '../../_components/ReportChrome';

export default function TechniciansPage() {
  const { data: technicians, isLoading, error } = useGetTechnicianSummary();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col gap-6">
      <ReportHeader
        title="Individual technician performance"
        description="Filter cleaning performance for each technician"
        backHref="/reports/team"
        backLabel="Back to team reports"
      />

      {error ? (
        <div className="rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-danger shadow-lift">
          Error loading technician data
        </div>
      ) : !technicians || technicians.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-ink-muted shadow-lift">
          No technician data available
        </div>
      ) : (
        <div className="space-y-4">
          {technicians.map((tech) => (
            <div key={tech.id} className="overflow-hidden rounded-xl border border-line bg-surface shadow-lift">
              <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                <h2 className="text-base font-semibold text-ink">{tech.name}</h2>
                <div className="text-right">
                  <div className="text-2xl font-bold text-accent">{tech.onTimePercentage}%</div>
                  <div className="text-sm text-ink-muted">On-time rate</div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-3">
                <div className="rounded-lg border border-line bg-canvas p-4 text-center">
                  <div className="text-2xl font-bold text-accent">{tech.pools}</div>
                  <div className="text-sm text-ink-muted">Pools assigned</div>
                </div>
                <div className="rounded-lg border border-success/20 bg-success-soft p-4 text-center">
                  <div className="text-2xl font-bold text-success">
                    {Math.round((tech.onTimePercentage / 100) * tech.pools)}
                  </div>
                  <div className="text-sm text-ink-muted">On-time cleanings</div>
                </div>
                <div className="rounded-lg border border-danger/20 bg-danger-soft p-4 text-center">
                  <div className="text-2xl font-bold text-danger">{tech.overdueCount}</div>
                  <div className="text-sm text-ink-muted">Overdue cleanings</div>
                </div>
              </div>
              <div className="border-t border-line px-5 py-4">
                <Button variant="outline" className={cn(borderedButtonClass, 'w-full')} asChild>
                  <Link href={`/reports/team/technicians/${tech.id}/details`}>
                    <Table className="mr-2 h-4 w-4" />
                    View filter cleaning details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
