'use client';

import { Card, CardContent } from '@/components/ui/card';

import { Company } from '@/ts/interfaces/Company';
import { GeneralPreferencesCard } from '../GeneralPreferencesCard';
import { ServiceTypesManager } from './ServiceTypesManager';

interface ServiceTypesCardProps {
  company: Company;
  form: any;
  onGeneralSubmit: (data: any) => void;
  generalFieldsChanged: () => boolean;
}

export function ServiceTypesCard({
  company,
  form,
  onGeneralSubmit,
  generalFieldsChanged
}: ServiceTypesCardProps) {
  return (
    <div className="w-full space-y-4">
      <GeneralPreferencesCard
        company={company}
        form={form}
        onGeneralSubmit={onGeneralSubmit}
        generalFieldsChanged={generalFieldsChanged}
      />

      <Card className="w-full border-2">
        <CardContent>
          <ServiceTypesManager companyId={company.id} />
        </CardContent>
      </Card>
    </div>
  );
}
