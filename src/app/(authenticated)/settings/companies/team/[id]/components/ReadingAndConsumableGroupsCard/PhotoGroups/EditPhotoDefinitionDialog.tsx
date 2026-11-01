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

import { PhotoDefinition, UpdatePhotoDefinitionRequest } from '@/ts/interfaces/PhotoGroups';

const updatePhotoDefinitionSchema = z.object({
  name: z.string().min(1, 'settings.errors.nameRequiredShort').max(100, 'settings.errors.nameMax'),
  description: z.string().max(500, 'settings.errors.descriptionMax').optional(),
  isRequired: z.boolean(),
  allowGallery: z.boolean(),
  sendOnEmail: z.boolean()
});

interface EditPhotoDefinitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoDefinition: PhotoDefinition | null;
  onSubmit: (data: UpdatePhotoDefinitionRequest) => void;
  isLoading: boolean;
}

export function EditPhotoDefinitionDialog({
  open,
  onOpenChange,
  photoDefinition,
  onSubmit,
  isLoading
}: EditPhotoDefinitionDialogProps) {
  const t = useTranslations('settings');

  const form = useForm<z.infer<typeof updatePhotoDefinitionSchema>>({
    resolver: zodResolver(updatePhotoDefinitionSchema),
    defaultValues: {
      name: '',
      description: '',
      isRequired: false,
      allowGallery: false,
      sendOnEmail: false
    }
  });

  useEffect(() => {
    if (photoDefinition) {
      form.reset({
        name: photoDefinition.name,
        description: photoDefinition.description || '',
        isRequired: photoDefinition.isRequired,
        allowGallery: photoDefinition.allowGallery,
        sendOnEmail: photoDefinition.sendOnEmail
      });
    }
  }, [photoDefinition, form]);

  const handleSubmit = (data: z.infer<typeof updatePhotoDefinitionSchema>) => {
    const requestData: UpdatePhotoDefinitionRequest = {
      name: data.name,
      description: data.description || undefined,
      isRequired: data.isRequired,
      allowGallery: data.allowGallery,
      sendOnEmail: data.sendOnEmail
    };
    onSubmit(requestData);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  if (!photoDefinition) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('photos.editDefinition')}</DialogTitle>
          <DialogDescription>{t('photos.editDefinitionDescription')}</DialogDescription>
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
                    <Input placeholder={t('photos.definitionPlaceholder')} {...field} />
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
                      placeholder={t('photos.definitionDescriptionPlaceholder')}
                      className="resize-none"
                      rows={3}
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t('fields.required')}</FormLabel>
                    <p className="text-muted-foreground text-sm">{t('photos.requiredHint')}</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowGallery"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t('photos.allowGallery')}</FormLabel>
                    <p className="text-muted-foreground text-sm">
                      Allow users to select photos from gallery for this definition
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sendOnEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t('photos.sendOnEmail')}</FormLabel>
                    <p className="text-muted-foreground text-sm">
                      Enable this option to send this photo when photo groups are enabled to be sent.
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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
