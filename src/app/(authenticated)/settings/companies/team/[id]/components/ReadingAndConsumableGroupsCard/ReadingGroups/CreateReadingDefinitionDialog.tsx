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

import { CreateReadingDefinitionRequest } from '@/ts/interfaces/ReadingGroups';

const createReadingDefinitionSchema = z
  .object({
    name: z.string().min(1, 'settings.errors.nameRequiredShort').max(100, 'settings.errors.nameMax'),
    unit: z.string().min(1, 'settings.errors.unitRequired').max(20, 'settings.errors.unitMax'),
    minValue: z.coerce.number({
      required_error: 'settings.errors.minValueRequired',
      message: 'settings.errors.minValueRequired'
    }),
    maxValue: z.coerce.number({
      required_error: 'settings.errors.maxValueRequired',
      message: 'settings.errors.maxValueRequired'
    }),
    goalValue: z.coerce.number().optional(),
    step: z.coerce
      .number({
        required_error: 'settings.errors.stepRequired',
        message: 'settings.errors.stepRequired'
      })
      .positive('settings.errors.stepPositive'),
    isRequired: z.boolean().default(false),
    description: z
      .string({
        required_error: 'settings.errors.descriptionRequired',
        message: 'settings.errors.descriptionRequired'
      })
      .max(500, 'settings.errors.descriptionMax')
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

interface CreateReadingDefinitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateReadingDefinitionRequest) => void;
  isLoading: boolean;
}

export function CreateReadingDefinitionDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading
}: CreateReadingDefinitionDialogProps) {
  const t = useTranslations('settings');

  const form = useForm<z.infer<typeof createReadingDefinitionSchema>>({
    resolver: zodResolver(createReadingDefinitionSchema),
    defaultValues: {
      goalValue: undefined,
      step: undefined,
      isRequired: false,
      description: ''
    }
  });

  const handleSubmit = (data: z.infer<typeof createReadingDefinitionSchema>) => {
    const submitData: CreateReadingDefinitionRequest = {
      name: data.name,
      unit: data.unit,
      description: data.description || undefined,
      isRequired: data.isRequired,
      ...(data.minValue !== undefined && data.minValue !== null && { minValue: data.minValue }),
      ...(data.maxValue !== undefined && data.maxValue !== null && { maxValue: data.maxValue }),
      ...(data.goalValue !== undefined && { goalValue: data.goalValue }),
      ...(data.step !== undefined && data.step !== null && { step: data.step })
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
          <DialogTitle>{t('readings.createDefinition')}</DialogTitle>
          <DialogDescription>{t('readings.createDefinitionDescription')}</DialogDescription>
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
                    {/* <FormMessage /> */}
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
                    {/* <FormMessage /> */}
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
                  {/* <FormMessage /> */}
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
                    {/* <FormMessage /> */}
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
                    {/* <FormMessage /> */}
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
                    {/* <FormMessage /> */}
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
                    {/* <FormMessage /> */}
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
