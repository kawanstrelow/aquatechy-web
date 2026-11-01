'use client';

import { useTranslations } from 'next-intl';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

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
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { CreateSelectorGroupRequest, CreateSelectorGroupDefinitionRequest } from '@/ts/interfaces/SelectorGroups';

/** API: lengths on trimmed strings */
const SELECTOR_LIMITS = {
  groupName: { min: 1, max: 100 },
  groupDescription: { max: 500 },
  definitionQuestion: { min: 1, max: 200 },
  optionText: { min: 1, max: 50 },
  optionValue: { min: 1, max: 50 }
} as const;

function generateSelectorOptionValueFromText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

const selectorGroupNameSchema = z
  .string()
  .trim()
  .min(SELECTOR_LIMITS.groupName.min, 'settings.errors.nameRequiredShort')
  .max(SELECTOR_LIMITS.groupName.max, 'settings.errors.nameMax');

const selectorDefinitionQuestionSchema = z
  .string()
  .trim()
  .min(SELECTOR_LIMITS.definitionQuestion.min, 'settings.errors.questionRequired')
  .max(SELECTOR_LIMITS.definitionQuestion.max, 'settings.errors.questionMax');

const selectorOptionTextSchema = z
  .string()
  .trim()
  .min(SELECTOR_LIMITS.optionText.min, 'settings.errors.displayTextRequired')
  .max(SELECTOR_LIMITS.optionText.max, 'settings.errors.displayTextMax');

const nonNegativeOrderSchema = z.number().int().min(0, 'settings.errors.orderMin');

const createSelectorGroupSchema = z
  .object({
    name: selectorGroupNameSchema,
    description: z.string().trim().max(SELECTOR_LIMITS.groupDescription.max, 'settings.errors.descriptionMaxDynamic'),
    isDefault: z.boolean().optional(),
    selectorDefinitions: z
      .array(
        z.object({
          question: selectorDefinitionQuestionSchema,
          isRequired: z.boolean().optional(),
          order: nonNegativeOrderSchema,
          options: z
            .array(
              z.object({
                text: selectorOptionTextSchema,
                order: nonNegativeOrderSchema
              })
            )
            .optional()
        })
      )
      .optional()
  })
  .superRefine((data, ctx) => {
    data.selectorDefinitions?.forEach((def, di) => {
      def.options?.forEach((opt, oi) => {
        const value = generateSelectorOptionValueFromText(opt.text);
        if (value.length < SELECTOR_LIMITS.optionValue.min || value.length > SELECTOR_LIMITS.optionValue.max) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              value.length > SELECTOR_LIMITS.optionValue.max
                ? `Value is too long (max ${SELECTOR_LIMITS.optionValue.max} characters). Shorten this option's text.`
                : 'settings.errors.displayTextProduce',
            path: ['selectorDefinitions', di, 'options', oi, 'text']
          });
        }
      });
    });
  });

type CreateSelectorGroupFormData = z.infer<typeof createSelectorGroupSchema>;

interface CreateSelectorGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateSelectorGroupRequest) => void;
  isLoading?: boolean;
}

export function CreateSelectorGroupDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false
}: CreateSelectorGroupDialogProps) {
  const t = useTranslations('settings');

  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<CreateSelectorGroupFormData>({
    resolver: zodResolver(createSelectorGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      isDefault: false,
      selectorDefinitions: []
    }
  });

  const {
    fields: definitionFields,
    append: appendDefinition,
    remove: removeDefinition
  } = useFieldArray({
    control: form.control,
    name: 'selectorDefinitions'
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        description: '',
        isDefault: false,
        selectorDefinitions: []
      });
      setShowAdvanced(false);
    }
  }, [open, form]);

  const handleSubmit = (data: CreateSelectorGroupFormData) => {
    const requestData: CreateSelectorGroupRequest = {
      name: data.name.trim(),
      description: data.description?.trim() ? data.description.trim() : undefined,
      isDefault: data.isDefault,
      order: 0 // Will be set by backend
    };

    // Process selector definitions if provided
    if (data.selectorDefinitions && data.selectorDefinitions.length > 0) {
      requestData.selectorDefinitions = data.selectorDefinitions.map((def, defIndex) => {
        const definition: CreateSelectorGroupDefinitionRequest = {
          question: def.question.trim(),
          isRequired: def.isRequired || false,
          order: defIndex
        };

        // Process options if provided
        if (def.options && def.options.length > 0) {
          definition.options = def.options.map((option, optionIndex) => ({
            text: option.text.trim(),
            value: generateSelectorOptionValueFromText(option.text),
            order: optionIndex
          }));
        }

        return definition;
      });
    }

    onSubmit(requestData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{t('selectors.createGroup')}</DialogTitle>
          <DialogDescription>
            Create a new selector group to organize questions for your services. You can optionally add questions and
            options now or add them later.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.nameRequired')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('selectors.groupPlaceholder')}
                        disabled={isLoading}
                        maxLength={SELECTOR_LIMITS.groupName.max}
                        {...field}
                      />
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
                    <FormLabel>{t('fields.description')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('selectors.groupDescriptionPlaceholder')}
                        className="resize-none"
                        disabled={isLoading}
                        maxLength={SELECTOR_LIMITS.groupDescription.max}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>{t('selectors.defaultGroup')}</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Make this the default selector group for new services
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              /> */}
            </div>

            <Separator />

            {/* Advanced Options */}
            <div className="space-y-4">
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-medium">{t('selectors.questionsAndOptions')}</h3>
                  <p className="text-muted-foreground text-sm">{t('selectors.addQuestionsHint')}</p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  disabled={isLoading}
                  className="mt-2 w-full sm:mt-0 sm:w-auto"
                >
                  {showAdvanced ? t('actions.hide') : t('selectors.addQuestions')}
                </Button>
              </div>

              {showAdvanced && (
                <div className="space-y-4">
                  {definitionFields.map((field, index) => (
                    <Card key={field.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Question {index + 1}</CardTitle>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDefinition(index)}
                            disabled={isLoading}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name={`selectorDefinitions.${index}.question`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('fields.questionRequired')}</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={t('selectors.questionPlaceholder')}
                                  disabled={isLoading}
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
                          name={`selectorDefinitions.${index}.isRequired`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>{t('selectors.requiredQuestionLower')}</FormLabel>
                                <p className="text-muted-foreground text-sm">{t('selectors.questionRequiredHint')}</p>
                              </div>
                            </FormItem>
                          )}
                        />

                        {/* Options for this question */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">{t('fields.options')}</label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentOptions = form.getValues(`selectorDefinitions.${index}.options`) || [];
                                form.setValue(`selectorDefinitions.${index}.options`, [
                                  ...currentOptions,
                                  { text: '', order: currentOptions.length }
                                ]);
                              }}
                              disabled={isLoading}
                            >
                              <Plus className="mr-1 h-4 w-4" />
                              {t('selectors.addOption')}
                            </Button>
                          </div>

                          {form.watch(`selectorDefinitions.${index}.options`)?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <GripVertical className="text-muted-foreground h-4 w-4" />
                              <FormField
                                control={form.control}
                                name={`selectorDefinitions.${index}.options.${optionIndex}.text`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input
                                        placeholder={t('selectors.optionPlaceholder')}
                                        disabled={isLoading}
                                        maxLength={SELECTOR_LIMITS.optionText.max}
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const currentOptions = form.getValues(`selectorDefinitions.${index}.options`) || [];
                                  const newOptions = currentOptions.filter((_, i) => i !== optionIndex);
                                  form.setValue(`selectorDefinitions.${index}.options`, newOptions);
                                }}
                                disabled={isLoading}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )) || []}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      appendDefinition({
                        question: '',
                        isRequired: false,
                        order: definitionFields.length,
                        options: []
                      })
                    }
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('selectors.addQuestion')}
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('actions.creating') : t('selectors.createGroup')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
