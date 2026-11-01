'use client';

import { Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ReportOptionCard } from '../_components/ReportChrome';

export default function PoolReportsPage() {
  const t = useTranslations('reports');

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ReportOptionCard
        href="/reports/pools/filter-replacement"
        title={t('pools.filterTitle')}
        description={t('pools.filterDescription')}
        detail={t('pools.filterDetail')}
        icon={Filter}
      />
    </div>
  );
}
