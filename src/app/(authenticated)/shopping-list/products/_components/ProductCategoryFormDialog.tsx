'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';
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
import { CreateProductCategoryParams } from '@/hooks/react-query/products/useCreateProductCategory';
import { CompanyWithMyRole } from '@/ts/interfaces/Company';

const schema = z.object({
  companyId: z.string().min(1, 'shopping.validation.companyRequired'),
  name: z.string().trim().min(1, 'shopping.validation.nameRequired').max(100, 'shopping.validation.nameMax100'),
  description: z.string().max(500, 'shopping.validation.descriptionMax500').optional()
});

interface ProductCategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageCompanyId: string;
  companies: CompanyWithMyRole[];
  onSubmit: (params: CreateProductCategoryParams) => void;
  isLoading: boolean;
}

export function ProductCategoryFormDialog({
  open,
  onOpenChange,
  pageCompanyId,
  companies,
  onSubmit,
  isLoading
}: ProductCategoryFormDialogProps) {
  const t = useTranslations('shopping');
  const common = useTranslations('common');
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyId: pageCompanyId,
      name: '',
      description: ''
    }
  });

  const selectedCompanyId = form.watch('companyId');
  const effectiveCompanyId = selectedCompanyId || pageCompanyId;

  useEffect(() => {
    if (open) {
      form.reset({
        companyId: pageCompanyId,
        name: '',
        description: ''
      });
    }
  }, [open, pageCompanyId, form]);

  const companyOptions = useMemo(
    () =>
      companies.map((company) => ({
        key: company.id,
        value: company.id,
        name: company.name
      })),
    [companies]
  );

  const showCompanySelect = companies.length > 1;
  const canEditDetails = !!effectiveCompanyId;

  const handleSubmit = (data: z.infer<typeof schema>) => {
    onSubmit({
      companyId: data.companyId,
      data: {
        name: data.name,
        description: data.description?.trim() || undefined
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('categoryDialog.title')}</DialogTitle>
          <DialogDescription>{t('categoryDialog.description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {showCompanySelect ? (
              <SelectField
                name="companyId"
                label={t('categoryDialog.company')}
                options={companyOptions}
                placeholder={t('categoryDialog.selectCompany')}
              />
            ) : (
              <>
                <input type="hidden" {...form.register('companyId')} />
                {companies.length === 1 && (
                  <p className="text-muted-foreground text-sm">
                    {t('categoryDialog.companyLabel')}{' '}
                    <span className="text-foreground font-medium">{companies[0].name}</span>
                  </p>
                )}
              </>
            )}

            <fieldset disabled={!canEditDetails} className="space-y-4 border-0 p-0 disabled:opacity-60">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('categoryDialog.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('categoryDialog.namePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('categoryDialog.descriptionLabel')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('categoryDialog.descriptionPlaceholder')}
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                {common('cancel')}
              </Button>
              <Button type="submit" disabled={isLoading || !canEditDetails}>
                {isLoading ? t('categoryDialog.creating') : t('categoryDialog.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
