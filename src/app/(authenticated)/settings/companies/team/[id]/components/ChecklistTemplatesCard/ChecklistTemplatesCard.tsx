'use client';

import { Card, CardContent } from '@/components/ui/card';

import { Company } from '@/ts/interfaces/Company';
import { ChecklistTemplatesManager } from './ChecklistTemplatesManager';

interface ChecklistTemplatesCardProps {
  company: Company;
}

export function ChecklistTemplatesCard({ company }: ChecklistTemplatesCardProps) {
  return (
    <Card className="w-full border-2">
      <CardContent className="p-6">
        <ChecklistTemplatesManager companyId={company.id} />
      </CardContent>
    </Card>
  );
}
