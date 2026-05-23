'use client';

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
  companyId: z.string().min(1, 'Company is required'),
  clientId: z.string().min(1, 'Client is required'),
  poolId: z.string().min(1, 'Pool is required'),
  categoryFilter: z.string().optional(),
  productId: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional()
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
      categoryFilter && categoryFilter !== 'all' && categoryFilter !== 'uncategorized'
        ? categoryFilter
        : null,
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
      allClients.filter(
        (client) => isClientActive(client) && getClientCompanyOwnerId(client) === effectiveCompanyId
      ),
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
      { key: 'all', value: 'all', name: 'All categories' },
      { key: 'uncategorized', value: 'uncategorized', name: 'Uncategorized' }
    ];
    categoriesQuery.data?.productCategories
      .filter((category) => category.isActive)
      .forEach((category) => {
        options.push({ key: category.id, value: category.id, name: category.name });
      });
    return options;
  }, [categoriesQuery.data?.productCategories]);

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
          <DialogTitle>Add to shopping list</DialogTitle>
          <DialogDescription>
            Select the client and pool, filter by category, then choose a product. Adding the same product again merges quantity.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {showCompanySelect && (
              <SelectField name="companyId" label="Company *" options={companyOptions} placeholder="Select company" />
            )}

            {!showCompanySelect && <input type="hidden" {...form.register('companyId')} />}

            <SelectField
              name="clientId"
              label="Client *"
              options={clientOptions}
              placeholder={
                !effectiveCompanyId
                  ? 'Select a company first'
                  : clientOptions.length === 0
                    ? 'No clients for this company'
                    : 'Select client'
              }
              disabled={!effectiveCompanyId || clientOptions.length === 0}
            />

            <SelectField
              name="poolId"
              label="Pool *"
              options={poolOptions}
              placeholder={
                !clientId
                  ? 'Select a client first'
                  : isPoolsLoading
                    ? 'Loading pools...'
                    : poolOptions.length === 0
                      ? 'No pools for this client'
                      : 'Select pool'
              }
              disabled={!clientId || isPoolsLoading || poolOptions.length === 0}
            />

            <SelectField
              name="categoryFilter"
              label="Category"
              options={categoryFilterOptions}
              placeholder={
                !canSelectCategory
                  ? 'Select client and pool first'
                  : categoriesQuery.isLoading
                    ? 'Loading categories...'
                    : 'Filter by category'
              }
              disabled={!canSelectCategory || categoriesQuery.isLoading}
            />

            <SelectField
              name="productId"
              label="Product *"
              options={productOptions}
              placeholder={
                !canSelectProduct
                  ? 'Select client and pool first'
                  : productsQuery.isLoading
                    ? 'Loading products...'
                    : productOptions.length === 0
                      ? 'No products in this category'
                      : 'Select product'
              }
              disabled={!canSelectProduct || productsQuery.isLoading || productOptions.length === 0}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity *</FormLabel>
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional notes" className="resize-none" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !canSelectProduct || productOptions.length === 0}
              >
                {isLoading ? 'Adding...' : 'Add shopping item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
