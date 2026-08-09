'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestTube, Package, Camera, CheckSquare, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Company } from '@/ts/interfaces/Company';
import { ReadingGroupsManager } from './ReadingGroups/ReadingGroupsManager';
import { ConsumableGroupsManager } from './ConsumableGroups/ConsumableGroupsManager';
import { PhotoGroupsManager } from './PhotoGroups/PhotoGroupsManager';
import { SelectorGroupsManager } from './SelectorGroups/SelectorGroupsManager';

interface ReadingAndConsumableGroupsCardProps {
  company: Company;
}

const tabTriggerClassName =
  'flex-1 min-w-[45%] sm:min-w-0 flex items-center justify-center gap-2 text-sm rounded-md px-2 py-2 transition-colors data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-blue-700 data-[state=inactive]:hover:text-blue-800 data-[state=inactive]:hover:bg-blue-200';

export function ReadingAndConsumableGroupsCard({ company }: ReadingAndConsumableGroupsCardProps) {
  const [activeTab, setActiveTab] = useState('reading');
  const [collapsed, setCollapsed] = useState(true);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Card className="w-full border-2">
      <CardHeader
        className="cursor-pointer border-b bg-gradient-to-r from-blue-50 to-indigo-50 transition-colors hover:from-blue-100 hover:to-indigo-100"
        onClick={toggleCollapsed}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <TestTube className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-blue-900">Service Configuration</CardTitle>
              <CardDescription className="text-blue-700">
                Manage reading groups, consumable groups, photo groups, and selector groups for your company. These
                configurations will be used when creating new services.
              </CardDescription>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-blue-600 transition-transform duration-200',
              collapsed ? 'rotate-180' : 'rotate-0'
            )}
          />
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent className="px-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 border border-blue-200 bg-blue-100">
              <TabsTrigger value="reading" className={tabTriggerClassName}>
                <TestTube className="h-4 w-4" />
                Reading
              </TabsTrigger>

              <TabsTrigger value="consumable" className={tabTriggerClassName}>
                <Package className="h-4 w-4" />
                Consumables
              </TabsTrigger>

              <TabsTrigger value="photo" className={tabTriggerClassName}>
                <Camera className="h-4 w-4" />
                Photos
              </TabsTrigger>

              <TabsTrigger value="selector" className={tabTriggerClassName}>
                <CheckSquare className="h-4 w-4" />
                Selectors
              </TabsTrigger>
            </TabsList>

            <div className="relative mt-4 w-full">
              <TabsContent value="reading" className="mt-6 w-full px-4">
                <ReadingGroupsManager companyId={company.id} />
              </TabsContent>

              <TabsContent value="consumable" className="mt-6 w-full px-4">
                <ConsumableGroupsManager companyId={company.id} />
              </TabsContent>

              <TabsContent value="photo" className="mt-6 w-full px-4">
                <PhotoGroupsManager companyId={company.id} />
              </TabsContent>

              <TabsContent value="selector" className="mt-6 w-full px-4">
                <SelectorGroupsManager companyId={company.id} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}
