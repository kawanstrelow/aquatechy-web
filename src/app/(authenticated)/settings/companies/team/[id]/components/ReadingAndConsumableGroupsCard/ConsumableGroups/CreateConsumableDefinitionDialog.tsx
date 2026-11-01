'use client';

import { useTranslations } from 'next-intl';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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

import { CreateConsumableDefinitionRequest } from '@/ts/interfaces/ConsumableGroups';

const createConsumableDefinitionSchema = z
  .object({
    name: z.string().min(1, 'settings.errors.nameRequiredShort').max(100, 'settings.errors.nameMax'),
    unit: z.string().min(1, 'settings.errors.unitRequired').max(20, 'settings.errors.unitMax'),
    minValue: z.coerce.number({
      required_error: 'settings.errors.minValueRequired',
      message: 'settings.errors.minValueRequired'
    }),
    maxValue: z.coerce.number({
      required_error: 'settings.errors.maxValueRequired',
      message: 'settings.errors.minValueRequired'
    }),
    step: z.coerce
      .number({ required_error: 'settings.errors.stepRequired', message: 'settings.errors.stepRequired' })
      .positive('settings.errors.stepPositive'),
    isRequired: z.boolean().default(false),
    description: z.string().max(500, 'settings.errors.descriptionMax').optional(),
    pricePerUnit: z.coerce
      .number({
        required_error: 'settings.errors.pricePerUnitRequired',
        message: 'settings.errors.pricePerUnitRequired'
      })
      .min(0, 'settings.errors.priceNonNegative')
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

interface CreateConsumableDefinitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateConsumableDefinitionRequest) => void;
  isLoading: boolean;
}

export function CreateConsumableDefinitionDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading
}: CreateConsumableDefinitionDialogProps) {
  const t = useTranslations('settings');

  const form = useForm<z.infer<typeof createConsumableDefinitionSchema>>({
    resolver: zodResolver(createConsumableDefinitionSchema),
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

  const handleSubmit = (data: z.infer<typeof createConsumableDefinitionSchema>) => {
    const submitData: CreateConsumableDefinitionRequest = {
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('consumables.createDefinition')}</DialogTitle>
          <DialogDescription>{t('consumables.createDefinitionDescription')}</DialogDescription>
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
                {isLoading ? t('actions.creating') : t('actions.createDefinition')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
