'use client';

import { useTranslations } from 'next-intl';

import { useState } from 'react';
import { CheckSquare, Plus, Trash2, Edit3, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useUpdateChecklistTemplate } from '@/hooks/react-query/checklist-templates/useUpdateChecklistTemplate';
import { Company } from '@/ts/interfaces/Company';
import { ChecklistTemplateItem } from '@/ts/interfaces/ChecklistTemplates';

interface CustomChecklistCardProps {
  company: Company;
  form: any;
  onCustomizationsSubmit: (data: any) => void;
  customizationsFieldsChanged: () => boolean;
}

export function CustomChecklistCard({
  company,
  form,
  onCustomizationsSubmit,
  customizationsFieldsChanged
}: CustomChecklistCardProps) {
  const t = useTranslations('settings');

  const { isPending: isChecklistPending } = useUpdateChecklistTemplate();

  const [collapsed, setCollapsed] = useState(true);

  // Add state for managing checklist items
  const [customChecklist, setCustomChecklist] = useState<ChecklistTemplateItem[]>(
    company.checklistTemplates?.[0]?.items || []
  );
  const [newChecklistItem, setNewChecklistItem] = useState<ChecklistTemplateItem>({
    id: '',
    label: '',
    order: 0,
    createdAt: new Date()
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // Add checklist management functions
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
      const updatedList = [...customChecklist, newItem];
      setCustomChecklist(updatedList);
      form.setValue('customChecklistItems', updatedList, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true
      });
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
    setCustomChecklist(updatedList);
    form.setValue('customChecklistItems', updatedList, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
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
      form.setValue('customChecklistItems', updatedList, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true
      });
      setEditingIndex(null);
      setEditingText('');
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingText('');
  };

  return (
    <Card className="w-full border-2 border-purple-200">
      <CardHeader
        className="cursor-pointer border-b border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50 transition-colors hover:from-purple-100 hover:to-violet-100"
        onClick={toggleCollapsed}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <CheckSquare className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-purple-900">{t('checklists.customTitle')}</CardTitle>
              <CardDescription className="text-purple-700">{t('checklists.customDescription')}</CardDescription>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-purple-600 transition-transform duration-200',
              collapsed ? 'rotate-180' : 'rotate-0'
            )}
          />
        </div>
      </CardHeader>
      {!collapsed && (
        <>
          <CardContent className="space-y-6 p-6">
            {/* Add New Item */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistItem.label}
                onChange={(e) => setNewChecklistItem({ ...newChecklistItem, label: e.target.value })}
                placeholder={t('checklists.newItemPlaceholder')}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
              />
              <Button
                type="button"
                onClick={addChecklistItem}
                disabled={!newChecklistItem.label.trim()}
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-800">{t('checklists.currentItems')}</h4>
              {customChecklist.length === 0 ? (
                <p className="text-sm italic text-gray-500">{t('checklists.noItemsYet')}</p>
              ) : (
                <div className="space-y-2">
                  {customChecklist.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 p-3"
                    >
                      <CheckSquare className="h-4 w-4 flex-shrink-0 text-purple-600" />
                      {editingIndex === index ? (
                        <div className="flex flex-1 gap-2">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="flex-1 rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                            {t('actions.save')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                            className="h-8 px-2 py-1"
                          >
                            {t('actions.cancel')}
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
                            className="h-8 w-8 p-1 text-purple-600 hover:bg-purple-100 hover:text-purple-700"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeChecklistItem(index)}
                            className="h-8 w-8 p-1 text-red-600 hover:bg-red-100 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <p className="text-sm text-purple-800">
                <strong>{t('actions.note')}</strong> {t('checklists.customNote')}
              </p>
            </div>
          </CardContent>

          {/* Customizations Save Button */}
          <div className="border-t bg-gray-50 p-4">
            <div className="flex justify-center">
              <Button
                type="button"
                disabled={!customizationsFieldsChanged() || isChecklistPending}
                className="w-full max-w-xs"
                onClick={() => {
                  const formData = form.getValues();
                  onCustomizationsSubmit(formData);
                }}
              >
                {isChecklistPending ? (
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" />
                ) : (
                  t('checklists.saveCustomizations')
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
