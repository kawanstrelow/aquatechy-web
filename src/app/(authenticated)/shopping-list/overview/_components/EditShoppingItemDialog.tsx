'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import SelectField from '@/components/SelectField';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import useGetProductCategories from '@/hooks/react-query/products/useGetProductCategories';
import useGetProducts from '@/hooks/react-query/products/useGetProducts';
import useGetRequestsByPool from '@/hooks/react-query/requests/getRequestsByPool';
import { useUpdateShoppingItemStatus } from '@/hooks/react-query/shopping-items/useUpdateShoppingItemStatus';
import { ShoppingListRow, UpdateShoppingItemRequest } from '@/ts/interfaces/Shopping';

import { NO_REQUEST, requestOptionLabel } from './requestOptionLabel';

const schema = z.object({
  categoryFilter: z.string().optional(),
  productId: z.string().min(1, 'shopping.validation.productRequired'),
  quantity: z.coerce
    .number({ invalid_type_error: 'shopping.validation.quantityMin' })
    .refine((value) => Number.isFinite(value) && value > 0, 'shopping.validation.quantityMin'),
  notes: z.string().max(1000, 'shopping.validation.notesMax'),
  requestId: z.string()
});

type FormValues = z.infer<typeof schema>;

export type UpdateShoppingItemParams = {
  shoppingItemId: string;
  data: UpdateShoppingItemRequest;
};

interface EditShoppingItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ShoppingListRow | null;
  onSubmit: (params: UpdateShoppingItemParams) => void;
  isLoading: boolean;
}

function requestLinkValue(requestId: string | null | undefined) {
  return requestId || NO_REQUEST;
}

function buildUpdatePayload(item: ShoppingListRow, data: FormValues): UpdateShoppingItemRequest {
  const payload: UpdateShoppingItemRequest = {};

  if (data.quantity !== item.quantity) {
    payload.quantity = data.quantity;
  }

  if (data.productId !== item.productId) {
    payload.productId = data.productId;
  }

  const nextNotes = data.notes.trim();
  if (nextNotes !== (item.notes ?? '')) {
    payload.notes = nextNotes;
  }

  const nextRequestId = data.requestId === NO_REQUEST ? null : data.requestId;
  if (nextRequestId !== (item.requestId ?? null)) {
    payload.requestId = nextRequestId;
  }

  return payload;
}

function hasShoppingItemChanges(
  item: ShoppingListRow,
  values: { productId: string; quantity: number | string; notes: string; requestId: string }
): boolean {
  const quantity = typeof values.quantity === 'number' ? values.quantity : Number(values.quantity);
  const quantityChanged = !Number.isFinite(quantity) || quantity !== item.quantity;
  const productChanged = values.productId !== item.productId;
  const notesChanged = (values.notes ?? '').trim() !== (item.notes ?? '');
  const requestChanged = values.requestId !== requestLinkValue(item.requestId);

  return quantityChanged || productChanged || notesChanged || requestChanged;
}

export function EditShoppingItemDialog({ open, onOpenChange, item, onSubmit, isLoading }: EditShoppingItemDialogProps) {
  const t = useTranslations('shopping');
  const common = useTranslations('common');
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryFilter: 'all',
      productId: '',
      quantity: 1,
      notes: '',
      requestId: NO_REQUEST
    }
  });

  const categoryFilter = form.watch('categoryFilter');
  const productId = form.watch('productId');
  const quantity = form.watch('quantity');
  const notes = form.watch('notes');
  const requestId = form.watch('requestId');
  const companyId = open && item ? item.companyOwnerId : '';
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const { mutateAsync: updateStatus, isPending: isUpdatingPhotos } = useUpdateShoppingItemStatus(companyId);
  const requestsQuery = useGetRequestsByPool(open && item ? item.poolId : null);

  const categoriesQuery = useGetProductCategories({
    companyId
  });

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoriesQuery.data?.productCategories.forEach((category) => {
      map[category.id] = category.name;
    });
    return map;
  }, [categoriesQuery.data?.productCategories]);

  const productsQuery = useGetProducts({
    companyId,
    activeOnly: true,
    categoryId:
      categoryFilter && categoryFilter !== 'all' && categoryFilter !== 'uncategorized' ? categoryFilter : null,
    uncategorizedOnly: categoryFilter === 'uncategorized',
    categoryMap
  });

  useEffect(() => {
    if (!open || !item) return;

    form.reset({
      categoryFilter: 'all',
      productId: item.productId,
      quantity: item.quantity,
      notes: item.notes ?? '',
      requestId: requestLinkValue(item.requestId)
    });
    setPhotoFiles([]);
  }, [open, item, form]);

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

  const productOptions = useMemo(() => {
    const products = productsQuery.data ?? [];
    const options = products.map((product) => ({
      key: product.id,
      value: product.id,
      name: product.name
    }));

    const keepCurrentProduct =
      !!item &&
      !options.some((option) => option.value === item.productId) &&
      (categoryFilter === 'all' || !categoryFilter || productId === item.productId);

    if (item && keepCurrentProduct) {
      options.unshift({
        key: item.productId,
        value: item.productId,
        name: item.product.isActive ? item.product.name : t('inactiveSuffix', { name: item.product.name })
      });
    }

    return options;
  }, [productsQuery.data, item, productId, categoryFilter, t]);

  const requestOptions = useMemo(() => {
    const options = [{ key: NO_REQUEST, value: NO_REQUEST, name: t('editDialog.noRequest') }];
    const requests = requestsQuery.data ?? [];

    requests.forEach((request) => {
      options.push({
        key: request.id,
        value: request.id,
        name: requestOptionLabel(request)
      });
    });

    if (item?.requestId && !options.some((option) => option.value === item.requestId)) {
      options.push({
        key: item.requestId,
        value: item.requestId,
        name: t('linkedRequest')
      });
    }

    return options;
  }, [item?.requestId, requestsQuery.data, t]);

  const hasChanges = item
    ? hasShoppingItemChanges(item, { productId, quantity, notes, requestId })
    : false;

  const handleUpdatePhotos = async () => {
    if (!item || photoFiles.length === 0) return;
    await updateStatus({
      shoppingItemId: item.id,
      data: { status: 'Installed' },
      photos: photoFiles
    });
    setPhotoFiles([]);
  };

  const handleSubmit = (data: FormValues) => {
    if (!item) return;

    const payload = buildUpdatePayload(item, data);
    if (Object.keys(payload).length === 0) return;

    onSubmit({
      shoppingItemId: item.id,
      data: payload
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t('editDialog.title')}</DialogTitle>
        </DialogHeader>

        {item && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <SelectField
                name="categoryFilter"
                label={t('addDialog.category')}
                options={categoryFilterOptions}
                placeholder={
                  categoriesQuery.isLoading ? t('addDialog.loadingCategories') : t('addDialog.filterByCategory')
                }
                disabled={categoriesQuery.isLoading}
                onValueChange={() => {
                  form.setValue('productId', '');
                }}
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
                    productsQuery.isLoading
                      ? t('addDialog.loadingProducts')
                      : productOptions.length === 0
                        ? t('addDialog.noProductsInCategory')
                        : t('addDialog.selectProduct')
                  }
                  disabled={productsQuery.isLoading || productOptions.length === 0}
                />
              </div>

              <SelectField
                name="requestId"
                label={t('editDialog.requestAttached')}
                options={requestOptions}
                placeholder={requestsQuery.isLoading ? t('editDialog.loadingRequests') : t('editDialog.selectRequest')}
                disabled={requestsQuery.isLoading}
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

              {(item.installPhotos?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t('installPhotos')}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {item.installPhotos.map((photo) => (
                      <img key={photo} src={photo} alt="" className="aspect-square w-full rounded object-cover" />
                    ))}
                  </div>
                </div>
              )}

              {item.status === 'Installed' && (
                <div className="space-y-2">
                  <Label htmlFor="replace-install-photos">{t('replaceInstallPhotos')}</Label>
                  <Input
                    id="replace-install-photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => setPhotoFiles(Array.from(event.target.files ?? []))}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUpdatingPhotos || photoFiles.length === 0}
                    onClick={handleUpdatePhotos}
                  >
                    {isUpdatingPhotos ? t('updatingPhotos') : t('updatePhotos')}
                  </Button>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                  {common('cancel')}
                </Button>
                <Button type="submit" disabled={isLoading || !hasChanges || productOptions.length === 0}>
                  {isLoading ? t('editDialog.saving') : t('editDialog.saveChanges')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
