'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Company } from '@/ts/interfaces/Company';
import { ServiceTypesManager } from './ServiceTypesManager';

interface ServiceTypesCardProps {
  company: Company;
}

export function ServiceTypesCard({ company }: ServiceTypesCardProps) {
  const [collapsed, setCollapsed] = useState(true);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Card className="w-full border-2">
      <CardHeader 
        className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
        onClick={toggleCollapsed}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-blue-900">Service Types</CardTitle>
              <CardDescription className="text-blue-700">
                Manage service types that can be selected when creating service reports. These help categorize and organize your services.
              </CardDescription>
            </div>
          </div>
          <ChevronDown 
            className={cn(
              "h-5 w-5 text-blue-600 transition-transform duration-200",
              collapsed ? "rotate-180" : "rotate-0"
            )}
          />
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent>
          <ServiceTypesManager companyId={company.id} />
        </CardContent>
      )}
    </Card>
  );
}
