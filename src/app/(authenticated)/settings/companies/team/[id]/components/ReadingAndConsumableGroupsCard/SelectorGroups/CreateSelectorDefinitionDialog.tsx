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
import { Switch } from '@/components/ui/switch';

import { CreateSelectorDefinitionRequest } from '@/ts/interfaces/SelectorGroups';

const SELECTOR_LIMITS = {
  definitionQuestion: { min: 1, max: 200 }
} as const;

const selectorDefinitionQuestionSchema = z
  .string()
  .trim()
  .min(SELECTOR_LIMITS.definitionQuestion.min, 'settings.errors.questionRequired')
  .max(SELECTOR_LIMITS.definitionQuestion.max, 'settings.errors.questionMax');

const createSelectorDefinitionSchema = z.object({
  question: selectorDefinitionQuestionSchema,
  isRequired: z.boolean()
});

type CreateSelectorDefinitionFormData = z.infer<typeof createSelectorDefinitionSchema>;

interface CreateSelectorDefinitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateSelectorDefinitionRequest) => void;
  isLoading?: boolean;
  selectorGroupName: string;
}

export function CreateSelectorDefinitionDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  selectorGroupName
}: CreateSelectorDefinitionDialogProps) {
  const t = useTranslations('settings');

  const form = useForm<CreateSelectorDefinitionFormData>({
    resolver: zodResolver(createSelectorDefinitionSchema),
    defaultValues: {
      question: '',
      isRequired: false
    }
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        question: '',
        isRequired: false
      });
    }
  }, [open, form]);

  const handleSubmit = (data: CreateSelectorDefinitionFormData) => {
    onSubmit({
      question: data.question.trim(),
      isRequired: data.isRequired
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('selectors.createDefinition')}</DialogTitle>
          <DialogDescription>
            Add a new question with multiple choice options to "{selectorGroupName}".
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.questionRequired')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('selectors.definitionPlaceholder')}
                      maxLength={SELECTOR_LIMITS.definitionQuestion.max}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>{t('selectors.requiredQuestion')}</FormLabel>
                    <div className="text-muted-foreground text-sm">
                      Make this question mandatory for service completion
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('actions.creating') : t('selectors.createQuestion')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
