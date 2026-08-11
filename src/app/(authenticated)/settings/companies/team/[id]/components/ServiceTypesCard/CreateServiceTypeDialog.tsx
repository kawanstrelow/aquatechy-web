'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueries } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { z } from 'zod';

import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { clientAxios } from '@/lib/clientAxios';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/user';
import { ChecklistTemplate } from '@/ts/interfaces/ChecklistTemplates';
import { ConsumableDefinitionsResponse, ConsumableGroup } from '@/ts/interfaces/ConsumableGroups';
import { PhotoDefinitionsResponse, PhotoGroup } from '@/ts/interfaces/PhotoGroups';
import { ReadingDefinitionsResponse, ReadingGroup } from '@/ts/interfaces/ReadingGroups';
import { SelectorDefinitionsResponse, SelectorGroup } from '@/ts/interfaces/SelectorGroups';
import { CreateServiceTypeRequest } from '@/ts/interfaces/ServiceTypes';

const STEPS = [
  { id: 1, label: 'Basics' },
  { id: 2, label: 'Groups' },
  { id: 3, label: 'Communication' }
] as const;

const DEFAULT_EMAIL_HEADER =
  'Hi %client.firstName% %client.lastName%! Your service for %serviceDate% is complete. Below are the details of the service performed: Pool address: %poolAddress%';
const DEFAULT_EMAIL_FOOTER = 'Thank you for choosing %company.name%!';

const createServiceTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isDefault: z.boolean().default(false),
  checklistTemplateId: z.string().optional(),
  sendAutomaticEmails: z.boolean(),
  technicianNotes: z.boolean(),
  sendReadingsGroups: z.boolean(),
  sendConsumablesGroups: z.boolean(),
  sendPhotoGroups: z.boolean(),
  sendSelectorsGroups: z.boolean(),
  sendChecklist: z.boolean()
});

type CreateServiceTypeFormValues = z.infer<typeof createServiceTypeSchema>;

interface CreateServiceTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateServiceTypeRequest) => void;
  isLoading: boolean;
  checklistTemplates: ChecklistTemplate[];
  readingGroups: ReadingGroup[];
  consumableGroups: ConsumableGroup[];
  photoGroups: PhotoGroup[];
  selectorGroups: SelectorGroup[];
}

function formatPreviewNames(names: string[], maxVisible = 5): string {
  if (names.length === 0) return 'No items yet';
  if (names.length <= maxVisible) return names.join(' · ');
  return `${names.slice(0, maxVisible).join(' · ')} · +${names.length - maxVisible} more`;
}

function GrowPlanSwitchLabel({
  label,
  description,
  isFreePlan
}: {
  label: string;
  description: string;
  isFreePlan: boolean;
}) {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-sm font-semibold text-gray-800">
        {label}
        {isFreePlan && <span className="ml-1.5 text-xs font-medium text-blue-600">(upgrade to grow)</span>}
      </span>
      <span className="text-muted-foreground text-sm font-normal">{description}</span>
    </div>
  );
}

function GroupCheckboxRow({
  id,
  name,
  description,
  preview,
  checked,
  onCheckedChange
}: {
  id: string;
  name: string;
  description?: string | null;
  preview: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start space-x-3 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-50',
        checked && 'border-blue-400 bg-blue-50/60 ring-1 ring-blue-200'
      )}
    >
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} className="mt-0.5" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="text-sm font-medium leading-none">{name}</div>
        {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
        <p className="text-muted-foreground text-xs">{preview}</p>
      </div>
    </label>
  );
}

export function CreateServiceTypeDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  checklistTemplates,
  readingGroups,
  consumableGroups,
  photoGroups,
  selectorGroups
}: CreateServiceTypeDialogProps) {
  const [step, setStep] = useState(1);
  const [selectedReadingGroupIds, setSelectedReadingGroupIds] = useState<string[]>([]);
  const [selectedConsumableGroupIds, setSelectedConsumableGroupIds] = useState<string[]>([]);
  const [selectedPhotoGroupIds, setSelectedPhotoGroupIds] = useState<string[]>([]);
  const [selectedSelectorGroupIds, setSelectedSelectorGroupIds] = useState<string[]>([]);

  const { isFreePlan } = useUserStore(
    useShallow((state) => ({
      isFreePlan: state.isFreePlan
    }))
  );

  const form = useForm<CreateServiceTypeFormValues>({
    resolver: zodResolver(createServiceTypeSchema),
    defaultValues: {
      name: '',
      description: '',
      isDefault: false,
      checklistTemplateId: 'none',
      sendAutomaticEmails: true,
      technicianNotes: false,
      sendReadingsGroups: false,
      sendConsumablesGroups: false,
      sendPhotoGroups: true,
      sendSelectorsGroups: false,
      sendChecklist: false
    }
  });

  const shouldFetchDefinitions = open;

  const readingDefinitionQueries = useQueries({
    queries: readingGroups.map((group) => ({
      queryKey: ['reading-definitions', group.id],
      queryFn: async (): Promise<ReadingDefinitionsResponse> => {
        const response = await clientAxios.get(`/reading-definitions/reading-groups/${group.id}`);
        return response.data;
      },
      enabled: shouldFetchDefinitions && !!group.id
    }))
  });

  const consumableDefinitionQueries = useQueries({
    queries: consumableGroups.map((group) => ({
      queryKey: ['consumable-definitions', group.id],
      queryFn: async (): Promise<ConsumableDefinitionsResponse> => {
        const response = await clientAxios.get(`/consumable-definitions/consumable-groups/${group.id}`);
        return response.data;
      },
      enabled: shouldFetchDefinitions && !!group.id
    }))
  });

  const photoGroupsNeedingFetch = useMemo(
    () => photoGroups.filter((group) => !group.photoDefinitions),
    [photoGroups]
  );

  const photoDefinitionQueries = useQueries({
    queries: photoGroupsNeedingFetch.map((group) => ({
      queryKey: ['photo-definitions', group.id],
      queryFn: async (): Promise<PhotoDefinitionsResponse> => {
        const response = await clientAxios.get(`/photo-definitions/groups/${group.id}`);
        return response.data;
      },
      enabled: shouldFetchDefinitions && !!group.id
    }))
  });

  const selectorGroupsNeedingFetch = useMemo(
    () => selectorGroups.filter((group) => !group.selectorDefinitions),
    [selectorGroups]
  );

  const selectorDefinitionQueries = useQueries({
    queries: selectorGroupsNeedingFetch.map((group) => ({
      queryKey: ['selectorDefinitions', group.id],
      queryFn: async (): Promise<SelectorDefinitionsResponse> => {
        const response = await clientAxios.get(`/selector-definitions/groups/${group.id}`);
        return response.data;
      },
      enabled: shouldFetchDefinitions && !!group.id
    }))
  });

  const readingPreviewById = useMemo(() => {
    const map = new Map<string, string>();
    readingGroups.forEach((group, index) => {
      const query = readingDefinitionQueries[index];
      if (!query?.data && (query?.isLoading || query?.isPending)) {
        map.set(group.id, 'Loading…');
        return;
      }
      const definitions = query?.data?.readingDefinitions || [];
      map.set(group.id, formatPreviewNames(definitions.map((definition) => definition.name)));
    });
    return map;
  }, [readingGroups, readingDefinitionQueries]);

  const consumablePreviewById = useMemo(() => {
    const map = new Map<string, string>();
    consumableGroups.forEach((group, index) => {
      const query = consumableDefinitionQueries[index];
      if (!query?.data && (query?.isLoading || query?.isPending)) {
        map.set(group.id, 'Loading…');
        return;
      }
      const definitions = query?.data?.consumableDefinitions || [];
      map.set(group.id, formatPreviewNames(definitions.map((definition) => definition.name)));
    });
    return map;
  }, [consumableGroups, consumableDefinitionQueries]);

  const photoPreviewById = useMemo(() => {
    const map = new Map<string, string>();
    const fetchedById = new Map(
      photoGroupsNeedingFetch.map((group, index) => [group.id, photoDefinitionQueries[index]])
    );

    photoGroups.forEach((group) => {
      if (group.photoDefinitions) {
        map.set(group.id, formatPreviewNames(group.photoDefinitions.map((definition) => definition.name)));
        return;
      }
      const query = fetchedById.get(group.id);
      if (!query?.data && (query?.isLoading || query?.isPending)) {
        map.set(group.id, 'Loading…');
        return;
      }
      const definitions = query?.data?.photoDefinitions || [];
      map.set(group.id, formatPreviewNames(definitions.map((definition) => definition.name)));
    });
    return map;
  }, [photoGroups, photoGroupsNeedingFetch, photoDefinitionQueries]);

  const selectorPreviewById = useMemo(() => {
    const map = new Map<string, string>();
    const fetchedById = new Map(
      selectorGroupsNeedingFetch.map((group, index) => [group.id, selectorDefinitionQueries[index]])
    );

    selectorGroups.forEach((group) => {
      if (group.selectorDefinitions) {
        map.set(
          group.id,
          formatPreviewNames(group.selectorDefinitions.map((definition) => definition.question))
        );
        return;
      }
      const query = fetchedById.get(group.id);
      if (!query?.data && (query?.isLoading || query?.isPending)) {
        map.set(group.id, 'Loading…');
        return;
      }
      const definitions = query?.data?.selectorDefinitions || [];
      map.set(group.id, formatPreviewNames(definitions.map((definition) => definition.question)));
    });
    return map;
  }, [selectorGroups, selectorGroupsNeedingFetch, selectorDefinitionQueries]);

  const resetWizard = () => {
    setStep(1);
    setSelectedReadingGroupIds([]);
    setSelectedConsumableGroupIds([]);
    setSelectedPhotoGroupIds([]);
    setSelectedSelectorGroupIds([]);
    form.reset({
      name: '',
      description: '',
      isDefault: false,
      checklistTemplateId: 'none',
      sendAutomaticEmails: true,
      technicianNotes: false,
      sendReadingsGroups: false,
      sendConsumablesGroups: false,
      sendPhotoGroups: true,
      sendSelectorsGroups: false,
      sendChecklist: false
    });
  };

  useEffect(() => {
    if (!open) {
      resetWizard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when dialog closes
  }, [open]);

  const handleClose = () => {
    resetWizard();
    onOpenChange(false);
  };

  const handleNext = async () => {
    if (step === 1) {
      const isValid = await form.trigger(['name', 'description', 'checklistTemplateId']);
      if (!isValid) return;
    }
    setStep((current) => Math.min(current + 1, 3));
  };

  const handleBack = () => {
    setStep((current) => Math.max(current - 1, 1));
  };

  const toggleId = (ids: string[], id: string, checked: boolean) => {
    if (checked) return [...ids, id];
    return ids.filter((value) => value !== id);
  };

  const sendAutomaticEmails = form.watch('sendAutomaticEmails');
  const includeOptionsDisabled = !sendAutomaticEmails;

  const createServiceType = (data: CreateServiceTypeFormValues) => {
    const submitData: CreateServiceTypeRequest = {
      name: data.name,
      description: data.description,
      isDefault: data.isDefault,
      defaultChecklistId: data.checklistTemplateId === 'none' ? null : data.checklistTemplateId,
      readingGroups: selectedReadingGroupIds.map((readingGroupId, order) => ({ readingGroupId, order })),
      consumableGroups: selectedConsumableGroupIds.map((consumableGroupId, order) => ({ consumableGroupId, order })),
      photoGroups: selectedPhotoGroupIds.map((photoGroupId, order) => ({ photoGroupId, order })),
      selectorGroups: selectedSelectorGroupIds.map((selectorGroupId, order) => ({ selectorGroupId, order })),
      serviceTypeEmailPreferences: {
        sendAutomaticEmails: data.sendAutomaticEmails,
        header: DEFAULT_EMAIL_HEADER,
        body: null,
        footer: DEFAULT_EMAIL_FOOTER,
        technicianNotes: isFreePlan || !data.sendAutomaticEmails ? false : data.technicianNotes,
        sendReadingsGroups: isFreePlan || !data.sendAutomaticEmails ? false : data.sendReadingsGroups,
        sendConsumablesGroups: isFreePlan || !data.sendAutomaticEmails ? false : data.sendConsumablesGroups,
        sendPhotoGroups: !data.sendAutomaticEmails ? false : data.sendPhotoGroups,
        sendSelectorsGroups: isFreePlan || !data.sendAutomaticEmails ? false : data.sendSelectorsGroups,
        sendChecklist: isFreePlan || !data.sendAutomaticEmails ? false : data.sendChecklist
      }
    };

    onSubmit(submitData);
  };

  const handlePrimaryAction = async () => {
    if (step < 3) {
      await handleNext();
      return;
    }

    await form.handleSubmit(createServiceType)();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetWizard();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden border border-slate-200 p-0 sm:max-w-2xl">
        <div className="shrink-0 space-y-5 border-b border-slate-200 px-6 pb-5 pt-6 pr-12">
          <DialogHeader>
            <DialogTitle>Create Service Type</DialogTitle>
            <DialogDescription>
              Set up a service type in three steps: basic info, linked groups, and email communication.
            </DialogDescription>
          </DialogHeader>

          <nav aria-label="Creation steps" className="px-2">
            <div className="relative">
              <div
                aria-hidden
                className="absolute left-[16.666%] right-[16.666%] top-4 h-0.5 -translate-y-1/2 bg-slate-200"
              />
              <div
                aria-hidden
                className="absolute left-[16.666%] top-4 h-0.5 -translate-y-1/2 bg-blue-600 transition-all duration-300"
                style={{ width: `${((step - 1) / (STEPS.length - 1)) * (100 * (2 / 3))}%` }}
              />
              <ol className="relative z-10 grid grid-cols-3">
                {STEPS.map((stepItem) => {
                  const isActive = step === stepItem.id;
                  const isComplete = step > stepItem.id;

                  return (
                    <li key={stepItem.id} className="flex flex-col items-center gap-2 text-center">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                          isActive && 'border-blue-600 bg-blue-600 text-white shadow-sm',
                          isComplete && 'border-blue-600 bg-blue-600 text-white',
                          !isActive && !isComplete && 'border-slate-300 bg-white text-slate-400'
                        )}
                      >
                        {isComplete ? <Check className="h-4 w-4" strokeWidth={2.5} /> : stepItem.id}
                      </div>
                      <span
                        className={cn(
                          'text-xs font-medium',
                          isActive && 'text-blue-700',
                          isComplete && 'text-slate-700',
                          !isActive && !isComplete && 'text-slate-400'
                        )}
                      >
                        {stepItem.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </nav>
        </div>

        <Form {...form}>
          <form
            onSubmit={(event) => {
              // Never create via native form submit — Next/Create share one button slot and
              // swapping type="button" → type="submit" mid-click was firing create early.
              event.preventDefault();
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {step === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Pool Cleaning" {...field} />
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
                                {template.name} {template.isDefault && '(Default)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <p className="text-muted-foreground text-sm">
                    Optionally link existing groups. Previews show what technicians will fill in for each group.
                  </p>

                  <section className="space-y-3">
                    <h4 className="text-sm font-semibold">Reading Groups</h4>
                    {readingGroups.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No reading groups available.</p>
                    ) : (
                      <div className="space-y-2">
                        {readingGroups.map((group) => (
                          <GroupCheckboxRow
                            key={group.id}
                            id={`create-reading-${group.id}`}
                            name={group.name}
                            description={group.description}
                            preview={readingPreviewById.get(group.id) || 'Loading…'}
                            checked={selectedReadingGroupIds.includes(group.id)}
                            onCheckedChange={(checked) =>
                              setSelectedReadingGroupIds((ids) => toggleId(ids, group.id, checked))
                            }
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-sm font-semibold">Consumable Groups</h4>
                    {consumableGroups.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No consumable groups available.</p>
                    ) : (
                      <div className="space-y-2">
                        {consumableGroups.map((group) => (
                          <GroupCheckboxRow
                            key={group.id}
                            id={`create-consumable-${group.id}`}
                            name={group.name}
                            description={group.description}
                            preview={consumablePreviewById.get(group.id) || 'Loading…'}
                            checked={selectedConsumableGroupIds.includes(group.id)}
                            onCheckedChange={(checked) =>
                              setSelectedConsumableGroupIds((ids) => toggleId(ids, group.id, checked))
                            }
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-sm font-semibold">Photo Groups</h4>
                    {photoGroups.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No photo groups available.</p>
                    ) : (
                      <div className="space-y-2">
                        {photoGroups.map((group) => (
                          <GroupCheckboxRow
                            key={group.id}
                            id={`create-photo-${group.id}`}
                            name={group.name}
                            description={group.description}
                            preview={photoPreviewById.get(group.id) || 'Loading…'}
                            checked={selectedPhotoGroupIds.includes(group.id)}
                            onCheckedChange={(checked) =>
                              setSelectedPhotoGroupIds((ids) => toggleId(ids, group.id, checked))
                            }
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-sm font-semibold">Selector Groups</h4>
                    {selectorGroups.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No selector groups available.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectorGroups.map((group) => (
                          <GroupCheckboxRow
                            key={group.id}
                            id={`create-selector-${group.id}`}
                            name={group.name}
                            description={group.description}
                            preview={selectorPreviewById.get(group.id) || 'Loading…'}
                            checked={selectedSelectorGroupIds.includes(group.id)}
                            onCheckedChange={(checked) =>
                              setSelectedSelectorGroupIds((ids) => toggleId(ids, group.id, checked))
                            }
                          />
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Choose what is included when automatic service-complete emails are sent.
                  </p>

                  <FormField
                    control={form.control}
                    name="sendAutomaticEmails"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
                        <div className="space-y-1">
                          <FormLabel className="text-sm font-semibold text-gray-800">Send Automatic Emails</FormLabel>
                          <p className="text-muted-foreground text-sm font-normal">
                            Automatically email clients when a service is completed
                          </p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div
                    className={cn(
                      'space-y-0 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white',
                      includeOptionsDisabled && 'opacity-60'
                    )}
                  >
                    <FormField
                      control={form.control}
                      name="sendPhotoGroups"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between gap-4 p-4">
                          <div className="space-y-1">
                            <FormLabel className="text-sm font-semibold text-gray-800">Photo Groups</FormLabel>
                            <p className="text-muted-foreground text-sm font-normal">Include photo groups in the email</p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={includeOptionsDisabled}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="technicianNotes"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between gap-4 p-4">
                          <GrowPlanSwitchLabel
                            label="Technician Notes"
                            description="Include technician notes in the email"
                            isFreePlan={isFreePlan}
                          />
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={includeOptionsDisabled || isFreePlan}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sendReadingsGroups"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between gap-4 p-4">
                          <GrowPlanSwitchLabel
                            label="Reading Groups"
                            description="Include reading groups data in the email"
                            isFreePlan={isFreePlan}
                          />
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={includeOptionsDisabled || isFreePlan}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sendConsumablesGroups"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between gap-4 p-4">
                          <GrowPlanSwitchLabel
                            label="Consumable Groups"
                            description="Include consumable groups data in the email"
                            isFreePlan={isFreePlan}
                          />
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={includeOptionsDisabled || isFreePlan}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sendSelectorsGroups"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between gap-4 p-4">
                          <GrowPlanSwitchLabel
                            label="Selector Groups"
                            description="Include selector groups data in the email"
                            isFreePlan={isFreePlan}
                          />
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={includeOptionsDisabled || isFreePlan}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sendChecklist"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between gap-4 p-4">
                          <GrowPlanSwitchLabel
                            label="Checklist"
                            description="Include checklist data in the email"
                            isFreePlan={isFreePlan}
                          />
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={includeOptionsDisabled || isFreePlan}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-6 py-5 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading} className="w-full sm:w-auto">
                Cancel
              </Button>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={handleBack} disabled={isLoading} className="w-full sm:w-auto">
                    Back
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={() => {
                    void handlePrimaryAction();
                  }}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {step < 3 ? 'Next' : isLoading ? 'Creating...' : 'Create Service Type'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
