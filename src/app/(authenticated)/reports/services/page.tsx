'use client';

import { FileBarChartIcon, Route } from 'lucide-react';

import { ReportOptionCard } from '../_components/ReportChrome';

export default function ServiceReportsPage() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ReportOptionCard
        href="/reports/services/technician"
        title="Service report by technician"
        description="Services, pay, and adjustments for one technician"
        detail="Generate a PDF for a technician, service types, and date range."
        icon={FileBarChartIcon}
      />
      <ReportOptionCard
        href="/reports/services/route-efficiency"
        title="Route Efficiency Report"
        description="Planned distance and time by technician and weekday"
        detail="Compare stops, drive time, and total route time across active routes."
        icon={Route}
      />
    </div>
  );
}
