'use client';

import { useTranslations } from 'next-intl';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

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
import { Checkbox } from '@/components/ui/checkbox';

import { ConsumableDefinition, UpdateConsumableDefinitionRequest } from '@/ts/interfaces/ConsumableGroups';

const updateConsumableDefinitionSchema = z
  .object({
    name: z.string().min(1, 'settings.errors.nameRequiredShort').max(100, 'settings.errors.nameMax'),
    unit: z.string().min(1, 'settings.errors.unitRequired').max(20, 'settings.errors.unitMax'),
    minValue: z.coerce.number().optional(),
    maxValue: z.coerce.number().optional(),
    step: z.coerce.number().positive('settings.errors.stepPositive').optional(),
    isRequired: z.boolean(),
    description: z.string().max(500, 'settings.errors.descriptionMax').optional(),
    pricePerUnit: z.coerce.number().min(0, 'settings.errors.priceNonNegative').optional()
  })
  .refine(
    (data) => {
      if (data.minValue !== undefined && data.maxValue !== undefined) {
        return data.minValue <= data.maxValue;
      }
      return true;
    },
    {
      message: 'settings.errors.minLteMax',
      path: ['maxValue']
    }
  );

interface EditConsumableDefinitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consumableDefinition: ConsumableDefinition | null;
  onSubmit: (data: UpdateConsumableDefinitionRequest) => void;
  isLoading: boolean;
}

export function EditConsumableDefinitionDialog({
  open,
  onOpenChange,
  consumableDefinition,
  onSubmit,
  isLoading
}: EditConsumableDefinitionDialogProps) {
  const t = useTranslations('settings');

  const form = useForm<z.infer<typeof updateConsumableDefinitionSchema>>({
    resolver: zodResolver(updateConsumableDefinitionSchema),
    defaultValues: {
      name: '',
      unit: '',
      minValue: undefined,
      maxValue: undefined,
      step: undefined,
      isRequired: false,
      description: '',
      pricePerUnit: undefined
    }
  });

  useEffect(() => {
    if (consumableDefinition) {
      form.reset({
        name: consumableDefinition.name,
        unit: consumableDefinition.unit,
        description: consumableDefinition.description || '',
        isRequired: consumableDefinition.isRequired,
        minValue: consumableDefinition.minValue,
        maxValue: consumableDefinition.maxValue,
        step: consumableDefinition.step,
        pricePerUnit: consumableDefinition.pricePerUnit
      });
    }
  }, [consumableDefinition, form]);

  const handleSubmit = (data: z.infer<typeof updateConsumableDefinitionSchema>) => {
    const submitData: UpdateConsumableDefinitionRequest = {
      name: data.name,
      unit: data.unit,
      description: data.description || undefined,
      isRequired: data.isRequired,
      ...(data.minValue !== undefined && { minValue: data.minValue }),
      ...(data.maxValue !== undefined && { maxValue: data.maxValue }),
      ...(data.step !== undefined && { step: data.step }),
      ...(data.pricePerUnit !== undefined && { pricePerUnit: data.pricePerUnit })
    };
    onSubmit(submitData);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  if (!consumableDefinition) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('consumables.editDefinition')}</DialogTitle>
          <DialogDescription>{t('consumables.editDefinitionDescription')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.nameRequired')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('consumables.namePlaceholder')} {...field} />
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
                    <FormLabel>{t('fields.unitRequired')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('consumables.unitPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('consumables.definitionDescriptionPlaceholder')}
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.minimumValue')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder={t('fields.exampleZero')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.maximumValue')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder={t('fields.exampleTen')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="step"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.stepSize')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder={t('consumables.stepPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pricePerUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('consumables.pricePerUnit')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder={t('consumables.pricePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{t('consumables.required')}</FormLabel>
                    <p className="text-muted-foreground text-sm">
                      This consumable must be recorded for every service report
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('actions.updating') : t('actions.updateDefinition')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
