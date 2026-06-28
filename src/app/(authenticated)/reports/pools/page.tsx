'use client';

import { Waves, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PoolReportsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Waves className="h-6 w-6 text-cyan-600" />
          Pool Reports
        </h1>
        <p className="text-gray-600 mt-2">
          Generate reports on pool equipment and filter maintenance schedules
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => (window.location.href = '/reports/pools/filter-replacement')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-cyan-600" />
                Filter Replacement Interval
              </CardTitle>
              <Badge variant="secondary" className="bg-cyan-100 text-cyan-800">
                Available
              </Badge>
            </div>
            <CardDescription>
              View filter replacement schedules across all company pools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Track last and next filter replacement dates, filter condition, and overdue pools for a selected company.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
