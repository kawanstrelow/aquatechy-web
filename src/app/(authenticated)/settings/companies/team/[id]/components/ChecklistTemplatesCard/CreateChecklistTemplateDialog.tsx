'use client';

import { useTranslations } from 'next-intl';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

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
import { Plus, Trash2, GripVertical } from 'lucide-react';

import { CreateChecklistTemplateRequest } from '@/ts/interfaces/ChecklistTemplates';

const checklistItemSchema = z.object({
  label: z.string().min(1, 'settings.errors.labelRequired').max(100, 'settings.errors.labelMax'),
  order: z.number().min(1)
});

const createChecklistTemplateSchema = z.object({
  name: z.string().min(1, 'settings.errors.nameRequiredShort').max(100, 'settings.errors.nameMax'),
  description: z.string().max(500, 'settings.errors.descriptionMax').optional(),
  isDefault: z.boolean().default(false),
  items: z.array(checklistItemSchema).min(1, 'settings.errors.checklistItemRequired')
});

interface CreateChecklistTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateChecklistTemplateRequest) => void;
  isLoading: boolean;
  companyId: string;
}

export function CreateChecklistTemplateDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  companyId
}: CreateChecklistTemplateDialogProps) {
  const t = useTranslations('settings');

  const form = useForm<z.infer<typeof createChecklistTemplateSchema>>({
    resolver: zodResolver(createChecklistTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      isDefault: false,
      items: [{ label: '', order: 1 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  });

  const handleSubmit = (data: z.infer<typeof createChecklistTemplateSchema>) => {
    const requestData: CreateChecklistTemplateRequest = {
      companyId,
      name: data.name,
      description: data.description || undefined,
      isDefault: data.isDefault,
      items: data.items.map((item, index) => ({
        label: item.label,
        order: index + 1
      }))
    };
    onSubmit(requestData);
  };

  const addItem = () => {
    append({
      label: '',
      order: fields.length + 1
    });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('checklists.createTitle')}</DialogTitle>
          <DialogDescription>{t('checklists.createDescription')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('checklists.templateName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('checklists.namePlaceholder')} {...field} />
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
                      placeholder={t('checklists.descriptionPlaceholder')}
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>{t('checklists.itemsRequired')}</FormLabel>
                <Button type="button" onClick={addItem} size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('checklists.addItem')}
                </Button>
              </div>

              <div className="max-h-60 space-y-3 overflow-y-auto">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2 rounded-lg border p-3">
                    <GripVertical className="text-muted-foreground mt-2 h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.label`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder={t('checklists.itemPlaceholder', { index: index + 1 })} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeItem(index)}
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('actions.creating') : t('checklists.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
