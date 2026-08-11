'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestTube, Package, Camera, CheckSquare, ClipboardList } from 'lucide-react';

import { Company } from '@/ts/interfaces/Company';
import { ChecklistTemplatesManager } from '../ChecklistTemplatesCard/ChecklistTemplatesManager';
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

  return (
    <Card className="w-full border-2">
      <CardContent className="px-6 pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 border border-blue-200 bg-blue-100">
            <TabsTrigger value="reading" className={tabTriggerClassName}>
              <TestTube className="h-4 w-4" />
              Reading
            </TabsTrigger>

            <TabsTrigger value="checklist" className={tabTriggerClassName}>
              <ClipboardList className="h-4 w-4" />
              Checklist
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
            <TabsContent value="reading" className="mt-6 w-full">
              <ReadingGroupsManager companyId={company.id} />
            </TabsContent>

            <TabsContent value="checklist" className="mt-6 w-full">
              <ChecklistTemplatesManager companyId={company.id} />
            </TabsContent>

            <TabsContent value="consumable" className="mt-6 w-full">
              <ConsumableGroupsManager companyId={company.id} />
            </TabsContent>

            <TabsContent value="photo" className="mt-6 w-full">
              <PhotoGroupsManager companyId={company.id} />
            </TabsContent>

            <TabsContent value="selector" className="mt-6 w-full">
              <SelectorGroupsManager companyId={company.id} />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
