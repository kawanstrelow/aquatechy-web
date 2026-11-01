import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CheckSquare, Plus, Trash2, Edit3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useCreateChecklistTemplate } from '@/hooks/react-query/checklist-templates/useCreateChecklistTemplate';
import { useUpdateChecklistTemplate } from '@/hooks/react-query/checklist-templates/useUpdateChecklistTemplate';
import { useDeleteChecklistTemplate } from '@/hooks/react-query/checklist-templates/useDeleteChecklistTemplate';
import { Pool } from '@/ts/interfaces/Pool';
import { ChecklistTemplateItem } from '@/ts/interfaces/ChecklistTemplates';

interface ChecklistTabProps {
  poolId: string;
  clientId: string;
  pool: Pool;
}

export default function ChecklistTab({ poolId, clientId, pool }: ChecklistTabProps) {
  const t = useTranslations('clients');
  // Get existing checklist template from pool
  const existingTemplate = pool.checklistTemplates?.[0];

  const [customChecklist, setCustomChecklist] = useState<ChecklistTemplateItem[]>(
    existingTemplate?.items?.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt)
    })) || []
  );
  const [newChecklistItem, setNewChecklistItem] = useState<ChecklistTemplateItem>({
    id: '',
    label: '',
    order: 0,
    createdAt: new Date()
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  // Use the custom hooks
  const { mutate: createChecklistTemplate, isPending: isCreatingTemplate } = useCreateChecklistTemplate();
  const { mutate: updateChecklistTemplate, isPending: isUpdatingTemplate } = useUpdateChecklistTemplate();
  const { mutate: deleteChecklistTemplate, isPending: isDeletingTemplate } = useDeleteChecklistTemplate();

  // Combine all loading states
  const isSaving = isCreatingTemplate || isUpdatingTemplate || isDeletingTemplate;

  // Determine if we're creating a new checklist or updating an existing one
  const isUpdating = !!existingTemplate;

  // Checklist management functions
  const addChecklistItem = () => {
    if (
      newChecklistItem.label.trim() &&
      !customChecklist.some((item) => item.label === newChecklistItem.label.trim())
    ) {
      const newItem: ChecklistTemplateItem = {
        id: Date.now().toString(),
        label: newChecklistItem.label.trim(),
        order: customChecklist.length + 1,
        createdAt: new Date()
      };
      setCustomChecklist([...customChecklist, newItem]);
      setNewChecklistItem({
        id: '',
        label: '',
        order: 0,
        createdAt: new Date()
      });
    }
  };

  const removeChecklistItem = (index: number) => {
    const updatedList = customChecklist.filter((_, i) => i !== index);
    // Update order for remaining items
    const reorderedList = updatedList.map((item, i) => ({ ...item, order: i + 1 }));
    setCustomChecklist(reorderedList);
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingText(customChecklist[index].label);
  };

  const saveEdit = () => {
    if (editingText.trim() && editingIndex !== null) {
      const updatedList = [...customChecklist];
      updatedList[editingIndex] = {
        ...updatedList[editingIndex],
        label: editingText.trim()
      };
      setCustomChecklist(updatedList);
      setEditingIndex(null);
      setEditingText('');
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingText('');
  };

  const handleSaveChecklist = () => {
    if (customChecklist.length === 0) return;

    const items = customChecklist.map((item, index) => ({
      label: item.label,
      order: index + 1
    }));

    if (isUpdating && existingTemplate) {
      // Update existing checklist template
      updateChecklistTemplate(
        {
          templateId: existingTemplate.id,
          data: { items }
        },
        {
          onSuccess: (data) => {
            // Update local state with the updated template data from backend
            if (data?.template) {
              const itemsWithDateConversion = data.template.items.map((item) => ({
                ...item,
                createdAt: new Date(item.createdAt)
              }));
              setCustomChecklist(itemsWithDateConversion || []);
            }

            // Reset editing states
            setEditingIndex(null);
            setEditingText('');

            // Reset the new item input field
            setNewChecklistItem({
              id: '',
              label: '',
              order: 0,
              createdAt: new Date()
            });
          }
        }
      );
    } else {
      // Create new checklist template
      const companyId = pool.companyOwnerId;

      createChecklistTemplate(
        {
          companyId,
          name: poolId,
          items
        },
        {
          onSuccess: (data) => {
            // Update local state with the new template data from backend
            if (data?.template) {
              const itemsWithDateConversion = data.template.items.map((item) => ({
                ...item,
                createdAt: new Date(item.createdAt)
              }));
              setCustomChecklist(itemsWithDateConversion || []);
            }

            // Reset editing states
            setEditingIndex(null);
            setEditingText('');

            // Reset the new item input field
            setNewChecklistItem({
              id: '',
              label: '',
              order: 0,
              createdAt: new Date()
            });
          }
        }
      );
    }
  };

  const handleDeleteChecklist = () => {
    if (!existingTemplate || !isUpdating) return;

    if (!confirm(t('checklist.deleteConfirm'))) {
      return;
    }

    deleteChecklistTemplate(existingTemplate.id, {
      onSuccess: () => {
        // Reset form after deletion
        setCustomChecklist([]);
        setEditingIndex(null);
        setEditingText('');
        setNewChecklistItem({
          id: '',
          label: '',
          order: 0,
          createdAt: new Date()
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {isUpdating ? t('checklist.editTitle') : t('checklist.createTitle')}
          </h3>
          <p className="text-sm text-gray-600">
            {isUpdating ? t('checklist.editDescription') : t('checklist.createDescription')}
          </p>
        </div>

        {/* Add New Item */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newChecklistItem.label}
            onChange={(e) => setNewChecklistItem({ ...newChecklistItem, label: e.target.value })}
            placeholder={t('checklist.placeholder')}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
            onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
          />
          <Button
            type="button"
            onClick={addChecklistItem}
            disabled={!newChecklistItem.label.trim()}
            className="border-1 border-blue-600 bg-gray-600 text-white hover:bg-gray-700"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Checklist Items */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-800">{t('checklist.items')}</h4>
          {customChecklist.length === 0 ? (
            <p className="text-sm italic text-gray-500">{t('checklist.empty')}</p>
          ) : (
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {customChecklist.map((item, index) => (
                <div key={index} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <CheckSquare className="h-4 w-4 flex-shrink-0 text-gray-600" />
                  {editingIndex === index ? (
                    <div className="flex flex-1 gap-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="flex-1 rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={saveEdit}
                        className="h-8 bg-green-600 px-2 py-1 text-white hover:bg-green-700"
                      >
                        {t('shared.save')}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={cancelEdit} className="h-8 px-2 py-1">
                        {t('shared.cancel')}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-gray-800">{item.label}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(index)}
                        className="h-8 w-8 p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeChecklistItem(index)}
                        className="h-8 w-8 p-1 text-red-600 hover:bg-red-100 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-800">
            <strong>{t('shared.note')}</strong> {t('checklist.noteBody')}
          </p>
        </div>
        {/* Action Buttons */}
        <div className="flex-col justify-between gap-2 pt-4">
          <div className="flex gap-2">
            {isUpdating && (
              <Button
                variant="destructive"
                onClick={handleDeleteChecklist}
                disabled={isSaving}
                className="w-full text-white"
              >
                {t('checklist.delete')}
              </Button>
            )}
            <Button
              onClick={handleSaveChecklist}
              disabled={customChecklist.length === 0 || isSaving}
              className="text-whit flex w-full bg-gray-600 text-white hover:bg-gray-700"
            >
              {isSaving ? (
                <>
                  <div className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                  {t('shared.saving')}
                </>
              ) : isUpdating ? (
                t('checklist.update')
              ) : (
                t('checklist.save')
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
