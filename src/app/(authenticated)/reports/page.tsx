'use client';

import { FileBarChartIcon, Users, ListChecks, UserPlus, Waves } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportsPage() {
  const reportCategories = [
    {
      title: 'Client Reports',
      description: 'Client activity and pool maintenance reports',
      href: '/reports/clients',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Service Reports',
      description: 'Service completion and technician reports',
      href: '/reports/services',
      icon: ListChecks,
      color: 'text-green-600'
    },
    {
      title: 'Team Reports',
      description: 'Team performance and productivity reports',
      href: '/reports/team',
      icon: UserPlus,
      color: 'text-purple-600'
    },
    {
      title: 'Pool Reports',
      description: 'Pool equipment and filter maintenance reports',
      href: '/reports/pools',
      icon: Waves,
      color: 'text-cyan-600'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileBarChartIcon className="h-6 w-6 text-blue-600" />
          Reports & Analytics
        </h1>
        <p className="text-gray-600 mt-2">
          Generate comprehensive reports and analytics for your pool management business
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {reportCategories.map((category) => {
          const IconComponent = category.icon;
          return (
            <Link key={category.href} href={category.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <IconComponent className={`h-8 w-8 ${category.color}`} />
                    <div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Generate detailed reports and insights for better business decisions.
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
} 