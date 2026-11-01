'use client';

import { useTranslations } from 'next-intl';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Settings, GripVertical, Save } from 'lucide-react';
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
import { useBatchUpdateSelectorGroup } from '@/hooks/react-query/selector-groups/useBatchUpdateSelectorGroup';

import {
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
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { useToast } from '@/components/ui/use-toast';
import { z } from 'zod';
import { ManageOptionsDialog } from './ManageOptionsDialog';

/** API: lengths on trimmed strings (batch save validation) */
const SELECTOR_LIMITS = {
  definitionQuestion: { min: 1, max: 200 },
  definitionDescription: { max: 500 },
  optionText: { min: 1, max: 50 },
  optionValue: { min: 1, max: 50 }
} as const;

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
  definitionCreates: BatchSelectorDefinitionCreate[];
  definitionUpdates: Map<string, Partial<SelectorDefinition>>;
  optionCreates: BatchSelectorOptionCreate[];
  optionUpdates: Map<string, Partial<SelectorOption>>;
}): string | undefined {
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
  definition: SelectorDefinition;
  onEdit: (definition: SelectorDefinition) => void;
  onDelete: (definition: SelectorDefinition) => void;
  onManageOptions: (definition: SelectorDefinition) => void;
  isUpdating: boolean;
  pendingChanges: {
    definitionUpdates: Map<string, Partial<SelectorDefinition>>;
    definitionDeletes: Set<string>;
    definitionCreates: BatchSelectorDefinitionCreate[];
    optionUpdates: Map<string, Partial<SelectorOption>>;
    optionDeletes: Set<string>;
    optionCreates: BatchSelectorOptionCreate[];
  };
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
      <TableCell>
        <Badge variant={definition.isRequired ? 'default' : 'secondary'} className="text-xs">
          {definition.isRequired ? 'Required' : 'Optional'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="text-muted-foreground text-sm">{definition.options?.length || 0} options</div>
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

interface SelectorDefinitionsManagerProps {
  selectorGroupId: string;
  selectorGroupName: string;
  companyId: string;
}

export function SelectorDefinitionsManager({
  selectorGroupId,
  selectorGroupName,
  companyId
}: SelectorDefinitionsManagerProps) {
  const t = useTranslations('settings');
  const [editingDefinition, setEditingDefinition] = useState<SelectorDefinition | null>(null);
  const [managingOptionsForDefinition, setManagingOptionsForDefinition] = useState<SelectorDefinition | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSaveConfirmationDialog, setShowSaveConfirmationDialog] = useState(false);
  const [localDefinitions, setLocalDefinitions] = useState<SelectorDefinition[]>([]);
  const [pendingChanges, setPendingChanges] = useState<{
    definitionUpdates: Map<string, Partial<SelectorDefinition>>;
    definitionDeletes: Set<string>;
    definitionCreates: BatchSelectorDefinitionCreate[];
    optionUpdates: Map<string, Partial<SelectorOption>>;
    optionDeletes: Set<string>;
    optionCreates: BatchSelectorOptionCreate[];
  }>({
    definitionUpdates: new Map(),
    definitionDeletes: new Set(),
    definitionCreates: [],
    optionUpdates: new Map(),
    optionDeletes: new Set(),
    optionCreates: []
  });

  const { data: definitionsData, isLoading } = useGetSelectorDefinitions(selectorGroupId);
  const { mutate: batchUpdateSelectorGroup, isPending: isBulkUpdating } = useBatchUpdateSelectorGroup(companyId);
  const { toast } = useToast();

  const definitions = localDefinitions.length > 0 ? localDefinitions : definitionsData?.selectorDefinitions || [];

  // Initialize local definitions when data loads
  useEffect(() => {
    if (definitionsData?.selectorDefinitions) {
      const sortedDefinitions = [...definitionsData.selectorDefinitions].sort((a, b) => a.order - b.order);
      setLocalDefinitions(sortedDefinitions);
    }
  }, [definitionsData]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleCreateDefinition = (data: any) => {
    // Check if a definition with the same question already exists in creates
    const existingCreate = pendingChanges.definitionCreates.find((create) => create.question === data.question);

    if (existingCreate) {
      return; // Prevent duplicate creation
    }

    const newDefinition: BatchSelectorDefinitionCreate = {
      question: data.question,
      description: data.description,
      isRequired: data.isRequired,
      order: definitions.length + pendingChanges.definitionCreates.length
    };

    // Add to pending creates
    setPendingChanges((prev) => ({
      ...prev,
      definitionCreates: [...prev.definitionCreates, newDefinition]
    }));

    // Add to local state with temporary ID for UI
    const tempDefinition: SelectorDefinition = {
      id: `temp-${Date.now()}`,
      question: data.question,
      description: data.description,
      isRequired: data.isRequired,
      order: definitions.length + pendingChanges.definitionCreates.length,
      selectorGroupId: selectorGroupId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      options: []
    };

    setLocalDefinitions((prev) => [...prev, tempDefinition]);
    setShowCreateDialog(false);
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

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = definitions.findIndex((item) => item.id === active.id);
      const newIndex = definitions.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newDefinitions = arrayMove(definitions, oldIndex, newIndex);

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

  const handleOptionsChange = (
    definitionId: string,
    optionUpdates: Map<string, Partial<SelectorOption>>,
    optionDeletes: Set<string>,
    optionCreates: BatchSelectorOptionCreate[]
  ) => {
    setPendingChanges((prev) => ({
      ...prev,
      optionUpdates: new Map([...Array.from(prev.optionUpdates.entries()), ...Array.from(optionUpdates.entries())]),
      optionDeletes: new Set([...Array.from(prev.optionDeletes), ...Array.from(optionDeletes)]),
      optionCreates: [...prev.optionCreates, ...optionCreates]
    }));
  };

  const hasPendingChanges = () => {
    return (
      pendingChanges.definitionUpdates.size > 0 ||
      pendingChanges.definitionDeletes.size > 0 ||
      pendingChanges.definitionCreates.length > 0 ||
      pendingChanges.optionUpdates.size > 0 ||
      pendingChanges.optionDeletes.size > 0 ||
      pendingChanges.optionCreates.length > 0
    );
  };

  const handleSaveAllChanges = () => {
    if (hasPendingChanges()) {
      const validationError = validatePendingSelectorBatch({
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
          selectorGroupId: selectorGroupId,
          data: batchData
        },
        {
          onSuccess: () => {
            setPendingChanges({
              definitionUpdates: new Map(),
              definitionDeletes: new Set(),
              definitionCreates: [],
              optionUpdates: new Map(),
              optionDeletes: new Set(),
              optionCreates: []
            });
          }
        }
      );
    }
  };

  const handleDiscardChanges = () => {
    // Reset local state to original data
    if (definitionsData?.selectorDefinitions) {
      const sortedDefinitions = [...definitionsData.selectorDefinitions].sort((a, b) => a.order - b.order);
      setLocalDefinitions(sortedDefinitions);
    }

    // Clear pending changes
    setPendingChanges({
      definitionUpdates: new Map(),
      definitionDeletes: new Set(),
      definitionCreates: [],
      optionUpdates: new Map(),
      optionDeletes: new Set(),
      optionCreates: []
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('selectors.definitionsTitle')}</h3>
          <p className="text-muted-foreground text-sm">{t('selectors.manageQuestions', { name: selectorGroupName })}</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} disabled={isBulkUpdating}>
          <Plus className="mr-2 h-4 w-4" />
          {t('selectors.addQuestion')}
        </Button>
      </div>

      {/* Pending Changes Summary */}
      {hasPendingChanges() && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-amber-800">{t('fields.pendingChanges')}</span>
              <span className="text-sm text-amber-700">
                {pendingChanges.definitionCreates.length + pendingChanges.optionCreates.length} new,{' '}
                {pendingChanges.definitionUpdates.size + pendingChanges.optionUpdates.size} modified,{' '}
                {pendingChanges.definitionDeletes.size + pendingChanges.optionDeletes.size} deleted
              </span>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDiscardChanges} size="sm" variant="outline" disabled={isBulkUpdating}>
                Discard Changes
              </Button>
              <Button
                onClick={() => setShowSaveConfirmationDialog(true)}
                size="sm"
                disabled={isBulkUpdating}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {isBulkUpdating ? t('actions.saving') : t('actions.saveAll')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {definitions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-muted-foreground mb-2">{t('selectors.noQuestions')}</div>
            <p className="text-muted-foreground mb-4 text-center text-sm">{t('selectors.questionsHint')}</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('selectors.createFirstQuestion')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>{t('fields.question')}</TableHead>
                  <TableHead>{t('fields.required')}</TableHead>
                  <TableHead>{t('fields.options')}</TableHead>
                  <TableHead className="w-32">{t('fields.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext items={definitions.map((def) => def.id)} strategy={verticalListSortingStrategy}>
                  {definitions.map((definition) => (
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
        </Card>
      )}

      {/* Create Dialog */}
      <CreateSelectorDefinitionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateDefinition}
        isLoading={isBulkUpdating}
        selectorGroupName={selectorGroupName}
      />

      {/* Edit Dialog */}
      <EditSelectorDefinitionDialog
        open={!!editingDefinition}
        onOpenChange={() => setEditingDefinition(null)}
        selectorDefinition={editingDefinition}
        onSubmit={handleUpdateDefinition}
        isLoading={isBulkUpdating}
        selectorGroupName={selectorGroupName}
      />

      {/* Options Manager Dialog */}
      <ManageOptionsDialog
        open={!!managingOptionsForDefinition}
        onOpenChange={() => setManagingOptionsForDefinition(null)}
        selectorDefinition={managingOptionsForDefinition}
        onOptionsChange={handleOptionsChange}
        isLoading={isBulkUpdating}
      />

      {/* Save Confirmation Dialog */}
      <ConfirmActionDialog
        open={showSaveConfirmationDialog}
        onOpenChange={setShowSaveConfirmationDialog}
        title={t('selectors.saveDefinitions')}
        description={`You are about to save changes to selector definitions and options. This action will update all open services scheduled from today onwards, expire all user sessions (users will need to log in again), and apply changes to ${pendingChanges.definitionCreates.length + pendingChanges.optionCreates.length} new, ${pendingChanges.definitionUpdates.size + pendingChanges.optionUpdates.size} modified, and ${pendingChanges.definitionDeletes.size + pendingChanges.optionDeletes.size} deleted items. This operation cannot be undone.`}
        onConfirm={async () => {
          setShowSaveConfirmationDialog(false);
          handleSaveAllChanges();
        }}
        confirmText="Save Changes"
        variant="default"
      />
    </div>
  );
}
