'use client';

import { useTranslations } from 'next-intl';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, Settings, GripVertical, Save, X } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useGetSelectorDefinitions } from '@/hooks/react-query/selector-definitions/useGetSelectorDefinitions';
import { useGetSelectorOptions } from '@/hooks/react-query/selector-options/useGetSelectorOptions';
import { useBatchUpdateSelectorGroup } from '@/hooks/react-query/selector-groups/useBatchUpdateSelectorGroup';

import {
  SelectorGroup,
  SelectorDefinition,
  SelectorOption,
  CrudSelectorGroupRequest,
  BatchSelectorDefinitionUpdate,
  BatchSelectorDefinitionCreate,
  BatchSelectorOptionUpdate,
  BatchSelectorOptionCreate
} from '@/ts/interfaces/SelectorGroups';
import { CreateSelectorDefinitionDialog } from './CreateSelectorDefinitionDialog';
import { EditSelectorDefinitionDialog } from './EditSelectorDefinitionDialog';
import { CreateSelectorOptionDialog } from './CreateSelectorOptionDialog';
import { EditSelectorOptionDialog } from './EditSelectorOptionDialog';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { useToast } from '@/components/ui/use-toast';
import { z } from 'zod';

/** API: lengths on trimmed strings */
const SELECTOR_LIMITS = {
  groupName: { min: 1, max: 100 },
  groupDescription: { max: 500 },
  definitionQuestion: { min: 1, max: 200 },
  definitionDescription: { max: 500 },
  optionText: { min: 1, max: 50 },
  optionValue: { min: 1, max: 50 }
} as const;

const selectorGroupNameSchema = z
  .string()
  .trim()
  .min(SELECTOR_LIMITS.groupName.min, 'settings.errors.nameRequiredShort')
  .max(SELECTOR_LIMITS.groupName.max, 'settings.errors.nameMax');

const selectorGroupDescriptionSchema = z
  .string()
  .trim()
  .max(SELECTOR_LIMITS.groupDescription.max, 'settings.errors.descriptionMaxDynamic');

const selectorDefinitionQuestionSchema = z
  .string()
  .trim()
  .min(SELECTOR_LIMITS.definitionQuestion.min, 'settings.errors.questionRequired')
  .max(SELECTOR_LIMITS.definitionQuestion.max, 'settings.errors.questionMax');

const selectorDefinitionDescriptionSchema = z
  .string()
  .trim()
  .max(SELECTOR_LIMITS.definitionDescription.max, 'settings.errors.descriptionMaxDynamic');

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

function getSelectorGroupNameError(name: string): string | undefined {
  const r = selectorGroupNameSchema.safeParse(name);
  return r.success ? undefined : r.error.issues[0]?.message;
}

function getSelectorGroupDescriptionError(description: string | null | undefined): string | undefined {
  if (description == null || description === '') return undefined;
  const r = selectorGroupDescriptionSchema.safeParse(description);
  return r.success ? undefined : r.error.issues[0]?.message;
}

function getSelectorDefinitionQuestionError(question: string): string | undefined {
  const r = selectorDefinitionQuestionSchema.safeParse(question);
  return r.success ? undefined : r.error.issues[0]?.message;
}

function getSelectorDefinitionDescriptionError(description: string | null | undefined): string | undefined {
  if (description == null || description === '') return undefined;
  const r = selectorDefinitionDescriptionSchema.safeParse(description);
  return r.success ? undefined : r.error.issues[0]?.message;
}

function getSelectorOptionTextError(text: string): string | undefined {
  const r = selectorOptionTextSchema.safeParse(text);
  return r.success ? undefined : r.error.issues[0]?.message;
}

function getSelectorOptionValueError(value: string): string | undefined {
  const r = selectorOptionValueSchema.safeParse(value);
  return r.success ? undefined : r.error.issues[0]?.message;
}

function validateSelectorGroupFields(name: string, description: string | null | undefined): string | undefined {
  return getSelectorGroupNameError(name) ?? getSelectorGroupDescriptionError(description ?? undefined);
}

function validateBatchDefinitionCreate(row: BatchSelectorDefinitionCreate): string | undefined {
  const q = getSelectorDefinitionQuestionError(row.question);
  if (q) return q;
  const d = getSelectorDefinitionDescriptionError(row.description);
  if (d) return d;
  if (row.order !== undefined) {
    const r = nonNegativeOrderSchema.safeParse(row.order);
    if (!r.success) return r.error.issues[0]?.message;
  }
  return undefined;
}

function validateBatchDefinitionUpdate(update: {
  question?: string;
  description?: string | null;
  order?: number;
}): string | undefined {
  if (update.question !== undefined) {
    const q = getSelectorDefinitionQuestionError(update.question);
    if (q) return q;
  }
  if (update.description !== undefined && update.description !== null) {
    const d = getSelectorDefinitionDescriptionError(update.description);
    if (d) return d;
  }
  if (update.order !== undefined) {
    const r = nonNegativeOrderSchema.safeParse(update.order);
    if (!r.success) return r.error.issues[0]?.message;
  }
  return undefined;
}

function validateBatchOptionCreate(row: BatchSelectorOptionCreate): string | undefined {
  const t = getSelectorOptionTextError(row.text);
  if (t) return t;
  const v = getSelectorOptionValueError(row.value);
  if (v) return v;
  if (row.order !== undefined) {
    const r = nonNegativeOrderSchema.safeParse(row.order);
    if (!r.success) return r.error.issues[0]?.message;
  }
  return undefined;
}

function validateBatchOptionUpdate(update: { text?: string; value?: string; order?: number }): string | undefined {
  if (update.text !== undefined) {
    const t = getSelectorOptionTextError(update.text);
    if (t) return t;
  }
  if (update.value !== undefined) {
    const v = getSelectorOptionValueError(update.value);
    if (v) return v;
  }
  if (update.order !== undefined) {
    const r = nonNegativeOrderSchema.safeParse(update.order);
    if (!r.success) return r.error.issues[0]?.message;
  }
  return undefined;
}

function validatePendingSelectorBatch(params: {
  group?: { name: string; description: string | null };
  definitionCreates: BatchSelectorDefinitionCreate[];
  definitionUpdates: Map<string, Partial<SelectorDefinition>>;
  optionCreates: BatchSelectorOptionCreate[];
  optionUpdates: Map<string, Partial<SelectorOption>>;
}): string | undefined {
  if (params.group) {
    const ge = validateSelectorGroupFields(params.group.name, params.group.description);
    if (ge) return ge;
  }

  for (const create of params.definitionCreates) {
    const err = validateBatchDefinitionCreate(create);
    if (err) return err;
  }

  const definitionEntries = Array.from(params.definitionUpdates.entries());
  for (let i = 0; i < definitionEntries.length; i++) {
    const err = validateBatchDefinitionUpdate(definitionEntries[i][1]);
    if (err) return err;
  }

  for (const create of params.optionCreates) {
    const err = validateBatchOptionCreate(create);
    if (err) return err;
  }

  const optionEntries = Array.from(params.optionUpdates.entries());
  for (let i = 0; i < optionEntries.length; i++) {
    const err = validateBatchOptionUpdate(optionEntries[i][1]);
    if (err) return err;
  }

  return undefined;
}

// Draggable Selector Definition Row Component
interface DraggableSelectorDefinitionRowProps {
  definition: SelectorDefinition & { localOptions?: SelectorOption[] };
  onEdit: (definition: SelectorDefinition) => void;
  onDelete: (definition: SelectorDefinition) => void;
  onManageOptions: (definition: SelectorDefinition) => void;
  isUpdating: boolean;
  pendingChanges: PendingChanges;
}

interface PendingChanges {
  groupUpdates: {
    name?: string;
    description?: string;
    isActive?: boolean;
  };
  definitionUpdates: Map<string, Partial<SelectorDefinition>>;
  definitionDeletes: Set<string>;
  definitionCreates: BatchSelectorDefinitionCreate[];
  optionUpdates: Map<string, Partial<SelectorOption>>;
  optionDeletes: Set<string>;
  optionCreates: BatchSelectorOptionCreate[];
}

function DraggableSelectorDefinitionRow({
  definition,
  onEdit,
  onDelete,
  onManageOptions,
  isUpdating,
  pendingChanges
}: DraggableSelectorDefinitionRowProps) {
  const t = useTranslations('settings');

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: definition.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  // Determine row styling based on pending changes
  let rowClassName = '';
  if (definition.id.startsWith('temp-')) {
    rowClassName = 'bg-green-50'; // New definition
  } else if (pendingChanges.definitionUpdates.has(definition.id)) {
    rowClassName = 'bg-blue-50'; // Modified definition
  } else if (pendingChanges.definitionDeletes.has(definition.id)) {
    rowClassName = 'bg-red-50'; // Deleted definition
  }

  return (
    <TableRow ref={setNodeRef} style={style} className={`${isDragging ? 'z-50' : ''} ${rowClassName}`}>
      <TableCell {...attributes} {...listeners}>
        <GripVertical className="text-muted-foreground h-4 w-4 cursor-grab active:cursor-grabbing" />
      </TableCell>
      <TableCell>
        <div>
          <div className="flex items-center gap-2">
            <div className="font-medium">{definition.question}</div>
            {definition.id.startsWith('temp-') && (
              <Badge variant="default" className="bg-green-600 text-xs text-white">
                New
              </Badge>
            )}
            {pendingChanges.definitionUpdates.has(definition.id) && !definition.id.startsWith('temp-') && (
              <Badge variant="default" className="bg-blue-600 text-xs text-white">
                Modified
              </Badge>
            )}
            {pendingChanges.definitionDeletes.has(definition.id) && (
              <Badge variant="destructive" className="text-xs">
                {t('fields.deleted')}
              </Badge>
            )}
          </div>
          {definition.description && <div className="text-muted-foreground mt-1 text-sm">{definition.description}</div>}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge variant={definition.isRequired ? 'default' : 'secondary'} className="text-xs">
          {definition.isRequired ? 'Required' : 'Optional'}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="text-muted-foreground text-sm">
          {definition.localOptions?.length || definition.options?.length || 0} options
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onManageOptions(definition)}
            disabled={isUpdating}
            className="h-8 w-8 p-0"
            title={t('selectors.manageOptions')}
          >
            <Settings className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(definition)}
            disabled={isUpdating}
            className="h-8 w-8 p-0"
            title={t('selectors.editQuestion')}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(definition)}
            disabled={isUpdating}
            className="text-destructive hover:text-destructive h-8 w-8 p-0"
            title={t('selectors.deleteQuestion')}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface ComprehensiveSelectorGroupManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectorGroup: SelectorGroup | null;
  companyId: string;
}

export function ComprehensiveSelectorGroupManager({
  open,
  onOpenChange,
  selectorGroup,
  companyId
}: ComprehensiveSelectorGroupManagerProps) {
  const t = useTranslations('settings');
  const [editingDefinition, setEditingDefinition] = useState<SelectorDefinition | null>(null);
  const [managingOptionsForDefinition, setManagingOptionsForDefinition] = useState<SelectorDefinition | null>(null);
  const [editingOption, setEditingOption] = useState<SelectorOption | null>(null);
  const [showCreateDefinitionDialog, setShowCreateDefinitionDialog] = useState(false);
  const [showCreateOptionDialog, setShowCreateOptionDialog] = useState(false);
  const [showSaveConfirmationDialog, setShowSaveConfirmationDialog] = useState(false);
  const [showDeleteConfirmationDialog, setShowDeleteConfirmationDialog] = useState(false);

  const [localDefinitions, setLocalDefinitions] = useState<
    (SelectorDefinition & { localOptions?: SelectorOption[] })[]
  >([]);
  const [localGroup, setLocalGroup] = useState<SelectorGroup | null>(null);

  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
    groupUpdates: {},
    definitionUpdates: new Map(),
    definitionDeletes: new Set(),
    definitionCreates: [],
    optionUpdates: new Map(),
    optionDeletes: new Set(),
    optionCreates: []
  });

  const { data: definitionsData, isLoading: definitionsLoading } = useGetSelectorDefinitions(selectorGroup?.id || '');
  const { mutate: batchUpdateSelectorGroup, isPending: isBulkUpdating } = useBatchUpdateSelectorGroup(companyId);
  const { toast } = useToast();

  // Initialize local state when data loads or dialog opens
  useEffect(() => {
    if (open && selectorGroup) {
      setLocalGroup(selectorGroup);
      if (definitionsData?.selectorDefinitions) {
        const sortedDefinitions = [...definitionsData.selectorDefinitions].sort((a, b) => a.order - b.order);
        setLocalDefinitions(sortedDefinitions);
      }
    }
  }, [open, selectorGroup, definitionsData]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setLocalDefinitions([]);
      setLocalGroup(null);
      setManagingOptionsForDefinition(null);
      setPendingChanges({
        groupUpdates: {},
        definitionUpdates: new Map(),
        definitionDeletes: new Set(),
        definitionCreates: [],
        optionUpdates: new Map(),
        optionDeletes: new Set(),
        optionCreates: []
      });
    }
  }, [open]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleGroupUpdate = (field: string, value: any) => {
    if (localGroup) {
      setLocalGroup((prev) => (prev ? { ...prev, [field]: value } : null));
      setPendingChanges((prev) => ({
        ...prev,
        groupUpdates: { ...prev.groupUpdates, [field]: value }
      }));
    }
  };

  const handleCreateDefinition = (data: any) => {
    // Check if a definition with the same question already exists in creates
    const existingCreate = pendingChanges.definitionCreates.find((create) => create.question === data.question);

    if (existingCreate) {
      return; // Prevent duplicate creation
    }

    const tempId = `temp-${Date.now()}`;
    const newDefinition: BatchSelectorDefinitionCreate = {
      question: data.question,
      description: data.description,
      isRequired: data.isRequired,
      order: localDefinitions.length + pendingChanges.definitionCreates.length,
      tempId: tempId
    };

    // Add to pending creates
    setPendingChanges((prev) => ({
      ...prev,
      definitionCreates: [...prev.definitionCreates, newDefinition]
    }));

    // Add to local state with temporary ID for UI
    const tempDefinition: SelectorDefinition & { localOptions?: SelectorOption[] } = {
      id: tempId,
      question: data.question,
      description: data.description,
      isRequired: data.isRequired,
      order: localDefinitions.length + pendingChanges.definitionCreates.length,
      selectorGroupId: selectorGroup?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      options: [],
      localOptions: []
    };

    setLocalDefinitions((prev) => [...prev, tempDefinition]);
    setShowCreateDefinitionDialog(false);
  };

  const handleUpdateDefinition = (data: any) => {
    if (editingDefinition) {
      // Don't update temporary definitions in pending changes
      if (editingDefinition.id.startsWith('temp-')) {
        // Update the create in pending changes
        setPendingChanges((prev) => ({
          ...prev,
          definitionCreates: prev.definitionCreates.map((create) =>
            create.question === editingDefinition.question ? { ...create, ...data } : create
          )
        }));
      } else {
        // Update existing definition in pending changes
        setPendingChanges((prev) => {
          const updates = new Map(prev.definitionUpdates);
          const existingUpdate = updates.get(editingDefinition.id) || {};
          updates.set(editingDefinition.id, { ...existingUpdate, ...data });
          return { ...prev, definitionUpdates: updates };
        });
      }

      // Update local state
      setLocalDefinitions((prev) => prev.map((def) => (def.id === editingDefinition.id ? { ...def, ...data } : def)));

      setEditingDefinition(null);
    }
  };

  const handleDeleteDefinition = (definition: SelectorDefinition) => {
    // Don't delete temporary (new) definitions - just remove them from creates and local state
    if (definition.id.startsWith('temp-')) {
      // Remove from pending creates
      setPendingChanges((prev) => ({
        ...prev,
        definitionCreates: prev.definitionCreates.filter((create) => create.question !== definition.question)
      }));
    } else {
      // Add real definitions to pending deletes
      setPendingChanges((prev) => ({
        ...prev,
        definitionDeletes: new Set(prev.definitionDeletes).add(definition.id)
      }));
    }

    // Remove from local state immediately for UI feedback
    setLocalDefinitions((prev) => prev.filter((def) => def.id !== definition.id));
  };

  const handleCreateOption = (data: any) => {
    if (!managingOptionsForDefinition) return;

    // Check if an option with the same text already exists in creates
    const existingCreate = pendingChanges.optionCreates.find(
      (create) => create.text === data.text && create.selectorDefinitionId === managingOptionsForDefinition.id
    );

    if (existingCreate) {
      return; // Prevent duplicate creation
    }

    const currentOptions =
      (managingOptionsForDefinition as any).localOptions || managingOptionsForDefinition.options || [];

    // Use the temporary ID if this is a new definition, otherwise use the real ID
    const definitionId = managingOptionsForDefinition.id.startsWith('temp-')
      ? managingOptionsForDefinition.id
      : managingOptionsForDefinition.id;

    const newOption: BatchSelectorOptionCreate = {
      selectorDefinitionId: definitionId,
      text: data.text,
      value: data.value,
      order:
        currentOptions.length +
        pendingChanges.optionCreates.filter((c) => c.selectorDefinitionId === definitionId).length
    };

    // Add to pending creates
    setPendingChanges((prev) => ({
      ...prev,
      optionCreates: [...prev.optionCreates, newOption]
    }));

    // Add to local state with temporary ID for UI
    const tempOption: SelectorOption = {
      id: `temp-option-${Date.now()}`,
      text: data.text,
      value: data.value,
      order: currentOptions.length,
      selectorDefinitionId: managingOptionsForDefinition.id,
      createdAt: new Date().toISOString()
    };

    // Update the local definition's options
    setLocalDefinitions((prev) =>
      prev.map((def) =>
        def.id === managingOptionsForDefinition.id
          ? {
              ...def,
              localOptions: [...(def.localOptions || def.options || []), tempOption]
            }
          : def
      )
    );

    setShowCreateOptionDialog(false);
  };

  const handleUpdateOption = (data: any) => {
    if (editingOption && managingOptionsForDefinition) {
      // Don't update temporary options in pending changes
      if (editingOption.id.startsWith('temp-option-')) {
        // Update the create in pending changes
        setPendingChanges((prev) => ({
          ...prev,
          optionCreates: prev.optionCreates.map((create) =>
            create.text === editingOption.text && create.selectorDefinitionId === managingOptionsForDefinition.id
              ? { ...create, ...data }
              : create
          )
        }));
      } else {
        // Update existing option in pending changes
        setPendingChanges((prev) => {
          const updates = new Map(prev.optionUpdates);
          const existingUpdate = updates.get(editingOption.id) || {};
          updates.set(editingOption.id, { ...existingUpdate, ...data });
          return { ...prev, optionUpdates: updates };
        });
      }

      // Update local state
      setLocalDefinitions((prev) =>
        prev.map((def) =>
          def.id === managingOptionsForDefinition.id
            ? {
                ...def,
                localOptions: (def.localOptions || def.options || []).map((opt) =>
                  opt.id === editingOption.id ? { ...opt, ...data } : opt
                )
              }
            : def
        )
      );

      setEditingOption(null);
    }
  };

  const handleDeleteOption = (option: SelectorOption) => {
    if (!managingOptionsForDefinition) return;

    // Don't delete temporary (new) options - just remove them from creates and local state
    if (option.id.startsWith('temp-option-')) {
      // Remove from pending creates
      setPendingChanges((prev) => ({
        ...prev,
        optionCreates: prev.optionCreates.filter(
          (create) => !(create.text === option.text && create.selectorDefinitionId === managingOptionsForDefinition.id)
        )
      }));
    } else {
      // Add real options to pending deletes
      setPendingChanges((prev) => ({
        ...prev,
        optionDeletes: new Set(prev.optionDeletes).add(option.id)
      }));
    }

    // Remove from local state immediately for UI feedback
    setLocalDefinitions((prev) =>
      prev.map((def) =>
        def.id === managingOptionsForDefinition.id
          ? {
              ...def,
              localOptions: (def.localOptions || def.options || []).filter((opt) => opt.id !== option.id)
            }
          : def
      )
    );
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = localDefinitions.findIndex((item) => item.id === active.id);
      const newIndex = localDefinitions.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newDefinitions = arrayMove(localDefinitions, oldIndex, newIndex);

        // Update order for each definition
        const updatedDefinitions = newDefinitions.map((def, index) => ({
          ...def,
          order: index
        }));

        setLocalDefinitions(updatedDefinitions);

        // Update pending changes
        updatedDefinitions.forEach((def, index) => {
          if (def.id.startsWith('temp-')) {
            // Update order in creates array
            setPendingChanges((prev) => ({
              ...prev,
              definitionCreates: prev.definitionCreates.map((create) =>
                create.question === def.question ? { ...create, order: index } : create
              )
            }));
          } else {
            // Add to updates map
            setPendingChanges((prev) => {
              const updates = new Map(prev.definitionUpdates);
              const existingUpdate = updates.get(def.id) || {};
              updates.set(def.id, { ...existingUpdate, order: index });
              return { ...prev, definitionUpdates: updates };
            });
          }
        });
      }
    }
  };

  const hasPendingChanges = () => {
    return (
      Object.keys(pendingChanges.groupUpdates).length > 0 ||
      pendingChanges.definitionUpdates.size > 0 ||
      pendingChanges.definitionDeletes.size > 0 ||
      pendingChanges.definitionCreates.length > 0 ||
      pendingChanges.optionUpdates.size > 0 ||
      pendingChanges.optionDeletes.size > 0 ||
      pendingChanges.optionCreates.length > 0
    );
  };

  const handleSaveAllChanges = () => {
    if (hasPendingChanges() && selectorGroup && localGroup) {
      const validationError = validatePendingSelectorBatch({
        group: { name: localGroup.name, description: localGroup.description },
        definitionCreates: pendingChanges.definitionCreates,
        definitionUpdates: pendingChanges.definitionUpdates,
        optionCreates: pendingChanges.optionCreates,
        optionUpdates: pendingChanges.optionUpdates
      });
      if (validationError) {
        toast({
          variant: 'error',
          title: t('selectors.cannotSave'),
          description: validationError
        });
        return;
      }

      const batchData: CrudSelectorGroupRequest = {
        selectorDefinitionsUpdates: [],
        selectorDefinitionsCreates: [],
        selectorDefinitionsDeletes: [],
        selectorOptionsUpdates: [],
        selectorOptionsCreates: [],
        selectorOptionsDeletes: []
      };

      // Add group updates
      if (Object.keys(pendingChanges.groupUpdates).length > 0) {
        Object.assign(batchData, pendingChanges.groupUpdates);
      }

      // Add definition updates
      Array.from(pendingChanges.definitionUpdates.entries()).forEach(([definitionId, update]) => {
        batchData.selectorDefinitionsUpdates!.push({
          selectorDefinitionId: definitionId,
          ...update
        });
      });

      // Add definition creates
      if (pendingChanges.definitionCreates.length > 0) {
        batchData.selectorDefinitionsCreates = pendingChanges.definitionCreates;
      }

      // Add definition deletes
      if (pendingChanges.definitionDeletes.size > 0) {
        batchData.selectorDefinitionsDeletes = Array.from(pendingChanges.definitionDeletes);
      }

      // Add option updates
      Array.from(pendingChanges.optionUpdates.entries()).forEach(([optionId, update]) => {
        batchData.selectorOptionsUpdates!.push({
          selectorOptionId: optionId,
          ...update
        });
      });

      // Add option creates
      if (pendingChanges.optionCreates.length > 0) {
        batchData.selectorOptionsCreates = pendingChanges.optionCreates;
      }

      // Add option deletes
      if (pendingChanges.optionDeletes.size > 0) {
        batchData.selectorOptionsDeletes = Array.from(pendingChanges.optionDeletes);
      }

      // Remove empty arrays to clean up the request
      Object.keys(batchData).forEach((key) => {
        const value = batchData[key as keyof CrudSelectorGroupRequest];
        if (Array.isArray(value) && value.length === 0) {
          delete batchData[key as keyof CrudSelectorGroupRequest];
        }
      });

      batchUpdateSelectorGroup(
        {
          selectorGroupId: selectorGroup.id,
          data: batchData
        },
        {
          onSuccess: () => {
            setPendingChanges({
              groupUpdates: {},
              definitionUpdates: new Map(),
              definitionDeletes: new Set(),
              definitionCreates: [],
              optionUpdates: new Map(),
              optionDeletes: new Set(),
              optionCreates: []
            });
            onOpenChange(false);
          }
        }
      );
    }
  };

  const handleDiscardChanges = () => {
    // Reset local state to original data
    if (selectorGroup) {
      setLocalGroup(selectorGroup);
    }
    if (definitionsData?.selectorDefinitions) {
      const sortedDefinitions = [...definitionsData.selectorDefinitions].sort((a, b) => a.order - b.order);
      setLocalDefinitions(sortedDefinitions);
    }

    // Clear pending changes
    setPendingChanges({
      groupUpdates: {},
      definitionUpdates: new Map(),
      definitionDeletes: new Set(),
      definitionCreates: [],
      optionUpdates: new Map(),
      optionDeletes: new Set(),
      optionCreates: []
    });
  };

  const handleDeleteGroup = () => {
    if (selectorGroup) {
      const batchData: CrudSelectorGroupRequest = {
        deleteGroup: true
      };

      batchUpdateSelectorGroup(
        {
          selectorGroupId: selectorGroup.id,
          data: batchData
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          }
        }
      );
    }
  };

  if (!selectorGroup || !localGroup) {
    return null;
  }

  const managingDefinitionOptions = managingOptionsForDefinition
    ? localDefinitions.find((d) => d.id === managingOptionsForDefinition.id)?.localOptions ||
      localDefinitions.find((d) => d.id === managingOptionsForDefinition.id)?.options ||
      []
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>{t('selectors.manageGroup')}</DialogTitle>
          <DialogDescription>{t('selectors.comprehensiveHint')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group Settings */}
          <Card>
            <CardHeader>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-lg">{t('selectors.groupSettings')}</CardTitle>
                <Button
                  onClick={() => setShowDeleteConfirmationDialog(true)}
                  variant="destructive"
                  size="sm"
                  disabled={isBulkUpdating}
                  className="mt-2 w-full sm:mt-0 sm:w-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('selectors.deleteGroupAction')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex w-full flex-col sm:flex-row sm:gap-4">
                <div className="flex-1">
                  <Label htmlFor="groupName">{t('fields.name')}</Label>
                  <Input
                    id="groupName"
                    value={localGroup.name}
                    onChange={(e) => handleGroupUpdate('name', e.target.value)}
                    disabled={isBulkUpdating}
                    maxLength={SELECTOR_LIMITS.groupName.max}
                  />
                </div>
                <div className="mt-2 flex-1 sm:mt-0">
                  <Label htmlFor="groupDescription">{t('fields.description')}</Label>
                  <Textarea
                    id="groupDescription"
                    value={localGroup.description || ''}
                    onChange={(e) => handleGroupUpdate('description', e.target.value)}
                    disabled={isBulkUpdating}
                    rows={2}
                    maxLength={SELECTOR_LIMITS.groupDescription.max}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Pending Changes Summary */}
          {hasPendingChanges() && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <span className="text-sm font-medium text-amber-800">{t('fields.pendingChanges')}</span>
                  <span className="text-sm text-amber-700">
                    {Object.keys(pendingChanges.groupUpdates).length > 0 ? t('selectors.oneGroup') : ''}
                    {t('selectors.newCount', {
                      count: pendingChanges.definitionCreates.length + pendingChanges.optionCreates.length
                    })}
                    {t('selectors.modifiedCount', {
                      count: pendingChanges.definitionUpdates.size + pendingChanges.optionUpdates.size
                    })}
                    {t('selectors.deletedCount', {
                      count: pendingChanges.definitionDeletes.size + pendingChanges.optionDeletes.size
                    })}
                  </span>
                </div>
                <div className="mt-2 flex w-full flex-col gap-2 sm:mt-0 sm:w-auto sm:flex-row">
                  <Button
                    onClick={handleDiscardChanges}
                    size="sm"
                    variant="outline"
                    disabled={isBulkUpdating}
                    className="w-full sm:w-auto"
                  >
                    Discard Changes
                  </Button>
                  <Button
                    onClick={() => setShowSaveConfirmationDialog(true)}
                    size="sm"
                    disabled={isBulkUpdating}
                    className="w-full bg-green-600 text-white hover:bg-green-700 sm:w-auto"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isBulkUpdating ? t('actions.saving') : t('actions.saveAll')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Definitions Management */}
          <Card>
            <CardHeader>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">{t('selectors.questionsAndOptions')}</CardTitle>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Manage questions and their multiple choice options
                  </p>
                </div>
                <Button onClick={() => setShowCreateDefinitionDialog(true)} disabled={isBulkUpdating} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('selectors.addQuestion')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {definitionsLoading ? (
                <LoadingSpinner />
              ) : localDefinitions.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  <div className="mb-2 text-sm">{t('selectors.noQuestions')}</div>
                  <p className="text-xs">{t('selectors.questionsHint')}</p>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>{t('fields.question')}</TableHead>
                        <TableHead className="hidden md:table-cell">{t('fields.required')}</TableHead>
                        <TableHead className="hidden md:table-cell">{t('fields.options')}</TableHead>
                        <TableHead className="w-32">{t('fields.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <SortableContext
                        items={localDefinitions.map((def) => def.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {localDefinitions.map((definition) => (
                          <DraggableSelectorDefinitionRow
                            key={definition.id}
                            definition={definition}
                            onEdit={setEditingDefinition}
                            onDelete={handleDeleteDefinition}
                            onManageOptions={setManagingOptionsForDefinition}
                            isUpdating={isBulkUpdating}
                            pendingChanges={pendingChanges}
                          />
                        ))}
                      </SortableContext>
                    </TableBody>
                  </Table>
                </DndContext>
              )}
            </CardContent>
          </Card>

          {/* Options Management for Selected Definition */}
          {managingOptionsForDefinition && (
            <Card>
              <CardHeader>
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">Options for: "{managingOptionsForDefinition?.question}"</CardTitle>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Manage multiple choice options for this question
                    </p>
                  </div>
                  <div className="mt-2 flex w-full flex-col gap-2 sm:mt-0 sm:w-auto sm:flex-row">
                    <Button onClick={() => setShowCreateOptionDialog(true)} disabled={isBulkUpdating} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('selectors.addOption')}
                    </Button>
                    <Button onClick={() => setManagingOptionsForDefinition(null)} variant="outline" size="sm">
                      <X className="mr-2 h-4 w-4" />
                      {t('actions.close')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {managingDefinitionOptions.length === 0 ? (
                  <div className="text-muted-foreground py-4 text-center">
                    <div className="mb-2 text-sm">{t('selectors.noOptions')}</div>
                    <p className="text-xs">{t('selectors.addOptionsHint')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {managingDefinitionOptions.map((option) => (
                      <div
                        key={option.id}
                        className={`flex items-center justify-between rounded-lg border p-3 ${
                          option.id.startsWith('temp-option-')
                            ? 'bg-green-50'
                            : pendingChanges.optionUpdates.has(option.id)
                              ? 'bg-blue-50'
                              : pendingChanges.optionDeletes.has(option.id)
                                ? 'bg-red-50'
                                : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.text}</span>

                          {pendingChanges.optionUpdates.has(option.id) && !option.id.startsWith('temp-option-') && (
                            <Badge variant="default" className="bg-blue-600 text-xs text-white">
                              Modified
                            </Badge>
                          )}
                          {pendingChanges.optionDeletes.has(option.id) && (
                            <Badge variant="destructive" className="text-xs">
                              {t('fields.deleted')}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingOption(option)}
                            disabled={isBulkUpdating}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOption(option)}
                            disabled={isBulkUpdating}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Definition Dialog */}
        <CreateSelectorDefinitionDialog
          open={showCreateDefinitionDialog}
          onOpenChange={setShowCreateDefinitionDialog}
          onSubmit={handleCreateDefinition}
          isLoading={isBulkUpdating}
          selectorGroupName={localGroup.name}
        />

        {/* Edit Definition Dialog */}
        <EditSelectorDefinitionDialog
          open={!!editingDefinition}
          onOpenChange={() => setEditingDefinition(null)}
          selectorDefinition={editingDefinition}
          onSubmit={handleUpdateDefinition}
          isLoading={isBulkUpdating}
          selectorGroupName={localGroup.name}
        />

        {/* Create Option Dialog */}
        <CreateSelectorOptionDialog
          open={showCreateOptionDialog}
          onOpenChange={setShowCreateOptionDialog}
          onSubmit={handleCreateOption}
          isLoading={isBulkUpdating}
          selectorDefinition={managingOptionsForDefinition!}
          existingOptions={managingDefinitionOptions}
        />

        {/* Edit Option Dialog */}
        <EditSelectorOptionDialog
          open={!!editingOption}
          onOpenChange={() => setEditingOption(null)}
          selectorOption={editingOption}
          onSubmit={handleUpdateOption}
          isLoading={isBulkUpdating}
          selectorDefinition={managingOptionsForDefinition!}
        />

        {/* Save Confirmation Dialog */}
        <ConfirmActionDialog
          open={showSaveConfirmationDialog}
          onOpenChange={setShowSaveConfirmationDialog}
          title={t('selectors.saveAll')}
          description={t('selectors.saveConfirm', {
            groupUpdate: Object.keys(pendingChanges.groupUpdates).length > 0 ? t('selectors.oneGroupUpdate') : '',
            created: pendingChanges.definitionCreates.length + pendingChanges.optionCreates.length,
            modified: pendingChanges.definitionUpdates.size + pendingChanges.optionUpdates.size,
            deleted: pendingChanges.definitionDeletes.size + pendingChanges.optionDeletes.size
          })}
          onConfirm={async () => {
            setShowSaveConfirmationDialog(false);
            handleSaveAllChanges();
          }}
          confirmText="Save All Changes"
          variant="default"
        />

        {/* Delete Group Confirmation Dialog */}
        <ConfirmActionDialog
          open={showDeleteConfirmationDialog}
          onOpenChange={setShowDeleteConfirmationDialog}
          title={t('selectors.deleteGroup')}
          description={t('selectors.deleteGroupConfirm', { name: localGroup?.name ?? '' })}
          onConfirm={async () => {
            setShowDeleteConfirmationDialog(false);
            handleDeleteGroup();
          }}
          confirmText="Delete Group"
          variant="destructive"
        />
      </DialogContent>
    </Dialog>
  );
}
