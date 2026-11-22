'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import SelectField from '@/components/SelectField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import useGetPoolsByClientId from '@/hooks/react-query/pools/getPoolsByClientId';
import useGetProductCategories from '@/hooks/react-query/products/useGetProductCategories';
import useGetProducts from '@/hooks/react-query/products/useGetProducts';
import useGetRequestsByPool from '@/hooks/react-query/requests/getRequestsByPool';
import { CreateShoppingItemParams } from '@/hooks/react-query/shopping-items/useCreateShoppingItem';
import { Client } from '@/ts/interfaces/Client';
import { CompanyWithMyRole } from '@/ts/interfaces/Company';
import { getClientCompanyOwnerId, isClientActive } from '@/utils/clientUtils';

import { NO_REQUEST, requestOptionLabel } from './requestOptionLabel';

const schema = z.object({
  companyId: z.string().min(1, 'shopping.validation.companyRequired'),
  clientId: z.string().min(1, 'shopping.validation.clientRequired'),
  poolId: z.string().min(1, 'shopping.validation.poolRequired'),
  categoryFilter: z.string().optional(),
  requestId: z.string().optional(),
  productId: z.string().min(1, 'shopping.validation.productRequired'),
  quantity: z.coerce.number().min(0.01, 'shopping.validation.quantityMin'),
  notes: z.string().max(1000, 'shopping.validation.notesMax').optional()
});

export type ShoppingItemRequestLink = {
  companyId: string;
  clientId: string;
  poolId: string;
  requestId: string;
};

interface AddShoppingItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companies: CompanyWithMyRole[];
  allClients: Client[];
  onSubmit: (params: CreateShoppingItemParams) => void;
  isLoading: boolean;
  initialLink?: ShoppingItemRequestLink | null;
}

export function AddShoppingItemDialog({
  open,
  onOpenChange,
  companyId: pageCompanyId,
  companies,
  allClients,
  onSubmit,
  isLoading,
  initialLink = null
}: AddShoppingItemDialogProps) {
  const t = useTranslations('shopping');
  const common = useTranslations('common');
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyId: '',
      clientId: '',
      poolId: '',
      categoryFilter: 'all',
      requestId: NO_REQUEST,
      productId: '',
      quantity: 1,
      notes: ''
    }
  });

  const selectedCompanyId = form.watch('companyId');
  const clientId = form.watch('clientId');
  const poolId = form.watch('poolId');
  const categoryFilter = form.watch('categoryFilter');
  const effectiveCompanyId = selectedCompanyId || pageCompanyId;
  const prevCompanyIdRef = useRef<string | undefined>();
  const prevClientIdRef = useRef('');
  const prevPoolIdRef = useRef('');
  const skipDependentReset = useRef(false);

  const { data: pools = [], isLoading: isPoolsLoading } = useGetPoolsByClientId(open ? clientId : null);
  const requestsQuery = useGetRequestsByPool(open && poolId ? poolId : null);

  const categoriesQuery = useGetProductCategories({
    companyId: open ? effectiveCompanyId : ''
  });

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoriesQuery.data?.productCategories.forEach((category) => {
      map[category.id] = category.name;
    });
    return map;
  }, [categoriesQuery.data?.productCategories]);

  const productsQuery = useGetProducts({
    companyId: open ? effectiveCompanyId : '',
    activeOnly: true,
    categoryId:
      categoryFilter && categoryFilter !== 'all' && categoryFilter !== 'uncategorized' ? categoryFilter : null,
    uncategorizedOnly: categoryFilter === 'uncategorized',
    categoryMap
  });

  const products = productsQuery.data ?? [];

  useEffect(() => {
    if (open && (pageCompanyId || initialLink?.companyId)) {
      const nextCompanyId = initialLink?.companyId || pageCompanyId;
      const nextClientId = initialLink?.clientId || '';
      const nextPoolId = initialLink?.poolId || '';
      const nextRequestId = initialLink?.requestId || NO_REQUEST;
      skipDependentReset.current = true;
      prevCompanyIdRef.current = nextCompanyId;
      form.reset({
        companyId: nextCompanyId,
        clientId: nextClientId,
        poolId: nextPoolId,
        categoryFilter: 'all',
        requestId: nextRequestId,
        productId: '',
        quantity: 1,
        notes: ''
      });
    }

    if (!open) {
      skipDependentReset.current = false;
      prevCompanyIdRef.current = undefined;
      prevClientIdRef.current = '';
      prevPoolIdRef.current = '';
    }
  }, [open, pageCompanyId, initialLink, form]);

  useEffect(() => {
    if (!open || !effectiveCompanyId || skipDependentReset.current) return;

    if (prevCompanyIdRef.current !== undefined && prevCompanyIdRef.current !== effectiveCompanyId) {
      form.setValue('clientId', '');
      form.setValue('poolId', '');
      form.setValue('requestId', NO_REQUEST);
      form.setValue('categoryFilter', 'all');
      form.setValue('productId', '');
    }

    prevCompanyIdRef.current = effectiveCompanyId;
  }, [effectiveCompanyId, open, form]);

  useEffect(() => {
    if (skipDependentReset.current) return;
    if (prevClientIdRef.current && prevClientIdRef.current !== clientId) {
      form.setValue('poolId', '');
      form.setValue('requestId', NO_REQUEST);
      form.setValue('categoryFilter', 'all');
      form.setValue('productId', '');
    }
    prevClientIdRef.current = clientId;
  }, [clientId, form]);

  useEffect(() => {
    if (skipDependentReset.current) {
      skipDependentReset.current = false;
      prevClientIdRef.current = clientId;
      prevPoolIdRef.current = poolId;
      return;
    }
    if (prevPoolIdRef.current && prevPoolIdRef.current !== poolId) {
      form.setValue('requestId', NO_REQUEST);
      form.setValue('categoryFilter', 'all');
      form.setValue('productId', '');
    }
    prevPoolIdRef.current = poolId;
  }, [poolId, clientId, form]);

  useEffect(() => {
    form.setValue('productId', '');
  }, [categoryFilter, form]);

  const clientsForCompany = useMemo(
    () =>
      allClients.filter((client) => isClientActive(client) && getClientCompanyOwnerId(client) === effectiveCompanyId),
    [allClients, effectiveCompanyId]
  );

  const companyOptions = useMemo(
    () =>
      companies.map((company) => ({
        key: company.id,
        value: company.id,
        name: company.name
      })),
    [companies]
  );

  const clientOptions = clientsForCompany.map((client) => ({
    key: client.id,
    value: client.id,
    name: client.fullName
  }));

  const poolOptions = pools
    .filter((pool) => pool.isActive)
    .map((pool) => ({
      key: pool.id,
      value: pool.id,
      name: pool.name
    }));

  const categoryFilterOptions = useMemo(() => {
    const options = [
      { key: 'all', value: 'all', name: t('allCategories') },
      { key: 'uncategorized', value: 'uncategorized', name: t('uncategorized') }
    ];
    categoriesQuery.data?.productCategories
      .filter((category) => category.isActive)
      .forEach((category) => {
        options.push({ key: category.id, value: category.id, name: category.name });
      });
    return options;
  }, [categoriesQuery.data?.productCategories, t]);

  const productOptions = products.map((product) => ({
    key: product.id,
    value: product.id,
    name: product.name
  }));

  const requestOptions = useMemo(() => {
    const options = [{ key: NO_REQUEST, value: NO_REQUEST, name: t('editDialog.noRequest') }];
    (requestsQuery.data ?? []).forEach((request) => {
      options.push({
        key: request.id,
        value: request.id,
        name: requestOptionLabel(request)
      });
    });
    if (initialLink?.requestId && !options.some((option) => option.value === initialLink.requestId)) {
      options.push({
        key: initialLink.requestId,
        value: initialLink.requestId,
        name: t('linkedRequest')
      });
    }
    return options;
  }, [requestsQuery.data, initialLink?.requestId, t]);

  const showCompanySelect = companies.length > 1;
  const canSelectCategory = !!clientId && !!poolId && !!effectiveCompanyId;
  const canSelectProduct = canSelectCategory;

  const handleSubmit = (data: z.infer<typeof schema>) => {
    const selectedClient = allClients.find((client) => client.id === data.clientId);
    const companyId = selectedClient ? getClientCompanyOwnerId(selectedClient) : data.companyId;

    const requestId = data.requestId && data.requestId !== NO_REQUEST ? data.requestId : undefined;

    onSubmit({
      companyId,
      data: {
        productId: data.productId,
        clientId: data.clientId,
        poolId: data.poolId,
        quantity: data.quantity,
        notes: data.notes?.trim() || undefined,
        ...(requestId ? { requestId } : {})
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t('addDialog.title')}</DialogTitle>
          <DialogDescription>{t('addDialog.description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {showCompanySelect && (
              <SelectField
                name="companyId"
                label={t('addDialog.company')}
                options={companyOptions}
                placeholder={t('addDialog.selectCompany')}
              />
            )}

            {!showCompanySelect && <input type="hidden" {...form.register('companyId')} />}

            <SelectField
              name="clientId"
              label={t('addDialog.client')}
              options={clientOptions}
              placeholder={
                !effectiveCompanyId
                  ? t('addDialog.selectCompanyFirst')
                  : clientOptions.length === 0
                    ? t('addDialog.noClientsForCompany')
                    : t('addDialog.selectClient')
              }
              disabled={!effectiveCompanyId || clientOptions.length === 0}
            />

            <SelectField
              name="poolId"
              label={t('addDialog.pool')}
              options={poolOptions}
              placeholder={
                !clientId
                  ? t('addDialog.selectClientFirst')
                  : isPoolsLoading
                    ? t('addDialog.loadingPools')
                    : poolOptions.length === 0
                      ? t('addDialog.noPoolsForClient')
                      : t('addDialog.selectPool')
              }
              disabled={!clientId || isPoolsLoading || poolOptions.length === 0}
            />

            <SelectField
              name="requestId"
              label={t('editDialog.requestAttached')}
              options={requestOptions}
              placeholder={
                !clientId || !poolId
                  ? t('addDialog.selectClientAndPoolFirst')
                  : requestsQuery.isLoading
                    ? t('editDialog.loadingRequests')
                    : t('editDialog.selectRequest')
              }
              disabled={!clientId || !poolId || requestsQuery.isLoading}
            />

            <SelectField
              name="categoryFilter"
              label={t('addDialog.category')}
              options={categoryFilterOptions}
              placeholder={
                !canSelectCategory
                  ? t('addDialog.selectClientAndPoolFirst')
                  : categoriesQuery.isLoading
                    ? t('addDialog.loadingCategories')
                    : t('addDialog.filterByCategory')
              }
              disabled={!canSelectCategory || categoriesQuery.isLoading}
            />

            <div className="grid grid-cols-[7.5rem_1fr] items-start gap-3">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <FormLabel>{t('addDialog.quantity')}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0.01} step="any" placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SelectField
                name="productId"
                label={t('addDialog.product')}
                options={productOptions}
                placeholder={
                  !canSelectProduct
                    ? t('addDialog.selectClientAndPoolFirst')
                    : productsQuery.isLoading
                      ? t('addDialog.loadingProducts')
                      : productOptions.length === 0
                        ? t('addDialog.noProductsInCategory')
                        : t('addDialog.selectProduct')
                }
                disabled={!canSelectProduct || productsQuery.isLoading || productOptions.length === 0}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addDialog.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('addDialog.notesPlaceholder')}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                {common('cancel')}
              </Button>
              <Button type="submit" disabled={isLoading || !canSelectProduct || productOptions.length === 0}>
                {isLoading ? t('addDialog.adding') : t('addDialog.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
