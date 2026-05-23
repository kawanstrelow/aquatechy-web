'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
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
  const [selectedReadingGroups, setSelectedReadingGroups] = useState<string[]>([]);
  const [selectedConsumableGroups, setSelectedConsumableGroups] = useState<string[]>([]);
  const [selectedPhotoGroups, setSelectedPhotoGroups] = useState<string[]>([]);
  const [selectedSelectorGroups, setSelectedSelectorGroups] = useState<string[]>([]);

  // Get fresh service types data to ensure real-time updates
  const { data: serviceTypesData } = useGetServiceTypes(companyId);
  const currentServiceType = serviceTypesData?.serviceTypes?.find(st => st.id === serviceType?.id) || serviceType;

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
      setSelectedReadingGroups(prev => [...prev, groupId]);
    } else {
      setSelectedReadingGroups(prev => prev.filter(id => id !== groupId));
    }
  };

  const handleConsumableGroupToggle = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedConsumableGroups(prev => [...prev, groupId]);
    } else {
      setSelectedConsumableGroups(prev => prev.filter(id => id !== groupId));
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
      setSelectedPhotoGroups(prev => [...prev, groupId]);
    } else {
      setSelectedPhotoGroups(prev => prev.filter(id => id !== groupId));
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
      setSelectedSelectorGroups(prev => [...prev, groupId]);
    } else {
      setSelectedSelectorGroups(prev => prev.filter(id => id !== groupId));
    }
  };

  // Get available groups (not already linked)
  const linkedReadingGroupIds = currentServiceType?.readingGroups?.map(g => g.id) || [];
  const linkedConsumableGroupIds = currentServiceType?.consumableGroups?.map(g => g.id) || [];
  const linkedPhotoGroupIds = currentServiceType?.photoGroups?.map(g => g.id) || [];
  const linkedSelectorGroupIds = currentServiceType?.selectorGroups?.map(g => g.id) || [];

  const availableReadingGroupsToLink = readingGroups.filter(
    group => !linkedReadingGroupIds.includes(group.id)
  );
  const availableConsumableGroupsToLink = consumableGroups.filter(
    group => !linkedConsumableGroupIds.includes(group.id)
  );
  const availablePhotoGroupsToLink = photoGroups.filter(
    group => !linkedPhotoGroupIds.includes(group.id)
  );
  const availableSelectorGroupsToLink = selectorGroups.filter(
    group => !linkedSelectorGroupIds.includes(group.id)
  );

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
          'relative sm:max-w-[800px] max-h-[80vh] overflow-y-auto',
          isLinkingGroups && '[&>button]:pointer-events-none [&>button]:invisible'
        )}
        onPointerDownOutside={(e) => isLinkingGroups && e.preventDefault()}
        onEscapeKeyDown={(e) => isLinkingGroups && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Configure Service Type: {currentServiceType.name}</DialogTitle>
          <DialogDescription>
            Update the service type information and manage linked groups.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="
    flex flex-col sm:grid sm:grid-cols-5
    w-full gap-2 sm:gap-0 h-auto
  ">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="reading-groups">Readings</TabsTrigger>
            <TabsTrigger value="consumable-groups">Consumables</TabsTrigger>
            <TabsTrigger value="photo-groups">Photos</TabsTrigger>
            <TabsTrigger value="selector-groups">Selectors</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Pool Cleaning"
                          {...field}
                          disabled={currentServiceType.name === "Pool Cleaning"}
                          className={currentServiceType.name === "Pool Cleaning" ? "bg-muted cursor-not-allowed" : ""}
                        />
                      </FormControl>
                      {currentServiceType.name === "Pool Cleaning" && (
                        <p className="text-xs text-muted-foreground mt-2">
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of what this service type includes..."
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
                      <FormLabel>Checklist Template</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a checklist template (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No template</SelectItem>
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
                        <FormLabel className="text-base">
                          Active
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          {currentServiceType.isDefault
                            ? 'This is a default service type and cannot be deactivated'
                            : 'Deactivate to hide this service type from new services'
                          }
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

                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end w-full">
                  <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Service Type'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="reading-groups" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Reading Groups</h3>
                <Badge variant="secondary" className="text-xs">
                  {currentServiceType.readingGroups?.length || 0} linked
                </Badge>
              </div>

              {/* Linked Reading Groups */}
              <div className="space-y-3">
                {currentServiceType.readingGroups && currentServiceType.readingGroups.length > 0 ? (
                  currentServiceType.readingGroups.map((group) => (
                    <div key={group.id} className="group relative p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{group.name}</h4>

                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {group.description || 'No description provided'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{group.readingDefinitions?.length || 0} definitions</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUnlinkReadingGroup(currentServiceType.id, group.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-sm">No reading groups linked</div>
                    <p className="text-xs mt-1">Link reading groups to make them available for this service type</p>
                  </div>
                )}
              </div>

              {/* Add Reading Groups */}
              {availableReadingGroupsToLink.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">Link Reading Groups</h4>
                    {selectedReadingGroups.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedReadingGroups.length} selected
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {availableReadingGroupsToLink.map((group) => (
                      <div key={group.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={`reading-${group.id}`}
                          checked={selectedReadingGroups.includes(group.id)}
                          onCheckedChange={(checked) => handleReadingGroupToggle(group.id, checked as boolean)}
                        />
                        <label htmlFor={`reading-${group.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{group.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {group.description || 'No description'}
                              </div>
                            </div>

                          </div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button
                      onClick={() => setSelectedReadingGroups(availableReadingGroupsToLink.map(g => g.id))}
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
                    <Button
                      onClick={handleLinkReadingGroups}
                      disabled={selectedReadingGroups.length === 0}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Link Selected ({selectedReadingGroups.length})
                    </Button>
                  </div>
                </div>
              )}

              {availableReadingGroupsToLink.length === 0 && currentServiceType.readingGroups && currentServiceType.readingGroups.length > 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">All available reading groups are already linked</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="consumable-groups" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Consumable Groups</h3>
                <Badge variant="secondary" className="text-xs">
                  {currentServiceType.consumableGroups?.length || 0} linked
                </Badge>
              </div>

              {/* Linked Consumable Groups */}
              <div className="space-y-3">
                {currentServiceType.consumableGroups && currentServiceType.consumableGroups.length > 0 ? (
                  currentServiceType.consumableGroups.map((group) => (
                    <div key={group.id} className="group relative p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{group.name}</h4>

                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {group.description || 'No description provided'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{group.consumableDefinitions?.length || 0} definitions</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUnlinkConsumableGroup(currentServiceType.id, group.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-sm">No consumable groups linked</div>
                    <p className="text-xs mt-1">Link consumable groups to make them available for this service type</p>
                  </div>
                )}
              </div>

              {/* Add Consumable Groups */}
              {availableConsumableGroupsToLink.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">Link Consumable Groups</h4>
                    {selectedConsumableGroups.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedConsumableGroups.length} selected
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {availableConsumableGroupsToLink.map((group) => (
                      <div key={group.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={`consumable-${group.id}`}
                          checked={selectedConsumableGroups.includes(group.id)}
                          onCheckedChange={(checked) => handleConsumableGroupToggle(group.id, checked as boolean)}
                        />
                        <label htmlFor={`consumable-${group.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{group.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {group.description || 'No description'}
                              </div>
                            </div>

                          </div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button
                      onClick={() => setSelectedConsumableGroups(availableConsumableGroupsToLink.map(g => g.id))}
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
                      <Plus className="h-4 w-4 mr-1" />
                      Link Selected ({selectedConsumableGroups.length})
                    </Button>
                  </div>
                </div>
              )}

              {availableConsumableGroupsToLink.length === 0 && currentServiceType.consumableGroups && currentServiceType.consumableGroups.length > 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">All available consumable groups are already linked</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="photo-groups" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Photo Groups</h3>
                <Badge variant="secondary" className="text-xs">
                  {currentServiceType.photoGroups?.length || 0} linked
                </Badge>
              </div>

              {/* Linked Photo Groups */}
              <div className="space-y-3">
                {currentServiceType.photoGroups && currentServiceType.photoGroups.length > 0 ? (
                  currentServiceType.photoGroups.map((group) => (
                    <div key={group.id} className="group relative p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{group.name}</h4>

                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {group.description || 'No description provided'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{group.photoDefinitions?.length || 0} definitions</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUnlinkPhotoGroup(currentServiceType.id, group.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-sm">No photo groups linked</div>
                    <p className="text-xs mt-1">Link photo groups to make them available for this service type</p>
                  </div>
                )}
              </div>

              {/* Add Photo Groups */}
              {availablePhotoGroupsToLink.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">Link Photo Groups</h4>
                    {selectedPhotoGroups.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedPhotoGroups.length} selected
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {availablePhotoGroupsToLink.map((group) => (
                      <div key={group.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={`photo-${group.id}`}
                          checked={selectedPhotoGroups.includes(group.id)}
                          onCheckedChange={(checked) => handlePhotoGroupToggle(group.id, checked as boolean)}
                        />
                        <label htmlFor={`photo-${group.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{group.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {group.description || 'No description'}
                              </div>
                            </div>

                          </div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button
                      onClick={() => setSelectedPhotoGroups(availablePhotoGroupsToLink.map(g => g.id))}
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
                    <Button
                      onClick={handleLinkPhotoGroups}
                      disabled={selectedPhotoGroups.length === 0}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Link Selected ({selectedPhotoGroups.length})
                    </Button>
                  </div>
                </div>
              )}

              {availablePhotoGroupsToLink.length === 0 && currentServiceType.photoGroups && currentServiceType.photoGroups.length > 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">All available photo groups are already linked</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="selector-groups" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Selector Groups</h3>
                <Badge variant="secondary" className="text-xs">
                  {currentServiceType.selectorGroups?.length || 0} linked
                </Badge>
              </div>

              {/* Linked Selector Groups */}
              <div className="space-y-3">
                {currentServiceType.selectorGroups && currentServiceType.selectorGroups.length > 0 ? (
                  currentServiceType.selectorGroups.map((group) => (
                    <div key={group.id} className="group relative p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{group.name}</h4>

                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {group.description || 'No description provided'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{group.selectorDefinitions?.length || 0} definitions</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUnlinkSelectorGroup(currentServiceType.id, group.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-sm">No selector groups linked</div>
                    <p className="text-xs mt-1">Link selector groups to make them available for this service type</p>
                  </div>
                )}
              </div>

              {/* Add Selector Groups */}
              {availableSelectorGroupsToLink.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 gap-2 md:gap-0">
                    <h4 className="text-sm font-medium">Available Selector Groups</h4>

                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
                      <Button
                        onClick={() => {
                          const allIds = availableSelectorGroupsToLink.map(g => g.id);
                          setSelectedSelectorGroups(allIds);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs w-full md:w-auto"
                        disabled={availableSelectorGroupsToLink.length === 0}
                      >
                        Select All
                      </Button>
                      <Button
                        onClick={() => setSelectedSelectorGroups([])}
                        variant="outline"
                        size="sm"
                        className="text-xs w-full md:w-auto"
                        disabled={selectedSelectorGroups.length === 0}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>


                  <div className="space-y-2 mb-4">
                    {availableSelectorGroupsToLink.map((group) => (
                      <div key={group.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={`selector-${group.id}`}
                          checked={selectedSelectorGroups.includes(group.id)}
                          onCheckedChange={(checked) => handleSelectorGroupToggle(group.id, checked as boolean)}
                        />
                        <label htmlFor={`selector-${group.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{group.name}</span>

                          </div>
                          <p className="text-xs text-muted-foreground">
                            {group.description || 'No description provided'}
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
                    <Button
                      onClick={handleLinkSelectorGroups}
                      disabled={selectedSelectorGroups.length === 0}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Link Selected ({selectedSelectorGroups.length})
                    </Button>
                  </div>
                </div>
              )}

              {availableSelectorGroupsToLink.length === 0 && currentServiceType.selectorGroups && currentServiceType.selectorGroups.length > 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">All available selector groups are already linked</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {isLinkingGroups && (
          <div
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-3 rounded-lg bg-background/85 p-6 backdrop-blur-sm"
            aria-busy="true"
            aria-live="polite"
          >
            <Loader2 className="h-10 w-10 shrink-0 animate-spin text-primary" />
            <p className="text-center text-sm font-medium">Do not close this screen</p>
            <p className="text-center text-xs text-muted-foreground">
              Saving links to this service type…
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
