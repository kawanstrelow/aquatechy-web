'use client';

import { useTranslations } from 'next-intl';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, X, Plus } from 'lucide-react';

import { ServiceType, UpdateServiceTypeRequest } from '@/ts/interfaces/ServiceTypes';
import { ChecklistTemplate } from '@/ts/interfaces/ChecklistTemplates';
import { ReadingGroup } from '@/ts/interfaces/ReadingGroups';
import { ConsumableGroup } from '@/ts/interfaces/ConsumableGroups';
import { PhotoGroup } from '@/ts/interfaces/PhotoGroups';
import { SelectorGroup } from '@/ts/interfaces/SelectorGroups';
import { useGetServiceTypes } from '@/hooks/react-query/service-types/useGetServiceTypes';
import { cn } from '@/lib/utils';

const updateServiceTypeSchema = z.object({
  name: z.string().min(1, 'settings.errors.nameRequiredShort').max(100, 'settings.errors.nameMax'),
  description: z.string().max(500, 'settings.errors.descriptionMax').optional(),
  isActive: z.boolean(),
  checklistTemplateId: z.string().optional()
});

interface EditServiceTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceType: ServiceType | null;
  companyId: string;
  onSubmit: (data: UpdateServiceTypeRequest) => void;
  isLoading: boolean;
  isLinkingGroups: boolean;
  checklistTemplates: ChecklistTemplate[];
  readingGroups: ReadingGroup[];
  consumableGroups: ConsumableGroup[];
  photoGroups: PhotoGroup[];
  selectorGroups: SelectorGroup[];
  onLinkReadingGroup: (serviceTypeId: string, readingGroupId: string, order: number) => void;
  onUnlinkReadingGroup: (serviceTypeId: string, readingGroupId: string) => void;
  onLinkConsumableGroup: (serviceTypeId: string, consumableGroupId: string, order: number) => void;
  onUnlinkConsumableGroup: (serviceTypeId: string, consumableGroupId: string) => void;
  onLinkPhotoGroup: (serviceTypeId: string, photoGroupId: string, order: number) => void;
  onUnlinkPhotoGroup: (serviceTypeId: string, photoGroupId: string) => void;
  onLinkSelectorGroup: (serviceTypeId: string, selectorGroupId: string, order: number) => void;
  onUnlinkSelectorGroup: (serviceTypeId: string, selectorGroupId: string) => void;
}

export function EditServiceTypeDialog({
  open,
  onOpenChange,
  serviceType,
  companyId,
  onSubmit,
  isLoading,
  isLinkingGroups,
  checklistTemplates,
  readingGroups,
  consumableGroups,
  photoGroups,
  onLinkReadingGroup,
  onUnlinkReadingGroup,
  onLinkConsumableGroup,
  onUnlinkConsumableGroup,
  onLinkPhotoGroup,
  onUnlinkPhotoGroup,
  selectorGroups,
  onLinkSelectorGroup,
  onUnlinkSelectorGroup
}: EditServiceTypeDialogProps) {
  const t = useTranslations('settings');

  const [selectedReadingGroups, setSelectedReadingGroups] = useState<string[]>([]);
  const [selectedConsumableGroups, setSelectedConsumableGroups] = useState<string[]>([]);
  const [selectedPhotoGroups, setSelectedPhotoGroups] = useState<string[]>([]);
  const [selectedSelectorGroups, setSelectedSelectorGroups] = useState<string[]>([]);

  // Get fresh service types data to ensure real-time updates
  const { data: serviceTypesData } = useGetServiceTypes(companyId);
  const currentServiceType = serviceTypesData?.serviceTypes?.find((st) => st.id === serviceType?.id) || serviceType;

  const form = useForm<z.infer<typeof updateServiceTypeSchema>>({
    resolver: zodResolver(updateServiceTypeSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
      checklistTemplateId: 'none'
    }
  });

  useEffect(() => {
    if (currentServiceType) {
      form.reset({
        name: currentServiceType.name,
        description: currentServiceType.description || '',
        isActive: currentServiceType.isActive,
        checklistTemplateId: currentServiceType.checklistTemplateId || currentServiceType.defaultChecklistId || 'none'
      });
    }
  }, [currentServiceType, form]);

  const handleSubmit = (data: z.infer<typeof updateServiceTypeSchema>) => {
    const submitData = {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      defaultChecklistId: data.checklistTemplateId === 'none' ? null : data.checklistTemplateId
    };
    onSubmit(submitData);
  };

  const handleClose = () => {
    form.reset();
    setSelectedReadingGroups([]);
    setSelectedConsumableGroups([]);
    setSelectedPhotoGroups([]);
    onOpenChange(false);
  };

  const handleLinkReadingGroups = () => {
    if (selectedReadingGroups.length > 0 && currentServiceType) {
      selectedReadingGroups.forEach((groupId, index) => {
        const order = (currentServiceType.readingGroups?.length || 0) + index + 1;
        onLinkReadingGroup(currentServiceType.id, groupId, order);
      });
      setSelectedReadingGroups([]);
    }
  };

  const handleLinkConsumableGroups = () => {
    if (selectedConsumableGroups.length > 0 && currentServiceType) {
      selectedConsumableGroups.forEach((groupId, index) => {
        const order = (currentServiceType.consumableGroups?.length || 0) + index + 1;
        onLinkConsumableGroup(currentServiceType.id, groupId, order);
      });
      setSelectedConsumableGroups([]);
    }
  };

  const handleReadingGroupToggle = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedReadingGroups((prev) => [...prev, groupId]);
    } else {
      setSelectedReadingGroups((prev) => prev.filter((id) => id !== groupId));
    }
  };

  const handleConsumableGroupToggle = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedConsumableGroups((prev) => [...prev, groupId]);
    } else {
      setSelectedConsumableGroups((prev) => prev.filter((id) => id !== groupId));
    }
  };

  const handleLinkPhotoGroups = () => {
    if (selectedPhotoGroups.length > 0 && currentServiceType) {
      selectedPhotoGroups.forEach((groupId, index) => {
        const order = (currentServiceType.photoGroups?.length || 0) + index + 1;
        onLinkPhotoGroup(currentServiceType.id, groupId, order);
      });
      setSelectedPhotoGroups([]);
    }
  };

  const handlePhotoGroupToggle = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedPhotoGroups((prev) => [...prev, groupId]);
    } else {
      setSelectedPhotoGroups((prev) => prev.filter((id) => id !== groupId));
    }
  };

  const handleLinkSelectorGroups = () => {
    if (selectedSelectorGroups.length > 0 && currentServiceType) {
      selectedSelectorGroups.forEach((groupId, index) => {
        const order = (currentServiceType.selectorGroups?.length || 0) + index + 1;
        onLinkSelectorGroup(currentServiceType.id, groupId, order);
      });
      setSelectedSelectorGroups([]);
    }
  };

  const handleSelectorGroupToggle = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedSelectorGroups((prev) => [...prev, groupId]);
    } else {
      setSelectedSelectorGroups((prev) => prev.filter((id) => id !== groupId));
    }
  };

  // Get available groups (not already linked)
  const linkedReadingGroupIds = currentServiceType?.readingGroups?.map((g) => g.id) || [];
  const linkedConsumableGroupIds = currentServiceType?.consumableGroups?.map((g) => g.id) || [];
  const linkedPhotoGroupIds = currentServiceType?.photoGroups?.map((g) => g.id) || [];
  const linkedSelectorGroupIds = currentServiceType?.selectorGroups?.map((g) => g.id) || [];

  const availableReadingGroupsToLink = readingGroups.filter((group) => !linkedReadingGroupIds.includes(group.id));
  const availableConsumableGroupsToLink = consumableGroups.filter(
    (group) => !linkedConsumableGroupIds.includes(group.id)
  );
  const availablePhotoGroupsToLink = photoGroups.filter((group) => !linkedPhotoGroupIds.includes(group.id));
  const availableSelectorGroupsToLink = selectorGroups.filter((group) => !linkedSelectorGroupIds.includes(group.id));

  if (!currentServiceType) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isLinkingGroups) return;
        if (!nextOpen) handleClose();
      }}
    >
      <DialogContent
        className={cn(
          'max-h-[80vh] overflow-y-auto sm:max-w-[800px]',
          isLinkingGroups && '[&>button]:pointer-events-none [&>button]:invisible'
        )}
        onPointerDownOutside={(e) => isLinkingGroups && e.preventDefault()}
        onEscapeKeyDown={(e) => isLinkingGroups && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t('serviceTypes.configure', { name: currentServiceType.name })}</DialogTitle>
          <DialogDescription>{t('serviceTypes.editDescription')}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="flex h-auto w-full flex-col gap-2 sm:grid sm:grid-cols-5 sm:gap-0">
            <TabsTrigger value="basic">{t('serviceTypes.basicInfo')}</TabsTrigger>
            <TabsTrigger value="reading-groups">{t('serviceTypes.readings')}</TabsTrigger>
            <TabsTrigger value="consumable-groups">{t('groups.consumables')}</TabsTrigger>
            <TabsTrigger value="photo-groups">{t('groups.photos')}</TabsTrigger>
            <TabsTrigger value="selector-groups">{t('groups.selectors')}</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('fields.nameRequired')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('serviceTypes.namePlaceholder')}
                          {...field}
                          disabled={currentServiceType.name === 'Pool Cleaning'}
                          className={currentServiceType.name === 'Pool Cleaning' ? 'bg-muted cursor-not-allowed' : ''}
                        />
                      </FormControl>
                      {currentServiceType.name === 'Pool Cleaning' && (
                        <p className="text-muted-foreground mt-2 text-xs">
                          The "Pool Cleaning" service name cannot be modified as it's a default service type.
                        </p>
                      )}
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
                          placeholder={t('serviceTypes.descriptionPlaceholder')}
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
                  name="checklistTemplateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('serviceTypes.checklistTemplate')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('serviceTypes.checklistPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">{t('serviceTypes.noTemplate')}</SelectItem>
                          {checklistTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{t('statuses.Active')}</FormLabel>
                        <p className="text-muted-foreground text-sm">
                          {currentServiceType.isDefault
                            ? t('serviceTypes.defaultCannotDeactivate')
                            : t('serviceTypes.deactivateHint')}
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={currentServiceType.isDefault}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                    {t('actions.cancel')}
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? t('actions.updating') : t('serviceTypes.update')}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="reading-groups" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t('readings.groupsTitle')}</h3>
                <Badge variant="secondary" className="text-xs">
                  {currentServiceType.readingGroups?.length || 0} linked
                </Badge>
              </div>

              {/* Linked Reading Groups */}
              <div className="space-y-3">
                {currentServiceType.readingGroups && currentServiceType.readingGroups.length > 0 ? (
                  currentServiceType.readingGroups.map((group) => (
                    <div
                      key={group.id}
                      className="hover:bg-muted/50 group relative rounded-lg border p-4 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h4 className="text-sm font-medium">{group.name}</h4>
                          </div>
                          <p className="text-muted-foreground mb-2 text-sm">
                            {group.description || t('fields.noDescriptionProvided')}
                          </p>
                          <div className="text-muted-foreground flex items-center gap-4 text-xs">
                            <span>{group.readingDefinitions?.length || 0} definitions</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUnlinkReadingGroup(currentServiceType.id, group.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground py-8 text-center">
                    <div className="text-sm">{t('serviceTypes.noReadingLinked')}</div>
                    <p className="mt-1 text-xs">{t('serviceTypes.linkReadingHint')}</p>
                  </div>
                )}
              </div>

              {/* Add Reading Groups */}
              {availableReadingGroupsToLink.length > 0 && (
                <div className="border-t pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-medium">{t('serviceTypes.linkReading')}</h4>
                    {selectedReadingGroups.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedReadingGroups.length} selected
                      </Badge>
                    )}
                  </div>

                  <div className="mb-4 space-y-2">
                    {availableReadingGroupsToLink.map((group) => (
                      <div
                        key={group.id}
                        className="hover:bg-muted/50 flex items-center space-x-3 rounded-lg border p-3 transition-colors"
                      >
                        <Checkbox
                          id={`reading-${group.id}`}
                          checked={selectedReadingGroups.includes(group.id)}
                          onCheckedChange={(checked) => handleReadingGroupToggle(group.id, checked as boolean)}
                        />
                        <label htmlFor={`reading-${group.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">{group.name}</div>
                              <div className="text-muted-foreground text-xs">
                                {group.description || t('fields.noDescription')}
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={() => setSelectedReadingGroups(availableReadingGroupsToLink.map((g) => g.id))}
                      variant="outline"
                      size="sm"
                      className="w-full sm:flex-1"
                    >
                      Select All
                    </Button>
                    <Button
                      onClick={() => setSelectedReadingGroups([])}
                      variant="outline"
                      size="sm"
                      className="w-full sm:flex-1"
                      disabled={selectedReadingGroups.length === 0}
                    >
                      Clear All
                    </Button>
                    <Button onClick={handleLinkReadingGroups} disabled={selectedReadingGroups.length === 0} size="sm">
                      <Plus className="mr-1 h-4 w-4" />
                      Link Selected ({selectedReadingGroups.length})
                    </Button>
                  </div>
                </div>
              )}

              {availableReadingGroupsToLink.length === 0 &&
                currentServiceType.readingGroups &&
                currentServiceType.readingGroups.length > 0 && (
                  <div className="text-muted-foreground py-4 text-center">
                    <p className="text-sm">{t('serviceTypes.allReadingLinked')}</p>
                  </div>
                )}
            </div>
          </TabsContent>

          <TabsContent value="consumable-groups" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t('consumables.groupsTitle')}</h3>
                <Badge variant="secondary" className="text-xs">
                  {currentServiceType.consumableGroups?.length || 0} linked
                </Badge>
              </div>

              {/* Linked Consumable Groups */}
              <div className="space-y-3">
                {currentServiceType.consumableGroups && currentServiceType.consumableGroups.length > 0 ? (
                  currentServiceType.consumableGroups.map((group) => (
                    <div
                      key={group.id}
                      className="hover:bg-muted/50 group relative rounded-lg border p-4 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h4 className="text-sm font-medium">{group.name}</h4>
                          </div>
                          <p className="text-muted-foreground mb-2 text-sm">
                            {group.description || t('fields.noDescriptionProvided')}
                          </p>
                          <div className="text-muted-foreground flex items-center gap-4 text-xs">
                            <span>{group.consumableDefinitions?.length || 0} definitions</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUnlinkConsumableGroup(currentServiceType.id, group.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground py-8 text-center">
                    <div className="text-sm">{t('serviceTypes.noConsumableLinked')}</div>
                    <p className="mt-1 text-xs">{t('serviceTypes.linkConsumableHint')}</p>
                  </div>
                )}
              </div>

              {/* Add Consumable Groups */}
              {availableConsumableGroupsToLink.length > 0 && (
                <div className="border-t pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-medium">{t('serviceTypes.linkConsumable')}</h4>
                    {selectedConsumableGroups.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedConsumableGroups.length} selected
                      </Badge>
                    )}
                  </div>

                  <div className="mb-4 space-y-2">
                    {availableConsumableGroupsToLink.map((group) => (
                      <div
                        key={group.id}
                        className="hover:bg-muted/50 flex items-center space-x-3 rounded-lg border p-3 transition-colors"
                      >
                        <Checkbox
                          id={`consumable-${group.id}`}
                          checked={selectedConsumableGroups.includes(group.id)}
                          onCheckedChange={(checked) => handleConsumableGroupToggle(group.id, checked as boolean)}
                        />
                        <label htmlFor={`consumable-${group.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">{group.name}</div>
                              <div className="text-muted-foreground text-xs">
                                {group.description || t('fields.noDescription')}
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={() => setSelectedConsumableGroups(availableConsumableGroupsToLink.map((g) => g.id))}
                      variant="outline"
                      size="sm"
                      className="w-full sm:flex-1"
                    >
                      Select All
                    </Button>
                    <Button
                      onClick={() => setSelectedConsumableGroups([])}
                      variant="outline"
                      size="sm"
                      className="w-full sm:flex-1"
                      disabled={selectedConsumableGroups.length === 0}
                    >
                      Clear All
                    </Button>
                    <Button
                      onClick={handleLinkConsumableGroups}
                      disabled={selectedConsumableGroups.length === 0}
                      size="sm"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Link Selected ({selectedConsumableGroups.length})
                    </Button>
                  </div>
                </div>
              )}

              {availableConsumableGroupsToLink.length === 0 &&
                currentServiceType.consumableGroups &&
                currentServiceType.consumableGroups.length > 0 && (
                  <div className="text-muted-foreground py-4 text-center">
                    <p className="text-sm">{t('serviceTypes.allConsumableLinked')}</p>
                  </div>
                )}
            </div>
          </TabsContent>

          <TabsContent value="photo-groups" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t('photos.groupsTitle')}</h3>
                <Badge variant="secondary" className="text-xs">
                  {currentServiceType.photoGroups?.length || 0} linked
                </Badge>
              </div>

              {/* Linked Photo Groups */}
              <div className="space-y-3">
                {currentServiceType.photoGroups && currentServiceType.photoGroups.length > 0 ? (
                  currentServiceType.photoGroups.map((group) => (
                    <div
                      key={group.id}
                      className="hover:bg-muted/50 group relative rounded-lg border p-4 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h4 className="text-sm font-medium">{group.name}</h4>
                          </div>
                          <p className="text-muted-foreground mb-2 text-sm">
                            {group.description || t('fields.noDescriptionProvided')}
                          </p>
                          <div className="text-muted-foreground flex items-center gap-4 text-xs">
                            <span>{group.photoDefinitions?.length || 0} definitions</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUnlinkPhotoGroup(currentServiceType.id, group.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground py-8 text-center">
                    <div className="text-sm">{t('serviceTypes.noPhotoLinked')}</div>
                    <p className="mt-1 text-xs">{t('serviceTypes.linkPhotoHint')}</p>
                  </div>
                )}
              </div>

              {/* Add Photo Groups */}
              {availablePhotoGroupsToLink.length > 0 && (
                <div className="border-t pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-medium">{t('serviceTypes.linkPhoto')}</h4>
                    {selectedPhotoGroups.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedPhotoGroups.length} selected
                      </Badge>
                    )}
                  </div>

                  <div className="mb-4 space-y-2">
                    {availablePhotoGroupsToLink.map((group) => (
                      <div
                        key={group.id}
                        className="hover:bg-muted/50 flex items-center space-x-3 rounded-lg border p-3 transition-colors"
                      >
                        <Checkbox
                          id={`photo-${group.id}`}
                          checked={selectedPhotoGroups.includes(group.id)}
                          onCheckedChange={(checked) => handlePhotoGroupToggle(group.id, checked as boolean)}
                        />
                        <label htmlFor={`photo-${group.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">{group.name}</div>
                              <div className="text-muted-foreground text-xs">
                                {group.description || t('fields.noDescription')}
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={() => setSelectedPhotoGroups(availablePhotoGroupsToLink.map((g) => g.id))}
                      variant="outline"
                      size="sm"
                      className="w-full sm:flex-1"
                    >
                      Select All
                    </Button>
                    <Button
                      onClick={() => setSelectedPhotoGroups([])}
                      variant="outline"
                      size="sm"
                      className="w-full sm:flex-1"
                      disabled={selectedPhotoGroups.length === 0}
                    >
                      Clear All
                    </Button>
                    <Button onClick={handleLinkPhotoGroups} disabled={selectedPhotoGroups.length === 0} size="sm">
                      <Plus className="mr-1 h-4 w-4" />
                      Link Selected ({selectedPhotoGroups.length})
                    </Button>
                  </div>
                </div>
              )}

              {availablePhotoGroupsToLink.length === 0 &&
                currentServiceType.photoGroups &&
                currentServiceType.photoGroups.length > 0 && (
                  <div className="text-muted-foreground py-4 text-center">
                    <p className="text-sm">{t('serviceTypes.allPhotoLinked')}</p>
                  </div>
                )}
            </div>
          </TabsContent>

          <TabsContent value="selector-groups" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t('selectors.groupsTitle')}</h3>
                <Badge variant="secondary" className="text-xs">
                  {currentServiceType.selectorGroups?.length || 0} linked
                </Badge>
              </div>

              {/* Linked Selector Groups */}
              <div className="space-y-3">
                {currentServiceType.selectorGroups && currentServiceType.selectorGroups.length > 0 ? (
                  currentServiceType.selectorGroups.map((group) => (
                    <div
                      key={group.id}
                      className="hover:bg-muted/50 group relative rounded-lg border p-4 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h4 className="text-sm font-medium">{group.name}</h4>
                          </div>
                          <p className="text-muted-foreground mb-2 text-sm">
                            {group.description || t('fields.noDescriptionProvided')}
                          </p>
                          <div className="text-muted-foreground flex items-center gap-4 text-xs">
                            <span>{group.selectorDefinitions?.length || 0} definitions</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUnlinkSelectorGroup(currentServiceType.id, group.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground py-8 text-center">
                    <div className="text-sm">{t('serviceTypes.noSelectorLinked')}</div>
                    <p className="mt-1 text-xs">{t('serviceTypes.linkSelectorHint')}</p>
                  </div>
                )}
              </div>

              {/* Add Selector Groups */}
              {availableSelectorGroupsToLink.length > 0 && (
                <div className="border-t pt-4">
                  <div className="mb-3 flex flex-col items-start justify-between gap-2 md:flex-row md:items-center md:gap-0">
                    <h4 className="text-sm font-medium">{t('serviceTypes.availableSelectors')}</h4>

                    <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:flex-row md:items-center">
                      <Button
                        onClick={() => {
                          const allIds = availableSelectorGroupsToLink.map((g) => g.id);
                          setSelectedSelectorGroups(allIds);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs md:w-auto"
                        disabled={availableSelectorGroupsToLink.length === 0}
                      >
                        Select All
                      </Button>
                      <Button
                        onClick={() => setSelectedSelectorGroups([])}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs md:w-auto"
                        disabled={selectedSelectorGroups.length === 0}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  <div className="mb-4 space-y-2">
                    {availableSelectorGroupsToLink.map((group) => (
                      <div
                        key={group.id}
                        className="hover:bg-muted/50 flex items-center space-x-3 rounded-lg border p-3 transition-colors"
                      >
                        <Checkbox
                          id={`selector-${group.id}`}
                          checked={selectedSelectorGroups.includes(group.id)}
                          onCheckedChange={(checked) => handleSelectorGroupToggle(group.id, checked as boolean)}
                        />
                        <label htmlFor={`selector-${group.id}`} className="flex-1 cursor-pointer">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-sm font-medium">{group.name}</span>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            {group.description || t('fields.noDescriptionProvided')}
                          </p>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setSelectedSelectorGroups([])}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={selectedSelectorGroups.length === 0}
                    >
                      Clear All
                    </Button>
                    <Button onClick={handleLinkSelectorGroups} disabled={selectedSelectorGroups.length === 0} size="sm">
                      <Plus className="mr-1 h-4 w-4" />
                      Link Selected ({selectedSelectorGroups.length})
                    </Button>
                  </div>
                </div>
              )}

              {availableSelectorGroupsToLink.length === 0 &&
                currentServiceType.selectorGroups &&
                currentServiceType.selectorGroups.length > 0 && (
                  <div className="text-muted-foreground py-4 text-center">
                    <p className="text-sm">{t('serviceTypes.allSelectorLinked')}</p>
                  </div>
                )}
            </div>
          </TabsContent>
        </Tabs>

        {isLinkingGroups && (
          <div
            className="bg-background/85 absolute inset-0 z-[100] flex flex-col items-center justify-center gap-3 rounded-lg p-6 backdrop-blur-sm"
            aria-busy="true"
            aria-live="polite"
          >
            <Loader2 className="text-primary h-10 w-10 shrink-0 animate-spin" />
            <p className="text-center text-sm font-medium">{t('serviceTypes.doNotClose')}</p>
            <p className="text-muted-foreground text-center text-xs">{t('serviceTypes.savingLinks')}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
