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

type RecentIssue = {
  id: string;
  client: string;
  date: Date;
  technician: string;
  description: string;
};

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

const issueColumns: DataPanelColumn<RecentIssue>[] = [
  {
    id: 'client',
    header: 'Client',
    className: 'font-medium',
    cell: (issue) => issue.client
  },
  {
    id: 'date',
    header: 'Date',
    className: 'text-ink-muted',
    cell: (issue) => format(new Date(issue.date), 'MMM dd, yyyy hh:mma')
  },
  {
    id: 'technician',
    header: 'Technician',
    className: 'text-ink-muted',
    cell: (issue) => issue.technician
  },
  {
    id: 'description',
    header: 'Description',
    className: 'text-ink-muted',
    cell: (issue) => issue.description
  }
];

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
      <DashboardTechniciansProgress techniciansProgress={techniciansProgress} />

      <DataPanel
        title="Recent pending issues"
        icon={AlertCircle}
        action={
          <Button size="sm" className={accentButtonClassName} onClick={() => router.push('/requests')}>
            All requests
            <ArrowRight className="h-4 w-4" />
          </Button>
        }
        columns={issueColumns}
        rows={recentIssues}
        getRowKey={(issue) => issue.id}
        emptyTitle="No pending issues yet"
        emptyDescription="Issues will appear here as your team reports them during service visits."
      />

      <Surface
        title="Filter cleaning punctuality"
        icon={Clock}
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
