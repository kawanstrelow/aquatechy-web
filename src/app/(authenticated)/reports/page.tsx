'use client';

import { ListChecks, UserPlus, Users, Waves } from 'lucide-react';

import { ReportOptionCard } from './_components/ReportChrome';

export default function ReportsPage() {
  const reportCategories = [
    {
      title: 'Client Reports',
      description: 'Client activity and pool maintenance reports',
      detail: 'Chemical costs and other client reports for a selected date range.',
      href: '/reports/clients',
      icon: Users
    },
    {
      title: 'Service Reports',
      description: 'Service completion and technician reports',
      detail: 'Technician pay reports and planned route efficiency.',
      href: '/reports/services',
      icon: ListChecks
    },
    {
      title: 'Team Reports',
      description: 'Team performance and productivity reports',
      detail: 'Filter cleaning punctuality for each technician.',
      href: '/reports/team',
      icon: UserPlus
    },
    {
      title: 'Pool Reports',
      description: 'Pool equipment and filter maintenance reports',
      detail: 'Filter replacement schedules across company pools.',
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
