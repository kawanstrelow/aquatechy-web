'use client';

import { Users, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ClientReportsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          Client Reports
        </h1>
        <p className="text-gray-600 mt-2">
          Generate reports on client activity and client performance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/reports/clients/chemical-costs'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Cost of Services by Client
              </CardTitle>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Available
              </Badge>
            </div>
            <CardDescription>
              Generate a detailed PDF report showing all chemical costs by client and pool
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              View chemical costs breakdown by client and pool for a specified date interval. Includes detailed consumable breakdowns and summary totals.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 