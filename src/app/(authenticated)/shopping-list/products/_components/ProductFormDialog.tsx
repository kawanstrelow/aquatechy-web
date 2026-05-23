'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import SelectField from '@/components/SelectField';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { CreateProductParams } from '@/hooks/react-query/products/useCreateProduct';
import useGetProductCategories from '@/hooks/react-query/products/useGetProductCategories';
import { CompanyWithMyRole } from '@/ts/interfaces/Company';
import { CreateProductRequest, ProductCategory, ProductListRow, UpdateProductRequest } from '@/ts/interfaces/Product';

const productFieldsSchema = z
  .object({
    companyId: z.string().optional(),
    name: z.string().trim().min(1, 'Name is required').max(200, 'Name must be at most 200 characters'),
    description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
    sku: z.string().max(50, 'SKU must be at most 50 characters').optional(),
    unit: z.string().trim().min(1, 'Unit is required').max(50, 'Unit must be at most 50 characters'),
    unitPrice: z.coerce.number().min(0, 'Price must be zero or greater'),
    cost: z.coerce.number().min(0, 'Cost must be zero or greater').optional(),
    categoryId: z.string().optional(),
    isTaxable: z.boolean(),
    defaultTaxRate: z.coerce.number().min(0, 'Tax rate must be zero or greater').optional(),
    isActive: z.boolean().optional()
  })
  .refine((data) => !data.isTaxable || (data.defaultTaxRate !== undefined && data.defaultTaxRate >= 0), {
    message: 'Tax rate is required when taxable',
    path: ['defaultTaxRate']
  });

export type ProductFormValues = z.infer<typeof productFieldsSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  product?: ProductListRow | null;
  pageCompanyId: string;
  companies: CompanyWithMyRole[];
  editCategories: ProductCategory[];
  canManage: boolean;
  onSubmitCreate: (params: CreateProductParams) => void;
  onSubmitEdit: (productId: string, data: UpdateProductRequest) => void;
  isLoading: boolean;
}

function toFormDefaults(product: ProductListRow | null | undefined, pageCompanyId: string): ProductFormValues {
  if (!product) {
    return {
      companyId: pageCompanyId,
      name: '',
      description: '',
      sku: '',
      unit: 'each',
      unitPrice: 0,
      cost: undefined,
      categoryId: 'none',
      isTaxable: false,
      defaultTaxRate: 0,
      isActive: true
    };
  }

  return {
    companyId: product.companyId,
    name: product.name,
    description: product.description ?? '',
    sku: product.sku ?? '',
    unit: product.unit,
    unitPrice: product.unitPrice,
    cost: product.cost ?? undefined,
    categoryId: product.categoryId ?? 'none',
    isTaxable: product.isTaxable,
    defaultTaxRate: product.defaultTaxRate,
    isActive: product.isActive
  };
}

function resolveCostCents(
  cost: number | undefined,
  existingCostCents: number | null | undefined
): number | null | undefined {
  if (cost !== undefined && !Number.isNaN(cost)) {
    return Math.round(cost * 100);
  }
  if (existingCostCents != null) {
    return null;
  }
  return undefined;
}

function toPayload(data: ProductFormValues): CreateProductRequest {
  const payload: CreateProductRequest = {
    name: data.name.trim(),
    unit: data.unit.trim(),
    unitPriceCents: Math.round(data.unitPrice * 100),
    description: data.description?.trim() || undefined,
    sku: data.sku?.trim() || undefined,
    categoryId: data.categoryId && data.categoryId !== 'none' ? data.categoryId : undefined,
    isTaxable: data.isTaxable,
    defaultTaxRate: data.isTaxable ? data.defaultTaxRate ?? 0 : 0
  };

  if (data.cost !== undefined && !Number.isNaN(data.cost)) {
    payload.costCents = Math.round(data.cost * 100);
  }

  return payload;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  mode,
  product,
  pageCompanyId,
  companies,
  editCategories,
  canManage,
  onSubmitCreate,
  onSubmitEdit,
  isLoading
}: ProductFormDialogProps) {
  const isCreate = mode === 'create';

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFieldsSchema),
    defaultValues: toFormDefaults(product, pageCompanyId)
  });

  const selectedCompanyId = form.watch('companyId');
  const effectiveCompanyId = isCreate ? selectedCompanyId || pageCompanyId : product?.companyId ?? '';
  const isTaxable = form.watch('isTaxable');
  const prevCompanyIdRef = useRef<string | undefined>();

  const categoriesQuery = useGetProductCategories({
    companyId: isCreate ? effectiveCompanyId : product?.companyId ?? ''
  });

  const categories = isCreate ? categoriesQuery.data?.productCategories ?? [] : editCategories;

  useEffect(() => {
    if (open) {
      form.reset(toFormDefaults(product, pageCompanyId));
      prevCompanyIdRef.current = isCreate ? pageCompanyId : undefined;
    }
  }, [open, product, pageCompanyId, form, isCreate]);

  useEffect(() => {
    if (!open || !isCreate || !effectiveCompanyId) return;

    if (prevCompanyIdRef.current !== undefined && prevCompanyIdRef.current !== effectiveCompanyId) {
      form.setValue('categoryId', 'none');
    }

    prevCompanyIdRef.current = effectiveCompanyId;
  }, [effectiveCompanyId, open, isCreate, form]);

  const companyOptions = useMemo(
    () =>
      companies.map((company) => ({
        key: company.id,
        value: company.id,
        name: company.name
      })),
    [companies]
  );

  const categoryOptions = [
    { key: 'none', value: 'none', name: 'Uncategorized' },
    ...categories
      .filter((category) => category.isActive)
      .map((category) => ({
        key: category.id,
        value: category.id,
        name: category.name
      }))
  ];

  const showCompanySelect = isCreate && companies.length > 1;
  const canEditDetails = !isCreate || !!effectiveCompanyId;

  const handleSubmit = (data: ProductFormValues) => {
    const payload = toPayload(data);

    if (isCreate) {
      if (!data.companyId) return;

      onSubmitCreate({
        companyId: data.companyId,
        data: payload
      });
      return;
    }

    if (!product) return;

    const costCents = resolveCostCents(data.cost, product.costCents);

    const editPayload: UpdateProductRequest = {
      name: payload.name,
      unit: payload.unit,
      unitPriceCents: payload.unitPriceCents,
      isTaxable: payload.isTaxable,
      defaultTaxRate: payload.defaultTaxRate,
      description: data.description?.trim() || null,
      sku: data.sku?.trim() || null,
      categoryId: data.categoryId && data.categoryId !== 'none' ? data.categoryId : null
    };

    if (costCents !== undefined) {
      editPayload.costCents = costCents;
    } else if (payload.costCents !== undefined) {
      editPayload.costCents = payload.costCents;
    }

    if (canManage && data.isActive !== undefined) {
      editPayload.isActive = data.isActive;
    }

    onSubmitEdit(product.id, editPayload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Add product' : 'Edit product'}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Select a company first, then enter the product details for that catalog.'
              : 'Update product details in your catalog.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {isCreate && (
              <>
                {showCompanySelect ? (
                  <SelectField
                    name="companyId"
                    label="Company *"
                    options={companyOptions}
                    placeholder="Select company"
                  />
                ) : (
                  <>
                    <input type="hidden" {...form.register('companyId')} />
                    {companies.length === 1 && (
                      <p className="text-sm text-muted-foreground">
                        Company:{' '}
                        <span className="font-medium text-foreground">{companies[0].name}</span>
                      </p>
                    )}
                  </>
                )}
              </>
            )}

            <fieldset disabled={!canEditDetails} className="space-y-4 border-0 p-0 disabled:opacity-60">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Chlorine Tabs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. each, gallon" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sell price (USD) *</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Optional"
                          value={field.value ?? ''}
                          onChange={(event) => {
                            const value = event.target.value;
                            field.onChange(value === '' ? undefined : parseFloat(value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <SelectField
                name="categoryId"
                label="Category"
                options={categoryOptions}
                placeholder={canEditDetails ? 'Select category' : 'Select a company first'}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional description" className="resize-none" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isTaxable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Taxable</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {isTaxable && (
                <FormField
                  control={form.control}
                  name="defaultTaxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default tax rate (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {!isCreate && canManage && (
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Inactive products are hidden from active lists.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </fieldset>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || (isCreate && !canEditDetails)}>
                {isLoading ? 'Saving...' : isCreate ? 'Create product' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
