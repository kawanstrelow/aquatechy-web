'use client';

import { useTranslations } from 'next-intl';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useGetSelectorOptions } from '@/hooks/react-query/selector-options/useGetSelectorOptions';

import {
  SelectorDefinition,
  SelectorOption,
  BatchSelectorOptionUpdate,
  BatchSelectorOptionCreate
} from '@/ts/interfaces/SelectorGroups';

import { CreateSelectorOptionDialog } from './CreateSelectorOptionDialog';
import { EditSelectorOptionDialog } from './EditSelectorOptionDialog';

// Draggable Selector Option Row Component
interface DraggableSelectorOptionRowProps {
  option: SelectorOption;
  onEdit: (option: SelectorOption) => void;
  onDelete: (option: SelectorOption) => void;
  isUpdating: boolean;
  pendingChanges: {
    updates: Map<string, Partial<SelectorOption>>;
    deletes: Set<string>;
    creates: BatchSelectorOptionCreate[];
  };
}

function DraggableSelectorOptionRow({
  option,
  onEdit,
  onDelete,
  isUpdating,
  pendingChanges
}: DraggableSelectorOptionRowProps) {
  const t = useTranslations('settings');

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  // Determine row styling based on pending changes
  let rowClassName = '';
  if (option.id.startsWith('temp-')) {
    rowClassName = 'bg-green-50'; // New option
  } else if (pendingChanges.updates.has(option.id)) {
    rowClassName = 'bg-blue-50'; // Modified option
  } else if (pendingChanges.deletes.has(option.id)) {
    rowClassName = 'bg-red-50'; // Deleted option
  }

  return (
    <TableRow ref={setNodeRef} style={style} className={`${isDragging ? 'z-50' : ''} ${rowClassName}`}>
      <TableCell {...attributes} {...listeners}>
        <GripVertical className="text-muted-foreground h-4 w-4 cursor-grab active:cursor-grabbing" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="font-medium">{option.text}</div>
          {option.id.startsWith('temp-') && (
            <Badge variant="default" className="bg-green-600 text-xs text-white">
              New
            </Badge>
          )}
          {pendingChanges.updates.has(option.id) && !option.id.startsWith('temp-') && (
            <Badge variant="default" className="bg-blue-600 text-xs text-white">
              Modified
            </Badge>
          )}
          {pendingChanges.deletes.has(option.id) && (
            <Badge variant="destructive" className="text-xs">
              {t('fields.deleted')}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(option)}
            disabled={isUpdating}
            className="h-8 w-8 p-0"
            title={t('selectors.editOptionAction')}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(option)}
            disabled={isUpdating}
            className="text-destructive hover:text-destructive h-8 w-8 p-0"
            title={t('selectors.deleteOptionAction')}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface ManageOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectorDefinition: SelectorDefinition | null;
  onOptionsChange: (
    definitionId: string,
    optionUpdates: Map<string, Partial<SelectorOption>>,
    optionDeletes: Set<string>,
    optionCreates: BatchSelectorOptionCreate[]
  ) => void;
  isLoading: boolean;
}

export function ManageOptionsDialog({
  open,
  onOpenChange,
  selectorDefinition,
  onOptionsChange,
  isLoading: parentLoading
}: ManageOptionsDialogProps) {
  const t = useTranslations('settings');

  const [editingOption, setEditingOption] = useState<SelectorOption | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [localOptions, setLocalOptions] = useState<SelectorOption[]>([]);
  const [pendingChanges, setPendingChanges] = useState<{
    updates: Map<string, Partial<SelectorOption>>;
    deletes: Set<string>;
    creates: BatchSelectorOptionCreate[];
  }>({
    updates: new Map(),
    deletes: new Set(),
    creates: []
  });

  const { data: optionsData, isLoading } = useGetSelectorOptions(selectorDefinition?.id || '');

  const options = localOptions.length > 0 ? localOptions : optionsData?.selectorOptions || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Update local options when data changes
  useEffect(() => {
    if (optionsData?.selectorOptions) {
      const sortedOptions = [...optionsData.selectorOptions].sort((a, b) => a.order - b.order);
      setLocalOptions(sortedOptions);
    }
  }, [optionsData?.selectorOptions]);

  // Reset when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setPendingChanges({
        updates: new Map(),
        deletes: new Set(),
        creates: []
      });
      setLocalOptions([]);
    }
  }, [open]);

  const handleCreateOption = (data: any) => {
    if (!selectorDefinition) return;

    // Check if an option with the same text already exists in creates
    const existingCreate = pendingChanges.creates.find((create) => create.text === data.text);

    if (existingCreate) {
      return; // Prevent duplicate creation
    }

    const newOption: BatchSelectorOptionCreate = {
      selectorDefinitionId: selectorDefinition.id,
      text: data.text,
      value: data.value,
      order: options.length + pendingChanges.creates.length
    };

    // Add to pending creates
    setPendingChanges((prev) => ({
      ...prev,
      creates: [...prev.creates, newOption]
    }));

    // Add to local state with temporary ID for UI
    const tempOption: SelectorOption = {
      id: `temp-${Date.now()}`,
      text: data.text,
      value: data.value,
      order: options.length + pendingChanges.creates.length,
      selectorDefinitionId: selectorDefinition.id,
      createdAt: new Date().toISOString()
    };

    setLocalOptions((prev) => [...prev, tempOption]);
    setShowCreateDialog(false);
  };

  const handleUpdateOption = (data: any) => {
    if (editingOption) {
      // Don't update temporary options in pending changes
      if (editingOption.id.startsWith('temp-')) {
        // Update the create in pending changes
        setPendingChanges((prev) => ({
          ...prev,
          creates: prev.creates.map((create) => (create.text === editingOption.text ? { ...create, ...data } : create))
        }));
      } else {
        // Update existing option in pending changes
        setPendingChanges((prev) => {
          const updates = new Map(prev.updates);
          const existingUpdate = updates.get(editingOption.id) || {};
          updates.set(editingOption.id, { ...existingUpdate, ...data });
          return { ...prev, updates };
        });
      }

      // Update local state
      setLocalOptions((prev) => prev.map((opt) => (opt.id === editingOption.id ? { ...opt, ...data } : opt)));

      setEditingOption(null);
    }
  };

  const handleDeleteOption = (option: SelectorOption) => {
    // Don't delete temporary (new) options - just remove them from creates and local state
    if (option.id.startsWith('temp-')) {
      // Remove from pending creates
      setPendingChanges((prev) => ({
        ...prev,
        creates: prev.creates.filter((create) => create.text !== option.text)
      }));
    } else {
      // Add real options to pending deletes
      setPendingChanges((prev) => ({
        ...prev,
        deletes: new Set(prev.deletes).add(option.id)
      }));
    }

    // Remove from local state immediately for UI feedback
    setLocalOptions((prev) => prev.filter((opt) => opt.id !== option.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = options.findIndex((opt) => opt.id === active.id);
      const newIndex = options.findIndex((opt) => opt.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOptions = arrayMove(options, oldIndex, newIndex);
        const updatedOptions = newOptions.map((opt, index) => ({
          ...opt,
          order: index
        }));

        setLocalOptions(updatedOptions);

        // Update pending changes
        updatedOptions.forEach((opt, index) => {
          if (opt.id.startsWith('temp-')) {
            // Update order in creates array
            setPendingChanges((prev) => ({
              ...prev,
              creates: prev.creates.map((create) => (create.text === opt.text ? { ...create, order: index } : create))
            }));
          } else {
            // Add to updates map
            setPendingChanges((prev) => {
              const updates = new Map(prev.updates);
              const existingUpdate = updates.get(opt.id) || {};
              updates.set(opt.id, { ...existingUpdate, order: index });
              return { ...prev, updates };
            });
          }
        });
      }
    }
  };

  const handleApplyChanges = () => {
    if (selectorDefinition) {
      onOptionsChange(selectorDefinition.id, pendingChanges.updates, pendingChanges.deletes, pendingChanges.creates);
      onOpenChange(false);
    }
  };

  const hasPendingChanges = () => {
    return pendingChanges.updates.size > 0 || pendingChanges.deletes.size > 0 || pendingChanges.creates.length > 0;
  };

  if (!selectorDefinition) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{t('selectors.manageOptions')}</DialogTitle>
          <DialogDescription>Manage multiple choice options for: "{selectorDefinition?.question}"</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{t('selectors.multipleChoice')}</h3>
              <p className="text-muted-foreground text-sm">
                {options.length} options available. Drag and drop to reorder.
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} disabled={parentLoading} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t('selectors.addOption')}
            </Button>
          </div>

          {/* Pending Changes Summary */}
          {hasPendingChanges() && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-amber-800">{t('fields.pendingChanges')}</span>
                <span className="text-sm text-amber-700">
                  {pendingChanges.creates.length} new, {pendingChanges.updates.size} modified,{' '}
                  {pendingChanges.deletes.size} deleted
                </span>
              </div>
            </div>
          )}

          {isLoading ? (
            <LoadingSpinner />
          ) : options.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <div className="mb-2 text-sm">{t('selectors.noOptions')}</div>
              <p className="text-xs">{t('selectors.addOptionsHint')}</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>{t('selectors.optionText')}</TableHead>
                      <TableHead className="w-20">{t('fields.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <SortableContext items={options.map((option) => option.id)} strategy={verticalListSortingStrategy}>
                    <TableBody>
                      {options.map((option) => (
                        <DraggableSelectorOptionRow
                          key={option.id}
                          option={option}
                          onEdit={setEditingOption}
                          onDelete={handleDeleteOption}
                          isUpdating={parentLoading}
                          pendingChanges={pendingChanges}
                        />
                      ))}
                    </TableBody>
                  </SortableContext>
                </Table>
              </DndContext>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={parentLoading}>
            {t('actions.cancel')}
          </Button>
          {hasPendingChanges() && (
            <Button onClick={handleApplyChanges} disabled={parentLoading}>
              Apply Changes
            </Button>
          )}
        </DialogFooter>

        {/* Create Dialog */}
        <CreateSelectorOptionDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={handleCreateOption}
          isLoading={parentLoading}
          selectorDefinition={selectorDefinition}
          existingOptions={options}
        />

        {/* Edit Dialog */}
        <EditSelectorOptionDialog
          open={!!editingOption}
          onOpenChange={() => setEditingOption(null)}
          selectorOption={editingOption}
          onSubmit={handleUpdateOption}
          isLoading={parentLoading}
          selectorDefinition={selectorDefinition}
        />
      </DialogContent>
    </Dialog>
  );
}
