'use client';

import { useTranslations } from 'next-intl';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import React from 'react';

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

import { SelectorOption, UpdateSelectorOptionRequest, SelectorDefinition } from '@/ts/interfaces/SelectorGroups';

const SELECTOR_LIMITS = {
  optionText: { min: 1, max: 50 },
  optionValue: { min: 1, max: 50 }
} as const;

const selectorOptionTextSchema = z
  .string()
  .trim()
  .min(SELECTOR_LIMITS.optionText.min, 'settings.errors.displayTextRequired')
  .max(SELECTOR_LIMITS.optionText.max, 'settings.errors.displayTextMax');

const selectorOptionValueSchema = z
  .string()
  .trim()
  .min(SELECTOR_LIMITS.optionValue.min, 'settings.errors.valueRequired')
  .max(SELECTOR_LIMITS.optionValue.max, 'settings.errors.valueMax');

const nonNegativeOrderSchema = z.number().int().min(0, 'settings.errors.orderMin');

const updateSelectorOptionSchema = z.object({
  text: selectorOptionTextSchema,
  value: selectorOptionValueSchema,
  order: nonNegativeOrderSchema
});

type UpdateSelectorOptionFormData = z.infer<typeof updateSelectorOptionSchema>;

interface EditSelectorOptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectorOption: SelectorOption | null;
  onSubmit: (data: UpdateSelectorOptionRequest) => void;
  isLoading?: boolean;
  selectorDefinition: SelectorDefinition;
}

export function EditSelectorOptionDialog({
  open,
  onOpenChange,
  selectorOption,
  onSubmit,
  isLoading = false,
  selectorDefinition
}: EditSelectorOptionDialogProps) {
  const t = useTranslations('settings');

  const form = useForm<UpdateSelectorOptionFormData>({
    resolver: zodResolver(updateSelectorOptionSchema),
    defaultValues: {
      text: selectorOption?.text || '',
      value: selectorOption?.value || '',
      order: selectorOption?.order || 0
    }
  });

  // Update form when selectorOption changes
  React.useEffect(() => {
    if (selectorOption) {
      form.reset({
        text: selectorOption.text,
        value: selectorOption.value,
        order: selectorOption.order
      });
    }
  }, [selectorOption, form]);

  const handleSubmit = (data: UpdateSelectorOptionFormData) => {
    onSubmit({
      text: data.text.trim(),
      value: data.value.trim(),
      order: data.order
    });
  };

  if (!selectorOption) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('selectors.editOption')}</DialogTitle>
          <DialogDescription>Update the option for: "{selectorDefinition.question}"</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('selectors.displayText')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('selectors.optionExamplesShort')}
                      maxLength={SELECTOR_LIMITS.optionText.max}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('actions.updating') : t('selectors.updateOption')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
