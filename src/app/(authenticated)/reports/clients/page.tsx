'use client';

import { DollarSign } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ReportOptionCard } from '../_components/ReportChrome';

export default function ClientReportsPage() {
  const t = useTranslations('reports');

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ReportOptionCard
        href="/reports/clients/chemical-costs"
        title={t('clients.chemicalCostsTitle')}
        description={t('clients.chemicalCostsDescription')}
        detail={t('clients.chemicalCostsDetail')}
        icon={DollarSign}
      />
    </div>
  );
}
