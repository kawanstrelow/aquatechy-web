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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

import { SelectorGroup, UpdateSelectorGroupRequest } from '@/ts/interfaces/SelectorGroups';

const SELECTOR_LIMITS = {
  groupName: { min: 1, max: 100 },
  groupDescription: { max: 500 }
} as const;

const selectorGroupNameSchema = z
  .string()
  .trim()
  .min(SELECTOR_LIMITS.groupName.min, 'settings.errors.nameRequiredShort')
  .max(SELECTOR_LIMITS.groupName.max, 'settings.errors.nameMax');

const updateSelectorGroupSchema = z.object({
  name: selectorGroupNameSchema,
  description: z.string().trim().max(SELECTOR_LIMITS.groupDescription.max, 'settings.errors.descriptionMaxDynamic'),
  isActive: z.boolean()
});

type UpdateSelectorGroupFormData = z.infer<typeof updateSelectorGroupSchema>;

interface EditSelectorGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectorGroup: SelectorGroup | null;
  onSubmit: (data: UpdateSelectorGroupRequest) => void;
  isLoading?: boolean;
}

export function EditSelectorGroupDialog({
  open,
  onOpenChange,
  selectorGroup,
  onSubmit,
  isLoading = false
}: EditSelectorGroupDialogProps) {
  const t = useTranslations('settings');

  const form = useForm<UpdateSelectorGroupFormData>({
    resolver: zodResolver(updateSelectorGroupSchema),
    defaultValues: {
      name: selectorGroup?.name || '',
      description: selectorGroup?.description || '',
      isActive: selectorGroup?.isActive ?? true
    }
  });

  // Update form when selectorGroup changes
  React.useEffect(() => {
    if (selectorGroup) {
      form.reset({
        name: selectorGroup.name,
        description: selectorGroup.description || '',
        isActive: selectorGroup.isActive
      });
    }
  }, [selectorGroup, form]);

  const handleSubmit = (data: UpdateSelectorGroupFormData) => {
    onSubmit({
      name: data.name.trim(),
      description: data.description?.trim() ? data.description.trim() : undefined,
      isActive: data.isActive
    });
  };

  if (!selectorGroup) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('selectors.editGroup')}</DialogTitle>
          <DialogDescription>{t('selectors.editGroupDescription')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('selectors.groupPlaceholder')}
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
                      maxLength={SELECTOR_LIMITS.groupDescription.max}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>{t('statuses.Active')}</FormLabel>
                    <div className="text-muted-foreground text-sm">{t('selectors.enableDisable')}</div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('actions.updating') : t('selectors.updateGroup')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
