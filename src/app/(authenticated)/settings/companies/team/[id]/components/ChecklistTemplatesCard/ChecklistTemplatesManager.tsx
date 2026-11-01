'use client';

import { useTranslations } from 'next-intl';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Star, StarOff } from 'lucide-react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useGetChecklistTemplates } from '@/hooks/react-query/checklist-templates/useGetChecklistTemplates';
import { useCreateChecklistTemplate } from '@/hooks/react-query/checklist-templates/useCreateChecklistTemplate';
import { useUpdateChecklistTemplate } from '@/hooks/react-query/checklist-templates/useUpdateChecklistTemplate';
import { useDeleteChecklistTemplate } from '@/hooks/react-query/checklist-templates/useDeleteChecklistTemplate';
import { useSetDefaultChecklistTemplate } from '@/hooks/react-query/checklist-templates/useSetDefaultChecklistTemplate';

import {
  ChecklistTemplate,
  CreateChecklistTemplateRequest,
  UpdateChecklistTemplateRequest
} from '@/ts/interfaces/ChecklistTemplates';

import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { CreateChecklistTemplateDialog } from './CreateChecklistTemplateDialog';
import { EditChecklistTemplateDialog } from './EditChecklistTemplateDialog';

interface ChecklistTemplatesManagerProps {
  companyId: string;
}

export function ChecklistTemplatesManager({ companyId }: ChecklistTemplatesManagerProps) {
  const t = useTranslations('settings');

  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<ChecklistTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: templatesData, isLoading } = useGetChecklistTemplates({ companyId });
  const { mutate: createTemplate, isPending: isCreating } = useCreateChecklistTemplate();
  const { mutate: updateTemplate, isPending: isUpdating } = useUpdateChecklistTemplate();
  const { mutate: deleteTemplate, isPending: isDeleting } = useDeleteChecklistTemplate();
  const { mutate: setDefaultTemplate, isPending: isSettingDefault } = useSetDefaultChecklistTemplate();

  const templates = templatesData?.templates || [];

  const toggleTemplateExpansion = (templateId: string) => {
    setExpandedTemplates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };

  const handleCreateTemplate = (data: CreateChecklistTemplateRequest) => {
    createTemplate(data, {
      onSuccess: () => {
        setShowCreateDialog(false);
      }
    });
  };

  const handleUpdateTemplate = (data: UpdateChecklistTemplateRequest) => {
    if (editingTemplate) {
      updateTemplate(
        { templateId: editingTemplate.id, data },
        {
          onSuccess: () => {
            setEditingTemplate(null);
          }
        }
      );
    }
  };

  const handleDeleteTemplate = async () => {
    if (deletingTemplate) {
      deleteTemplate(deletingTemplate.id, {
        onSuccess: () => {
          setDeletingTemplate(null);
        }
      });
    }
  };

  const handleSetDefault = (templateId: string) => {
    setDefaultTemplate(templateId);
  };

  const getTemplateTypeLabel = (template: ChecklistTemplate) => {
    if (template.poolId) return 'Pool-specific';
    return 'Company-wide';
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
        <div>
          <h3 className="text-lg font-semibold">{t('checklists.title')}</h3>
          <p className="text-muted-foreground text-sm">{t('checklists.managerDescription')}</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} disabled={isCreating} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t('checklists.addTemplate')}
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-muted-foreground mb-2">{t('checklists.empty')}</div>
            <p className="text-muted-foreground mb-4 text-center text-sm">{t('checklists.emptyHint')}</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('checklists.createFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="pb-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                    {' '}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTemplateExpansion(template.id)}
                      className="h-8 w-8 p-0"
                    >
                      {expandedTemplates.has(template.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        {template.name}

                        {!template.isActive && (
                          <Badge variant="outline" className="text-xs">
                            {t('statuses.Inactive')}
                          </Badge>
                        )}
                      </CardTitle>
                      {template.description && (
                        <CardDescription className="text-sm">{template.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                      disabled={isUpdating}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingTemplate(template)}
                      disabled={isDeleting}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {expandedTemplates.has(template.id) && (
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">{t('checklists.items')}</h4>
                    {template.items.length === 0 ? (
                      <p className="text-muted-foreground text-sm italic">{t('checklists.noItems')}</p>
                    ) : (
                      <div className="space-y-1">
                        {template.items
                          .sort((a, b) => a.order - b.order)
                          .map((item, index) => (
                            <div key={item.id} className="bg-muted/50 flex items-center gap-2 rounded p-2">
                              <span className="text-muted-foreground min-w-[20px] text-xs">{index + 1}.</span>
                              <span className="text-sm">{item.label}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateChecklistTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateTemplate}
        isLoading={isCreating}
        companyId={companyId}
      />

      {/* Edit Dialog */}
      <EditChecklistTemplateDialog
        open={!!editingTemplate}
        onOpenChange={() => setEditingTemplate(null)}
        template={editingTemplate}
        onSubmit={handleUpdateTemplate}
        isLoading={isUpdating}
      />

      {/* Delete Confirmation */}
      <ConfirmActionDialog
        open={!!deletingTemplate}
        onOpenChange={() => setDeletingTemplate(null)}
        title={t('checklists.deleteTitle')}
        description={t('confirm.deleteTemplate', { name: deletingTemplate?.name ?? '' })}
        onConfirm={handleDeleteTemplate}
        variant="destructive"
      />
    </div>
  );
}
