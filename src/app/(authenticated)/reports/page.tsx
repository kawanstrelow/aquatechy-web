'use client';

import { ListChecks, UserPlus, Users, Waves } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ReportOptionCard } from './_components/ReportChrome';

export default function ReportsPage() {
  const t = useTranslations('reports');
  const reportCategories = [
    {
      title: t('categories.clientsTitle'),
      description: t('categories.clientsDescription'),
      detail: t('categories.clientsDetail'),
      href: '/reports/clients',
      icon: Users
    },
    {
      title: t('categories.servicesTitle'),
      description: t('categories.servicesDescription'),
      detail: t('categories.servicesDetail'),
      href: '/reports/services',
      icon: ListChecks
    },
    {
      title: t('categories.teamTitle'),
      description: t('categories.teamDescription'),
      detail: t('categories.teamDetail'),
      href: '/reports/team',
      icon: UserPlus
    },
    {
      title: t('categories.poolsTitle'),
      description: t('categories.poolsDescription'),
      detail: t('categories.poolsDetail'),
      href: '/reports/pools',
      icon: Waves
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {reportCategories.map((category) => (
        <ReportOptionCard key={category.href} {...category} />
      ))}
    </div>
  );
}
