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

import { ReadingDefinition, UpdateReadingDefinitionRequest } from '@/ts/interfaces/ReadingGroups';

const updateReadingDefinitionSchema = z
  .object({
    name: z.string().min(1, 'settings.errors.nameRequiredShort').max(100, 'settings.errors.nameMax'),
    unit: z.string().min(1, 'settings.errors.unitRequired').max(20, 'settings.errors.unitMax'),
    minValue: z.coerce.number().optional(),
    maxValue: z.coerce.number().optional(),
    goalValue: z.coerce.number().optional(),
    step: z.coerce.number().positive('settings.errors.stepPositive').optional(),
    isRequired: z.boolean(),
    description: z.string().max(500, 'settings.errors.descriptionMax').optional()
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

interface EditReadingDefinitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readingDefinition: ReadingDefinition | null;
  onSubmit: (data: UpdateReadingDefinitionRequest) => void;
  isLoading: boolean;
}

export function EditReadingDefinitionDialog({
  open,
  onOpenChange,
  readingDefinition,
  onSubmit,
  isLoading
}: EditReadingDefinitionDialogProps) {
  const t = useTranslations('settings');

  const form = useForm<z.infer<typeof updateReadingDefinitionSchema>>({
    resolver: zodResolver(updateReadingDefinitionSchema),
    defaultValues: {
      name: '',
      unit: '',
      minValue: undefined,
      maxValue: undefined,
      goalValue: undefined,
      step: undefined,
      isRequired: false,
      description: ''
    }
  });

  useEffect(() => {
    if (readingDefinition) {
      form.reset({
        name: readingDefinition.name,
        unit: readingDefinition.unit,
        description: readingDefinition.description || '',
        isRequired: readingDefinition.isRequired,
        minValue: readingDefinition.minValue,
        maxValue: readingDefinition.maxValue,
        goalValue: readingDefinition.goalValue,
        step: readingDefinition.step
      });
    }
  }, [readingDefinition, form]);

  const handleSubmit = (data: z.infer<typeof updateReadingDefinitionSchema>) => {
    const submitData: UpdateReadingDefinitionRequest = {
      name: data.name,
      unit: data.unit,
      description: data.description || undefined,
      isRequired: data.isRequired,
      ...(data.minValue !== undefined && { minValue: data.minValue }),
      ...(data.maxValue !== undefined && { maxValue: data.maxValue }),
      ...(data.goalValue !== undefined && { goalValue: data.goalValue }),
      ...(data.step !== undefined && { step: data.step })
    };
    onSubmit(submitData);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  if (!readingDefinition) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('readings.editDefinition')}</DialogTitle>
          <DialogDescription>{t('readings.editDefinitionDescription')}</DialogDescription>
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
                      <Input placeholder={t('readings.namePlaceholder')} {...field} />
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
                      <Input placeholder={t('readings.unitPlaceholder')} {...field} />
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
                      placeholder={t('readings.definitionDescriptionPlaceholder')}
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
                name="goalValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('readings.goalValue')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder={t('fields.exampleThree')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="step"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.stepSize')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder={t('fields.exampleStep')} {...field} />
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
                    <FormLabel>{t('readings.requiredReading')}</FormLabel>
                    <p className="text-muted-foreground text-sm">
                      This reading must be recorded for every service report
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {t('actions.cancel')}
              </Button>

              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? t('actions.updating') : t('actions.updateDefinition')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
