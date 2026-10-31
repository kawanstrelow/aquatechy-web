'use client';

import { format } from 'date-fns';
import { AlertCircle, ArrowRight, Clock, Waves } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import {
  accentButtonClassName,
  DataPanel,
  type DataPanelColumn,
  EmptyState,
  HorizontalBarChart,
  type HorizontalBarTone,
  StatusBadge,
  Surface
} from '@/components/design';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/user';

import { DashboardAfterServicePhotos } from './_components/DashboardAfterServicePhotos';
import { DashboardTechniciansProgress } from './_components/DashboardTechniciansProgress';

type UnassignedPool = {
  id: string;
  clientId: string;
  clientName: string;
  poolName: string;
  address: string;
};

function punctualityTone(percent: number): HorizontalBarTone {
  if (percent >= 90) return 'success';
  if (percent >= 80) return 'warning';
  return 'danger';
}

function overdueTone(count: number): 'success' | 'warning' | 'danger' {
  if (count === 0) return 'success';
  if (count <= 3) return 'warning';
  return 'danger';
}

const poolColumns: DataPanelColumn<UnassignedPool>[] = [
  {
    id: 'clientName',
    header: 'Client Name',
    className: 'font-medium',
    cell: (pool) => pool.clientName
  },
  {
    id: 'poolName',
    header: 'Pool Name',
    className: 'text-ink-muted',
    cell: (pool) => pool.poolName
  },
  {
    id: 'address',
    header: 'Address',
    className: 'text-ink-muted',
    cell: (pool) => pool.address
  }
];

export default function Page() {
  const { dashboard } = useUserStore((state) => state);
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  const { filterCleaningPunctuality, poolsWithoutAssignment, recentIssues, lastServices, techniciansProgress } =
    dashboard;
  const filterCleaningWithPools = filterCleaningPunctuality?.filter((tech) => tech.assignedPools > 0) ?? [];

  useEffect(() => {
    if (user.id && !user.firstName?.trim() && !user.lastName?.trim()) {
      router.push('/onboarding');
    }
  }, [user, router]);

  return (
    <div className="flex flex-col gap-6 pb-16">
      <DashboardAfterServicePhotos services={lastServices} />

      <div className={`grid grid-cols-1 gap-6 ${techniciansProgress ? 'xl:grid-cols-3' : 'xl:grid-cols-2'}`}>
        <DashboardTechniciansProgress techniciansProgress={techniciansProgress} className="h-full min-w-0" />

        <Surface
          title="Recent pending issues"
          icon={AlertCircle}
          className="h-full min-w-0"
          bodyClassName="p-0"
          action={
            <Button size="sm" className={accentButtonClassName} onClick={() => router.push('/requests')}>
              All requests
              <ArrowRight className="h-4 w-4" />
            </Button>
          }
        >
          {!recentIssues?.length ? (
            <EmptyState
              title="No pending issues yet"
              description="Issues will appear here as your team reports them during service visits."
            />
          ) : (
            <ul className="divide-y divide-line">
              {recentIssues.map((issue) => (
                <li key={issue.id} className="px-5 py-3">
                  <p className="truncate text-sm font-medium text-ink">{issue.client}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {format(new Date(issue.date), 'MMM dd, yyyy hh:mma')}
                    <span className="mx-1.5">·</span>
                    {issue.technician}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{issue.description}</p>
                </li>
              ))}
            </ul>
          )}
        </Surface>

        <Surface
          title="Filter cleaning punctuality"
          icon={Clock}
          className="h-full min-w-0"
          action={
            <Button size="sm" className={accentButtonClassName} onClick={() => router.push('/reports/team')}>
              All reports
              <ArrowRight className="h-4 w-4" />
            </Button>
          }
        >
          <HorizontalBarChart
            items={filterCleaningWithPools.map((tech) => ({
              id: tech.id,
              label: tech.technician,
              value: tech.onTimePercentage,
              valueLabel: `${tech.onTimePercentage}%`,
              tone: punctualityTone(tech.onTimePercentage),
              detail: (
                <span className="flex items-center gap-2">
                  <StatusBadge tone={overdueTone(tech.overdueCount)}>{tech.overdueCount} overdue</StatusBadge>
                  <span className="text-sm text-ink-muted">{tech.assignedPools} pools</span>
                </span>
              )
            }))}
            empty={
              <EmptyState
                className="px-0 py-6"
                title="No filter cleaning data yet"
                description="Performance metrics will appear here once your technicians start completing filter cleanings."
              />
            }
          />
        </Surface>
      </div>

      <DataPanel
        title="Pools without assignment"
        icon={Waves}
        action={
          <Button size="sm" className={accentButtonClassName} onClick={() => router.push('/clients')}>
            All clients
            <ArrowRight className="h-4 w-4" />
          </Button>
        }
        columns={poolColumns}
        rows={poolsWithoutAssignment}
        getRowKey={(pool) => pool.id}
        onRowClick={(pool) => router.push(`/clients/${pool.clientId}`)}
        emptyTitle="All pools have assignments"
        emptyDescription="Great! All your pools are currently assigned to technicians."
      />
    </div>
  );
}
