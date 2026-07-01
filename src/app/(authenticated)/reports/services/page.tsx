'use client';

import { ListChecks, FileBarChartIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ServiceReportsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ListChecks className="h-6 w-6 text-green-600" />
          Service Reports
        </h1>
        <p className="text-gray-600 mt-2">
          Generate reports on technician performance and operational efficiency
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/reports/services/technician'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileBarChartIcon className="h-5 w-5 text-blue-600" />
                Service report by technician
              </CardTitle>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Available
              </Badge>
            </div>
            <CardDescription>
              Generate detailed reports by technician and date range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Generate comprehensive reports showing service completion rates, efficiency metrics, and detailed service history for specific technicians.
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => (window.location.href = '/reports/services/route-efficiency')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileBarChartIcon className="h-5 w-5 text-orange-600" />
                Route Efficiency Report
              </CardTitle>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                Available
              </Badge>
            </div>
            <CardDescription>
              Optimize routes and service scheduling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Analyze planned route distance and time by technician and weekday to identify optimization opportunities.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 