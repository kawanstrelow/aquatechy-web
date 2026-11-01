'use client';

import { FileBarChartIcon, Route } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ReportOptionCard } from '../_components/ReportChrome';

export default function ServiceReportsPage() {
  const t = useTranslations('reports');

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ReportOptionCard
        href="/reports/services/technician"
        title={t('services.technicianTitle')}
        description={t('services.technicianDescription')}
        detail={t('services.technicianDetail')}
        icon={FileBarChartIcon}
      />
      <ReportOptionCard
        href="/reports/services/route-efficiency"
        title={t('services.routeTitle')}
        description={t('services.routeDescription')}
        detail={t('services.routeDetail')}
        icon={Route}
      />
    </div>
  );
}
