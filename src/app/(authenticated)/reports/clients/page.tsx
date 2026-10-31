'use client';

import { DollarSign } from 'lucide-react';

import { ReportOptionCard } from '../_components/ReportChrome';

export default function ClientReportsPage() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ReportOptionCard
        href="/reports/clients/chemical-costs"
        title="Cost of Services by Client"
        description="Chemical costs by client and pool"
        detail="Download a PDF of consumable costs for the clients and date range you select."
        icon={DollarSign}
      />
    </div>
  );
}
