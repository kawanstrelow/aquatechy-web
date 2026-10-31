'use client';

import { Filter } from 'lucide-react';

import { ReportOptionCard } from '../_components/ReportChrome';

export default function PoolReportsPage() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ReportOptionCard
        href="/reports/pools/filter-replacement"
        title="Filter Replacement Interval"
        description="Filter replacement schedules across company pools"
        detail="See last and next replacement dates, filter condition, and overdue pools."
        icon={Filter}
      />
    </div>
  );
}
