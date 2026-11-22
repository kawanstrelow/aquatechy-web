'use client';

import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { useUpdateShoppingItemPreferences } from '@/hooks/react-query/companies/useUpdateShoppingItemPreferences';
import { Company } from '@/ts/interfaces/Company';
import { companyRequiresShoppingItemInstallPhotos } from '@/utils/shoppingItemInstallPhotos';

interface ShoppingItemPreferencesCardProps {
  company: Company;
}

export function ShoppingItemPreferencesCard({ company }: ShoppingItemPreferencesCardProps) {
  const t = useTranslations('settings');
  const { data: companies = [], isLoading: isLoadingRole } = useGetCompanies();
  const role = companies.find((item) => item.id === company.id)?.role;
  const canManage = role === 'Owner' || role === 'Admin';
  const required = companyRequiresShoppingItemInstallPhotos(company.preferences?.requireShoppingItemInstallPhotos);
  const { mutate, isPending } = useUpdateShoppingItemPreferences(company.id);
  const disabled = isLoadingRole || !canManage || isPending;

  return (
    <Card className="w-full border-2">
      <CardContent className="p-6">
        <div className="grid w-full grid-cols-1 items-center gap-3 md:grid-cols-12 md:gap-4">
          <div className="col-span-8 flex flex-col gap-1">
            <label htmlFor="require-install-photos" className="text-sm font-semibold text-gray-800">
              {t('shoppingItems.title')}
            </label>
            <span className="text-muted-foreground text-sm font-normal">{t('shoppingItems.description')}</span>
            {!isLoadingRole && !canManage && (
              <span className="text-sm text-slate-500">{t('shoppingItems.viewOnly')}</span>
            )}
          </div>
          <div className="col-span-4 flex items-center md:justify-end">
            <Switch
              id="require-install-photos"
              checked={required}
              disabled={disabled}
              onCheckedChange={(checked) => mutate(checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
