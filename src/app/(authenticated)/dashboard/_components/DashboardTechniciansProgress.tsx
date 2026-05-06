'use client';

import { ArrowRight, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TechnicianDailyProgress } from '@/ts/interfaces/Dashboard';
import { useRouter } from 'next/navigation';

type Props = {
  techniciansProgress: TechnicianDailyProgress[] | undefined;
  compact?: boolean;
};

function segmentWidth(count: number, total: number): string {
  if (total <= 0 || count <= 0) return '0%';
  return `${(count / total) * 100}%`;
}

function StackedRouteBar({ tech }: { tech: TechnicianDailyProgress }) {
  const total = tech.totalScheduled;
  if (total <= 0) {
    return <div className="h-2.5 w-full rounded-full bg-gray-200" aria-hidden />;
  }

  const completed = tech.completedCount;
  const open = tech.openCount;
  const skipped = tech.skippedCount;

  return (
    <div
      className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-200"
      role="progressbar"
      aria-valuenow={completed}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`${completed} of ${total} visits completed`}
    >
      {completed > 0 && (
        <div className="h-full shrink-0 bg-green-500" style={{ width: segmentWidth(completed, total) }} />
      )}
      {skipped > 0 && (
        <div className="h-full shrink-0 bg-yellow-500" style={{ width: segmentWidth(skipped, total) }} />
      )}
      {open > 0 && (
        <div className="h-full shrink-0 bg-gray-400" style={{ width: segmentWidth(open, total) }} />
      )}
    </div>
  );
}

function CountPills({ tech, compact }: { tech: TechnicianDailyProgress; compact: boolean }) {
  const pill =
    compact
      ? 'rounded-full px-1.5 py-0.5 text-[10px] font-medium'
      : 'rounded-full px-2 py-1 text-xs font-medium';

  return (
    <div className={`flex flex-wrap gap-1 ${compact ? '' : 'gap-2'}`}>
      <span className={`${pill} bg-green-100 text-green-800`}>Done {tech.completedCount}</span>
      <span className={`${pill} bg-yellow-100 text-yellow-800`}>Skipped {tech.skippedCount}</span>
      <span className={`${pill} bg-gray-100 text-gray-800`}>Open {tech.openCount}</span>
    </div>
  );
}

function pctComplete(tech: TechnicianDailyProgress): number {
  const t = tech.totalScheduled;
  if (t <= 0) return 0;
  return Math.round((tech.completedCount / t) * 100);
}

export function DashboardTechniciansProgress({ techniciansProgress, compact }: Props) {
  const router = useRouter();

  if (techniciansProgress === undefined) {
    return null;
  }

  const cardShell = compact
    ? 'rounded-xl border border-gray-100 bg-white p-4 shadow-sm'
    : 'rounded-xl border border-gray-100 bg-white p-6 shadow-sm';

  return (
    <div className={compact ? 'mb-4' : 'mb-8'}>
      <div className={cardShell}>
        <div className={`flex items-center justify-between ${compact ? 'mb-3' : 'mb-6'}`}>
          <div className="flex items-center gap-2">
            <Users className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} text-[#364D9D]`} />
            <h2 className={compact ? 'text-md font-semibold text-gray-900' : 'text-xl font-semibold text-gray-900'}>
              Today&apos;s route progress
            </h2>
          </div>
          <Button
            type="button"
            size={compact ? 'sm' : 'default'}
            onClick={() => router.push('/services')}
            className="flex items-center gap-1 whitespace-nowrap"
          >
            Services
            <ArrowRight className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
          </Button>
        </div>

        {techniciansProgress.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            <p className="font-medium text-gray-700">No technician routes for today</p>
            <p className="mt-1">Scheduled visits will show progress here as your team works through the day.</p>
          </div>
        ) : compact ? (
          <div className="space-y-4">
            {techniciansProgress.map((tech) => (
              <div key={tech.id} className="rounded-lg bg-gray-50 p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="font-medium text-gray-900">
                    {tech.firstName} {tech.lastName}
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-semibold ${
                        pctComplete(tech) >= 90 ? 'text-green-600' : pctComplete(tech) >= 50 ? 'text-yellow-700' : 'text-gray-800'
                      }`}
                    >
                      {pctComplete(tech)}%
                    </span>
                    <div className="text-[11px] text-gray-500">
                      {tech.completedCount}/{tech.totalScheduled} stops
                    </div>
                  </div>
                </div>
                <StackedRouteBar tech={tech} />
                <div className="mt-2">
                  <CountPills tech={tech} compact />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Technician</th>
                  <th className="min-w-[200px] px-4 py-3 text-left font-medium text-gray-700">Progress</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Today&apos;s breakdown</th>
                </tr>
              </thead>
              <tbody>
                {techniciansProgress.map((tech) => (
                  <tr key={tech.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {tech.firstName} {tech.lastName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="mb-2 max-w-md">
                        <StackedRouteBar tech={tech} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            pctComplete(tech) >= 90 ? 'text-green-600' : pctComplete(tech) >= 50 ? 'text-yellow-700' : 'text-gray-800'
                          }`}
                        >
                          {pctComplete(tech)}%
                        </span>
                        <span className="text-xs text-gray-500">
                          {tech.completedCount} of {tech.totalScheduled} completed
                        </span>
                      </div>
                    </td>
                    <td className="align-top px-4 py-3">
                      <CountPills tech={tech} compact={false} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
