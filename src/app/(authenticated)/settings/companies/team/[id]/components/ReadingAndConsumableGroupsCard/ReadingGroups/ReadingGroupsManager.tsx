'use client';

import { useTranslations } from 'next-intl';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, TestTube } from 'lucide-react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useGetReadingGroups } from '@/hooks/react-query/reading-groups/useGetReadingGroups';
import { useCreateReadingGroup } from '@/hooks/react-query/reading-groups/useCreateReadingGroup';
import { useBatchUpdateReadingGroup } from '@/hooks/react-query/reading-groups/useBatchUpdateReadingGroup';
import { useDeleteReadingGroup } from '@/hooks/react-query/reading-groups/useDeleteReadingGroup';

import { ReadingGroup, CreateReadingGroupRequest, UpdateReadingGroupRequest } from '@/ts/interfaces/ReadingGroups';
import { ReadingDefinitionsManager } from './ReadingDefinitionsManager';
import { CreateReadingGroupDialog } from './CreateReadingGroupDialog';
import { EditReadingGroupDialog } from './EditReadingGroupDialog';
import ConfirmActionDialog from '@/components/confirm-action-dialog';

interface ReadingGroupsManagerProps {
  companyId: string;
}

export function ReadingGroupsManager({ companyId }: ReadingGroupsManagerProps) {
  const t = useTranslations('settings');

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ReadingGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<ReadingGroup | null>(null);

  const { data: readingGroupsData, isLoading } = useGetReadingGroups(companyId);
  const { mutate: createReadingGroup, isPending: isCreating } = useCreateReadingGroup(companyId);
  const { mutate: updateReadingGroup, isPending: isUpdating } = useBatchUpdateReadingGroup(companyId);
  const { mutate: deleteReadingGroup, isPending: isDeleting } = useDeleteReadingGroup(companyId);

  const readingGroups = readingGroupsData?.readingGroups || [];

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleCreateGroup = (data: CreateReadingGroupRequest) => {
    createReadingGroup(data, {
      onSuccess: () => {
        setShowCreateDialog(false);
      }
    });
  };

  const handleUpdateGroup = (data: UpdateReadingGroupRequest) => {
    if (editingGroup) {
      updateReadingGroup(
        {
          readingGroupId: editingGroup.id,
          data: {
            name: data.name,
            description: data.description,
            isActive: data.isActive
          }
        },
        {
          onSuccess: () => {
            setEditingGroup(null);
          }
        }
      );
    }
  };

  const handleDeleteGroup = async () => {
    if (deletingGroup) {
      deleteReadingGroup(deletingGroup.id, {
        onSuccess: () => {
          setDeletingGroup(null);
        }
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('readings.groupsTitle')}</h3>
          <p className="text-muted-foreground text-sm">
            Manage reading groups and their definitions for service reports
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} disabled={isCreating} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t('readings.addGroup')}
        </Button>
      </div>

      {readingGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <TestTube className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">{t('readings.noGroups')}</h3>
            <p className="text-muted-foreground mb-4 text-center text-sm">{t('readings.emptyHint')}</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('readings.createGroup')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {readingGroups.map((group) => (
            <Card key={group.id}>
              <CardHeader className="pb-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Mobile: Single row with arrow, text, and action buttons - centered */}
                  <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroupExpansion(group.id)}
                      className="h-8 w-8 flex-shrink-0 p-0"
                    >
                      {expandedGroups.has(group.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    <div className="min-w-0 flex-1">
                      <CardTitle className="flex items-center justify-start gap-2 text-base">
                        {group.name}
                        {!group.isActive && (
                          <Badge variant="outline" className="text-xs">
                            {t('statuses.Inactive')}
                          </Badge>
                        )}
                      </CardTitle>
                      {group.description && <CardDescription className="text-sm">{group.description}</CardDescription>}
                    </div>

                    {/* Action buttons - positioned on the right */}
                    <div className="flex flex-shrink-0 gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingGroup(group)} disabled={isUpdating}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!group.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingGroup(group)}
                          disabled={isDeleting}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              {expandedGroups.has(group.id) && (
                <CardContent>
                  <ReadingDefinitionsManager readingGroup={group} companyId={companyId} />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateReadingGroupDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateGroup}
        isLoading={isCreating}
      />

      {/* Edit Dialog */}
      <EditReadingGroupDialog
        open={!!editingGroup}
        onOpenChange={() => setEditingGroup(null)}
        readingGroup={editingGroup}
        onSubmit={handleUpdateGroup}
        isLoading={isUpdating}
      />

      {/* Delete Confirmation */}
      <ConfirmActionDialog
        open={!!deletingGroup}
        onOpenChange={() => setDeletingGroup(null)}
        title={t('readings.deleteGroup')}
        description={t('confirm.deleteWithChildren', { name: deletingGroup?.name ?? '' })}
        onConfirm={handleDeleteGroup}
        variant="destructive"
      />
    </div>
  );
}
