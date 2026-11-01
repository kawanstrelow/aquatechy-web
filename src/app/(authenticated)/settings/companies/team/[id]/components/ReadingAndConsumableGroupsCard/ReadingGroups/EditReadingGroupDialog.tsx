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
import { Switch } from '@/components/ui/switch';

import { ReadingGroup, UpdateReadingGroupRequest } from '@/ts/interfaces/ReadingGroups';

const updateReadingGroupSchema = z.object({
  name: z.string().min(1, 'settings.errors.nameRequiredShort').max(100, 'settings.errors.nameMax'),
  description: z.string().max(500, 'settings.errors.descriptionMax').optional(),
  isActive: z.boolean()
});

interface EditReadingGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readingGroup: ReadingGroup | null;
  onSubmit: (data: UpdateReadingGroupRequest) => void;
  isLoading: boolean;
}

export function EditReadingGroupDialog({
  open,
  onOpenChange,
  readingGroup,
  onSubmit,
  isLoading
}: EditReadingGroupDialogProps) {
  const t = useTranslations('settings');

  const form = useForm<z.infer<typeof updateReadingGroupSchema>>({
    resolver: zodResolver(updateReadingGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true
    }
  });

  useEffect(() => {
    if (readingGroup) {
      form.reset({
        name: readingGroup.name,
        description: readingGroup.description || '',
        isActive: readingGroup.isActive
      });
    }
  }, [readingGroup, form]);

  const handleSubmit = (data: z.infer<typeof updateReadingGroupSchema>) => {
    onSubmit(data);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  if (!readingGroup) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('readings.editGroup')}</DialogTitle>
          <DialogDescription>{t('readings.editGroupDescription')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.nameRequired')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('readings.groupPlaceholder')} {...field} />
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
                      placeholder={t('readings.groupDescriptionPlaceholder')}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t('statuses.Active')}
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {readingGroup.isDefault
                        ? t('groups.defaultCannotDeactivate')
                        : t('groups.deactivateHint')
                      }
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={readingGroup.isDefault}
                    />
                  </FormControl>
                </FormItem>
              )}
            /> */}

            <DialogFooter className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('actions.updating') : t('actions.updateGroup')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
