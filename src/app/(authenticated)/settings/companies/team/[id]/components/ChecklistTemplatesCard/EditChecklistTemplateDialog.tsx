'use client';

import { useTranslations } from 'next-intl';

import { useForm, useFieldArray } from 'react-hook-form';
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
import { Plus, Trash2, GripVertical } from 'lucide-react';

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

import { ChecklistTemplate, UpdateChecklistTemplateRequest } from '@/ts/interfaces/ChecklistTemplates';

// Draggable Checklist Item Component
interface DraggableChecklistItemProps {
  field: any;
  index: number;
  control: any;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

function DraggableChecklistItem({ field, index, control, onRemove, canRemove }: DraggableChecklistItemProps) {
  const t = useTranslations('settings');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 rounded-lg border p-3">
      <div
        className="text-muted-foreground mt-2 h-4 w-4 flex-shrink-0 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-2">
        <FormField
          control={control}
          name={`items.${index}.label`}
          render={({ field: inputField }) => (
            <FormItem>
              <FormControl>
                <Input placeholder={t('checklists.itemPlaceholder', { index: index + 1 })} {...inputField} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {canRemove && (
        <Button
          type="button"
          onClick={() => onRemove(index)}
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive flex-shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

const checklistItemSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'settings.errors.labelRequired').max(100, 'settings.errors.labelMax'),
  order: z.number().min(1)
});

const updateChecklistTemplateSchema = z.object({
  name: z.string().min(1, 'settings.errors.nameRequiredShort').max(100, 'settings.errors.nameMax'),
  description: z.string().max(500, 'settings.errors.descriptionMax').optional(),
  isActive: z.boolean(),
  items: z.array(checklistItemSchema).min(1, 'settings.errors.checklistItemRequired')
});

interface EditChecklistTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ChecklistTemplate | null;
  onSubmit: (data: UpdateChecklistTemplateRequest) => void;
  isLoading: boolean;
}

export function EditChecklistTemplateDialog({
  open,
  onOpenChange,
  template,
  onSubmit,
  isLoading
}: EditChecklistTemplateDialogProps) {
  const t = useTranslations('settings');

  const form = useForm<z.infer<typeof updateChecklistTemplateSchema>>({
    resolver: zodResolver(updateChecklistTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
      items: []
    }
  });

  const { fields, append, remove, replace, move } = useFieldArray({
    control: form.control,
    name: 'items'
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  useEffect(() => {
    if (template) {
      const sortedItems = [...template.items].sort((a, b) => a.order - b.order);
      form.reset({
        name: template.name,
        description: template.description || '',
        isActive: template.isActive,
        items: sortedItems.map((item) => ({
          id: item.id,
          label: item.label,
          order: item.order
        }))
      });
      replace(
        sortedItems.map((item) => ({
          id: item.id,
          label: item.label,
          order: item.order
        }))
      );
    }
  }, [template, form, replace]);

  const handleSubmit = (data: z.infer<typeof updateChecklistTemplateSchema>) => {
    const requestData: UpdateChecklistTemplateRequest = {
      name: data.name,
      description: data.description || undefined,
      isActive: data.isActive,
      items: data.items.map((item, index) => ({
        label: item.label,
        order: index + 1
      }))
    };
    onSubmit(requestData);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        move(oldIndex, newIndex);
      }
    }
  };

  const addItem = () => {
    append({
      label: '',
      order: fields.length + 1
    });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  if (!template) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('checklists.editTitle')}</DialogTitle>
          <DialogDescription>{t('checklists.editDescription')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('checklists.templateName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('checklists.namePlaceholder')} {...field} />
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
                      placeholder={t('checklists.descriptionPlaceholder')}
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>{t('checklists.itemsRequired')}</FormLabel>
                <Button type="button" onClick={addItem} size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('checklists.addItem')}
                </Button>
              </div>

              <div className="max-h-60 space-y-3 overflow-y-auto">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
                    {fields.map((field, index) => (
                      <DraggableChecklistItem
                        key={field.id}
                        field={field}
                        index={index}
                        control={form.control}
                        onRemove={removeItem}
                        canRemove={fields.length > 1}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            <DialogFooter className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('actions.updating') : t('checklists.update')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
