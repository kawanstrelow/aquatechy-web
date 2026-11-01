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
import { CreateShoppingItemParams } from '@/hooks/react-query/shopping-items/useCreateShoppingItem';
import { Client } from '@/ts/interfaces/Client';
import { CompanyWithMyRole } from '@/ts/interfaces/Company';
import { getClientCompanyOwnerId, isClientActive } from '@/utils/clientUtils';

const schema = z.object({
  companyId: z.string().min(1, 'shopping.validation.companyRequired'),
  clientId: z.string().min(1, 'shopping.validation.clientRequired'),
  poolId: z.string().min(1, 'shopping.validation.poolRequired'),
  categoryFilter: z.string().optional(),
  productId: z.string().min(1, 'shopping.validation.productRequired'),
  quantity: z.coerce.number().min(0.01, 'shopping.validation.quantityMin'),
  notes: z.string().max(1000, 'shopping.validation.notesMax').optional()
});

interface AddShoppingItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companies: CompanyWithMyRole[];
  allClients: Client[];
  onSubmit: (params: CreateShoppingItemParams) => void;
  isLoading: boolean;
}

export function AddShoppingItemDialog({
  open,
  onOpenChange,
  companyId: pageCompanyId,
  companies,
  allClients,
  onSubmit,
  isLoading
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

  const { data: pools = [], isLoading: isPoolsLoading } = useGetPoolsByClientId(open ? clientId : null);

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
    if (open && pageCompanyId) {
      form.reset({
        companyId: pageCompanyId,
        clientId: '',
        poolId: '',
        categoryFilter: 'all',
        productId: '',
        quantity: 1,
        notes: ''
      });
      prevCompanyIdRef.current = pageCompanyId;
    }

    if (!open) {
      prevCompanyIdRef.current = undefined;
    }
  }, [open, pageCompanyId, form]);

  useEffect(() => {
    if (!open || !effectiveCompanyId) return;

    if (prevCompanyIdRef.current !== undefined && prevCompanyIdRef.current !== effectiveCompanyId) {
      form.setValue('clientId', '');
      form.setValue('poolId', '');
      form.setValue('categoryFilter', 'all');
      form.setValue('productId', '');
    }

    prevCompanyIdRef.current = effectiveCompanyId;
  }, [effectiveCompanyId, open, form]);

  useEffect(() => {
    form.setValue('poolId', '');
    form.setValue('categoryFilter', 'all');
    form.setValue('productId', '');
  }, [clientId, form]);

  useEffect(() => {
    form.setValue('categoryFilter', 'all');
    form.setValue('productId', '');
  }, [poolId, form]);

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

  const showCompanySelect = companies.length > 1;
  const canSelectCategory = !!clientId && !!poolId && !!effectiveCompanyId;
  const canSelectProduct = canSelectCategory;

  const handleSubmit = (data: z.infer<typeof schema>) => {
    const selectedClient = allClients.find((client) => client.id === data.clientId);
    const companyId = selectedClient ? getClientCompanyOwnerId(selectedClient) : data.companyId;

    onSubmit({
      companyId,
      data: {
        productId: data.productId,
        clientId: data.clientId,
        poolId: data.poolId,
        quantity: data.quantity,
        notes: data.notes?.trim() || undefined
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

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addDialog.quantity')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0.01} step="any" placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
