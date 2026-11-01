'use client';

import { useTranslations } from 'next-intl';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Package } from 'lucide-react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useGetConsumableGroups } from '@/hooks/react-query/consumable-groups/useGetConsumableGroups';
import { useCreateConsumableGroup } from '@/hooks/react-query/consumable-groups/useCreateConsumableGroup';
import { useUpdateConsumableGroup } from '@/hooks/react-query/consumable-groups/useUpdateConsumableGroup';
import { useDeleteConsumableGroup } from '@/hooks/react-query/consumable-groups/useDeleteConsumableGroup';

import {
  ConsumableGroup,
  CreateConsumableGroupRequest,
  UpdateConsumableGroupRequest
} from '@/ts/interfaces/ConsumableGroups';
import { ConsumableDefinitionsManager } from './ConsumableDefinitionsManager';
import { CreateConsumableGroupDialog } from './CreateConsumableGroupDialog';
import { EditConsumableGroupDialog } from './EditConsumableGroupDialog';
import ConfirmActionDialog from '@/components/confirm-action-dialog';

interface ConsumableGroupsManagerProps {
  companyId: string;
}

export function ConsumableGroupsManager({ companyId }: ConsumableGroupsManagerProps) {
  const t = useTranslations('settings');

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ConsumableGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<ConsumableGroup | null>(null);

  const { data: consumableGroupsData, isLoading } = useGetConsumableGroups(companyId);
  const { mutate: createConsumableGroup, isPending: isCreating } = useCreateConsumableGroup(companyId);
  const { mutate: updateConsumableGroup, isPending: isUpdating } = useUpdateConsumableGroup(companyId);
  const { mutate: deleteConsumableGroup, isPending: isDeleting } = useDeleteConsumableGroup(companyId);

  const consumableGroups = consumableGroupsData?.consumableGroups || [];

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

  const handleCreateGroup = (data: CreateConsumableGroupRequest) => {
    createConsumableGroup(data, {
      onSuccess: () => {
        setShowCreateDialog(false);
      }
    });
  };

  const handleUpdateGroup = (data: UpdateConsumableGroupRequest) => {
    if (editingGroup) {
      updateConsumableGroup(
        { consumableGroupId: editingGroup.id, data },
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
      deleteConsumableGroup(deletingGroup.id, {
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('consumables.groupsTitle')}</h3>
          <p className="text-muted-foreground text-sm">
            Manage consumable groups and their definitions for service reports
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} disabled={isCreating}>
          <Plus className="mr-2 h-4 w-4" />
          {t('readings.addGroup')}
        </Button>
      </div>

      {consumableGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Package className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">{t('consumables.noGroups')}</h3>
            <p className="text-muted-foreground mb-4 text-center text-sm">{t('consumables.emptyHint')}</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('consumables.createGroup')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {consumableGroups.map((group) => (
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingGroup(group)}
                        disabled={isDeleting}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {expandedGroups.has(group.id) && (
                <CardContent>
                  <ConsumableDefinitionsManager consumableGroup={group} companyId={companyId} />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateConsumableGroupDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateGroup}
        isLoading={isCreating}
      />

      {/* Edit Dialog */}
      <EditConsumableGroupDialog
        open={!!editingGroup}
        onOpenChange={() => setEditingGroup(null)}
        consumableGroup={editingGroup}
        onSubmit={handleUpdateGroup}
        isLoading={isUpdating}
      />

      {/* Delete Confirmation */}
      <ConfirmActionDialog
        open={!!deletingGroup}
        onOpenChange={() => setDeletingGroup(null)}
        title={t('consumables.deleteGroup')}
        description={t('confirm.deleteWithChildren', { name: deletingGroup?.name ?? '' })}
        onConfirm={handleDeleteGroup}
        variant="destructive"
      />
    </div>
  );
}
