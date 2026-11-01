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
import { Plus, Edit, Trash2, X, GripVertical, Save } from 'lucide-react';

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
import { useCreateSelectorOption } from '@/hooks/react-query/selector-options/useCreateSelectorOption';
import { useUpdateSelectorOption } from '@/hooks/react-query/selector-options/useUpdateSelectorOption';
import { useDeleteSelectorOption } from '@/hooks/react-query/selector-options/useDeleteSelectorOption';
import { useBulkUpdateSelectorOptions } from '@/hooks/react-query/selector-options/useBulkUpdateSelectorOptions';

import {
  SelectorDefinition,
  SelectorOption,
  CreateSelectorOptionRequest,
  UpdateSelectorOptionRequest
} from '@/ts/interfaces/SelectorGroups';

import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { CreateSelectorOptionDialog } from './CreateSelectorOptionDialog';
import { EditSelectorOptionDialog } from './EditSelectorOptionDialog';

// Draggable Selector Option Row Component
interface DraggableSelectorOptionRowProps {
  option: SelectorOption;
  onEdit: (option: SelectorOption) => void;
  onDelete: (option: SelectorOption) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

function DraggableSelectorOptionRow({
  option,
  onEdit,
  onDelete,
  isUpdating,
  isDeleting
}: DraggableSelectorOptionRowProps) {
  const t = useTranslations('settings');

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <div className="flex items-center gap-2">
          <div
            className="text-muted-foreground h-4 w-4 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="font-medium">{option.text}</div>
        </div>
      </TableCell>

      <TableCell className="w-full items-end justify-end">
        <div className="flex w-full items-end justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(option)}
            disabled={isUpdating || isDeleting}
            className="h-8 w-8 p-0"
            title={t('selectors.editOptionAction')}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(option)}
            disabled={isDeleting || isUpdating}
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

interface SelectorOptionsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectorDefinition: SelectorDefinition | null;
  companyId: string;
}

export function SelectorOptionsManager({
  open,
  onOpenChange,
  selectorDefinition,
  companyId
}: SelectorOptionsManagerProps) {
  const t = useTranslations('settings');

  const [editingOption, setEditingOption] = useState<SelectorOption | null>(null);
  const [deletingOption, setDeletingOption] = useState<SelectorOption | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [localOptions, setLocalOptions] = useState<SelectorOption[]>([]);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);

  const { data: optionsData, isLoading } = useGetSelectorOptions(selectorDefinition?.id || '');
  const { mutate: createOption, isPending: isCreating } = useCreateSelectorOption();
  const { mutate: updateOption, isPending: isUpdating } = useUpdateSelectorOption();
  const { mutate: deleteOption, isPending: isDeleting } = useDeleteSelectorOption();
  const { mutate: bulkUpdateOptions, isPending: isBulkUpdating } = useBulkUpdateSelectorOptions(companyId);

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

  const handleCreateOption = (data: CreateSelectorOptionRequest) => {
    if (selectorDefinition) {
      createOption(
        { selectorDefinitionId: selectorDefinition.id, data },
        {
          onSuccess: () => {
            setShowCreateDialog(false);
          }
        }
      );
    }
  };

  const handleUpdateOption = (data: UpdateSelectorOptionRequest) => {
    if (editingOption && selectorDefinition) {
      updateOption(
        { selectorOptionId: editingOption.id, data, selectorDefinitionId: selectorDefinition.id },
        {
          onSuccess: () => {
            setEditingOption(null);
          }
        }
      );
    }
  };

  const handleDeleteOption = async () => {
    if (deletingOption && selectorDefinition) {
      deleteOption(
        { selectorOptionId: deletingOption.id, selectorDefinitionId: selectorDefinition.id },
        {
          onSuccess: () => {
            setDeletingOption(null);
          }
        }
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = localOptions.findIndex((option) => option.id === active.id);
      const newIndex = localOptions.findIndex((option) => option.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOptions = arrayMove(localOptions, oldIndex, newIndex);
        const updatedOptions = newOptions.map((option, index) => ({
          ...option,
          order: index + 1
        }));

        setLocalOptions(updatedOptions);
        setHasOrderChanged(true);
      }
    }
  };

  const handleSaveOrder = () => {
    const updateData = localOptions.map((option, index) => ({
      selectorOptionId: option.id,
      order: index + 1
    }));

    bulkUpdateOptions(updateData, {
      onSuccess: () => {
        setHasOrderChanged(false);
      }
    });
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
            <div className="flex items-center gap-2">
              {hasOrderChanged && (
                <Button
                  onClick={handleSaveOrder}
                  size="sm"
                  disabled={isBulkUpdating}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isBulkUpdating ? t('actions.saving') : t('selectors.saveOrder')}
                </Button>
              )}
              <Button
                onClick={() => setShowCreateDialog(true)}
                disabled={isCreating || isUpdating || isDeleting}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                {isCreating ? t('actions.adding') : t('selectors.addOption')}
              </Button>
            </div>
          </div>

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
                  <SortableContext items={options.map((option) => option.id)} strategy={verticalListSortingStrategy}>
                    <TableBody>
                      {options.map((option) => (
                        <DraggableSelectorOptionRow
                          key={option.id}
                          option={option}
                          onEdit={setEditingOption}
                          onDelete={setDeletingOption}
                          isUpdating={isUpdating}
                          isDeleting={isDeleting}
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
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating || isUpdating || isDeleting}
          >
            {t('actions.close')}
          </Button>
        </DialogFooter>

        {/* Create Dialog */}
        <CreateSelectorOptionDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={handleCreateOption}
          isLoading={isCreating}
          selectorDefinition={selectorDefinition}
          existingOptions={options}
        />

        {/* Edit Dialog */}
        <EditSelectorOptionDialog
          open={!!editingOption}
          onOpenChange={() => setEditingOption(null)}
          selectorOption={editingOption}
          onSubmit={handleUpdateOption}
          isLoading={isUpdating}
          selectorDefinition={selectorDefinition}
        />

        {/* Delete Confirmation */}
        <ConfirmActionDialog
          open={!!deletingOption}
          onOpenChange={() => setDeletingOption(null)}
          title={t('selectors.deleteOptionTitle')}
          description={t('confirm.deleteOption', { name: deletingOption?.text ?? '' })}
          onConfirm={handleDeleteOption}
          variant="destructive"
        />
      </DialogContent>
    </Dialog>
  );
}
