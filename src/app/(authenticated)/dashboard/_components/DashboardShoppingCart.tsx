'use client';

import { ArrowRight, ShoppingCart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { accentButtonClassName, DataPanel, type DataPanelColumn, Surface } from '@/components/design';
import { Button } from '@/components/ui/button';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import useGetShoppingItems from '@/hooks/react-query/shopping-items/useGetShoppingItems';
import { ShoppingListRow } from '@/ts/interfaces/Shopping';

function formatDollars(amount: number) {
  return `$${amount.toFixed(2)}`;
}

export function DashboardShoppingCart() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const { data: companies = [], isLoading: isLoadingCompanies } = useGetCompanies();
  const companyId = companies[0]?.id ?? '';

  const { data: items = [], isLoading: isLoadingItems } = useGetShoppingItems({
    companyId,
    status: 'PendingPurchase'
  });

  const columns: DataPanelColumn<ShoppingListRow>[] = [
    {
      id: 'description',
      header: t('shoppingCart.columns.description'),
      className: 'font-medium',
      cell: (item) => {
        const detail = item.notes?.trim() || item.product.description?.trim();
        return (
          <div className="min-w-0">
            <p className="truncate">{item.productName}</p>
            {detail ? <p className="mt-0.5 truncate text-xs font-normal text-ink-muted">{detail}</p> : null}
          </div>
        );
      }
    },
    {
      id: 'amount',
      header: t('shoppingCart.columns.amount'),
      className: 'text-right',
      headClassName: 'text-right',
      cell: (item) => (
        <div>
          <p>{formatDollars(item.quantity * item.unitPrice)}</p>
          <p className="mt-0.5 text-xs font-normal text-ink-muted">
            {t('shoppingCart.quantity', { count: item.quantity })}
          </p>
        </div>
      )
    }
  ];

  const goToList = () => router.push('/shopping-list/overview');

  const action = (
    <Button size="sm" className={accentButtonClassName} onClick={goToList}>
      {t('shoppingCart.viewList')}
      <ArrowRight className="h-4 w-4" />
    </Button>
  );

  const isLoading = isLoadingCompanies || (!!companyId && isLoadingItems);

  if (isLoading) {
    return (
      <Surface title={t('shoppingCart.title')} icon={ShoppingCart} action={action}>
        <p className="text-sm text-ink-muted">{t('shoppingCart.loading')}</p>
      </Surface>
    );
  }

  return (
    <DataPanel
      title={t('shoppingCart.title')}
      icon={ShoppingCart}
      action={action}
      columns={columns}
      rows={items}
      getRowKey={(item) => item.id}
      onRowClick={goToList}
      emptyTitle={t('shoppingCart.emptyTitle')}
      emptyDescription={t('shoppingCart.emptyDescription')}
    />
  );
}
