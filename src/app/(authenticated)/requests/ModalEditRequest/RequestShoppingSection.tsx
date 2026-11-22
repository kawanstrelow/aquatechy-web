'use client';

import { format } from 'date-fns';
import { ShoppingCart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import { StatusBadge, Surface } from '@/components/design';
import { Button } from '@/components/ui/button';
import useGetAllClients from '@/hooks/react-query/clients/getAllClients';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { useCreateShoppingItem } from '@/hooks/react-query/shopping-items/useCreateShoppingItem';
import { cn } from '@/lib/utils';
import { Request, RequestShoppingItem } from '@/ts/interfaces/Request';
import { ShoppingItemStatus } from '@/ts/interfaces/Shopping';
import { getManagementCompanies } from '@/utils/aiChatAccess';

import { AddShoppingItemDialog } from '../../shopping-list/overview/_components/AddShoppingItemDialog';

const shoppingStatusTone: Record<ShoppingItemStatus, 'success' | 'warning' | 'neutral'> = {
  PendingPurchase: 'warning',
  OnInventory: 'neutral',
  OnTechnicianTruck: 'warning',
  Installed: 'success'
};

function formatShoppingDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, 'MMM d, yyyy · h:mm a');
}

const shoppingStages: { status: ShoppingItemStatus; at: keyof RequestShoppingItem }[] = [
  { status: 'PendingPurchase', at: 'pendingPurchaseAt' },
  { status: 'OnInventory', at: 'onInventoryAt' },
  { status: 'OnTechnicianTruck', at: 'onTechnicianTruckAt' },
  { status: 'Installed', at: 'installedAt' }
];

type Props = {
  request: Request;
  companyId: string;
  onViewPhoto: (url: string, alt: string, index: number) => void;
};

export function RequestShoppingSection({ request, companyId, onViewPhoto }: Props) {
  const t = useTranslations('requests');
  const shopping = useTranslations('shopping');
  const [adding, setAdding] = useState(false);
  const [itemsKnown, setItemsKnown] = useState(Array.isArray(request.shoppingItems));
  const [items, setItems] = useState<RequestShoppingItem[]>(request.shoppingItems ?? []);
  const { data: allCompanies = [] } = useGetCompanies();
  const companies = useMemo(() => getManagementCompanies(allCompanies), [allCompanies]);
  const { data: allClients = [] } = useGetAllClients();
  const { mutateAsync: createItem, isPending } = useCreateShoppingItem();
  const requestLink = useMemo(
    () =>
      companyId
        ? {
            companyId,
            clientId: request.clientId,
            poolId: request.poolId,
            requestId: request.id
          }
        : null,
    [companyId, request.clientId, request.id, request.poolId]
  );

  useEffect(() => {
    setItemsKnown(Array.isArray(request.shoppingItems));
    setItems(request.shoppingItems ?? []);
  }, [request.id, request.shoppingItems]);

  return (
    <Surface
      title={t('shoppingItems')}
      icon={ShoppingCart}
      action={
        <Button type="button" variant="outline" size="sm" disabled={!companyId} onClick={() => setAdding(true)}>
          {t('addShoppingItem')}
        </Button>
      }
    >
      <div className="space-y-4">
        {itemsKnown ? (
          items.length > 0 ? (
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li key={item.id} className="py-5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{item.product.name}</p>
                      <StatusBadge tone={shoppingStatusTone[item.status]}>
                        {shopping(`statuses.${item.status}`)}
                      </StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      <span className="tabular-nums">
                        {item.quantity} {item.product.unit}
                      </span>
                      {item.createdAt ? (
                        <span> · {t('shoppingAdded', { date: formatShoppingDate(item.createdAt) })}</span>
                      ) : null}
                    </p>
                  </div>

                  <ol className="mt-4">
                    {shoppingStages.map((stage, index) => {
                      const at = item[stage.at];
                      const when = typeof at === 'string' ? at : null;
                      const currentIndex = shoppingStages.findIndex((entry) => entry.status === item.status);
                      const reached = index <= currentIndex || Boolean(when);
                      const isLast = index === shoppingStages.length - 1;

                      return (
                        <li key={stage.status} className="relative flex gap-3 pb-4 last:pb-0">
                          {!isLast && (
                            <span
                              className={cn(
                                'absolute bottom-0 left-[6px] top-4 w-px',
                                index < currentIndex ? 'bg-accent' : 'bg-line'
                              )}
                              aria-hidden
                            />
                          )}
                          <span
                            className={cn(
                              'relative z-10 mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2',
                              reached ? 'border-accent bg-accent' : 'border-line bg-surface'
                            )}
                          />
                          <div className="min-w-0">
                            <p className={cn('text-sm font-medium', reached ? 'text-ink' : 'text-ink-muted')}>
                              {shopping(`statuses.${stage.status}`)}
                            </p>
                            <p className="mt-0.5 text-sm tabular-nums text-ink-muted">{formatShoppingDate(when)}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>

                  <div className="mt-4">
                    <p className="text-xs font-medium text-ink-muted">{shopping('columns.notes')}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{item.notes || '—'}</p>
                  </div>

                  {item.installPhotos.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {item.installPhotos.map((photo, index) => (
                        <button
                          key={`${item.id}-${photo}`}
                          type="button"
                          className="relative aspect-square overflow-hidden rounded-lg border border-line"
                          onClick={() => onViewPhoto(photo, t('installPhoto', { index: index + 1 }), index)}
                        >
                          <Image
                            src={photo}
                            alt={t('installPhoto', { index: index + 1 })}
                            fill
                            className="object-cover transition-transform hover:scale-105"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">{t('shoppingItemsEmpty')}</p>
          )
        ) : (
          <p className="text-sm text-ink-muted">{t('shoppingItemsUnavailable')}</p>
        )}
      </div>
      <AddShoppingItemDialog
        open={adding}
        onOpenChange={setAdding}
        companyId={companyId}
        companies={companies}
        allClients={allClients}
        isLoading={isPending}
        initialLink={requestLink}
        onSubmit={async (params) => {
          await createItem(params);
          setAdding(false);
        }}
      />
    </Surface>
  );
}
