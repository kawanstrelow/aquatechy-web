'use client';

import { useTranslations } from 'next-intl';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useGetPhotoGroups } from '@/hooks/react-query/photo-groups/useGetPhotoGroups';
import { useCreatePhotoGroup } from '@/hooks/react-query/photo-groups/useCreatePhotoGroup';
import { useUpdatePhotoGroup } from '@/hooks/react-query/photo-groups/useUpdatePhotoGroup';
import { useDeletePhotoGroup } from '@/hooks/react-query/photo-groups/useDeletePhotoGroup';

import { PhotoGroup, CreatePhotoGroupRequest, UpdatePhotoGroupRequest } from '@/ts/interfaces/PhotoGroups';

import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { CreatePhotoGroupDialog } from './CreatePhotoGroupDialog';
import { EditPhotoGroupDialog } from './EditPhotoGroupDialog';
import { PhotoDefinitionsManager } from './PhotoDefinitionsManager';

interface PhotoGroupsManagerProps {
  companyId: string;
}

export function PhotoGroupsManager({ companyId }: PhotoGroupsManagerProps) {
  const t = useTranslations('settings');

  const [editingPhotoGroup, setEditingPhotoGroup] = useState<PhotoGroup | null>(null);
  const [deletingPhotoGroup, setDeletingPhotoGroup] = useState<PhotoGroup | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { data: photoGroupsData, isLoading } = useGetPhotoGroups(companyId);
  const { mutate: createPhotoGroup, isPending: isCreating } = useCreatePhotoGroup();
  const { mutate: updatePhotoGroup, isPending: isUpdating } = useUpdatePhotoGroup();
  const { mutate: deletePhotoGroup, isPending: isDeleting } = useDeletePhotoGroup();

  const photoGroups = photoGroupsData?.photoGroups || [];

  const handleCreatePhotoGroup = (data: CreatePhotoGroupRequest) => {
    createPhotoGroup(
      { companyId, data },
      {
        onSuccess: () => {
          setShowCreateDialog(false);
        }
      }
    );
  };

  const handleUpdatePhotoGroup = (data: UpdatePhotoGroupRequest) => {
    if (editingPhotoGroup) {
      updatePhotoGroup(
        { photoGroupId: editingPhotoGroup.id, data },
        {
          onSuccess: () => {
            setEditingPhotoGroup(null);
          }
        }
      );
    }
  };

  const handleDeletePhotoGroup = async () => {
    if (deletingPhotoGroup) {
      deletePhotoGroup(deletingPhotoGroup.id, {
        onSuccess: () => {
          setDeletingPhotoGroup(null);
        }
      });
    }
  };

  const canDeletePhotoGroup = (photoGroup: PhotoGroup) => {
    return !photoGroup.isDefault;
  };

  const toggleGroupExpansion = (photoGroupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(photoGroupId)) {
        newSet.delete(photoGroupId);
      } else {
        newSet.add(photoGroupId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('photos.groupsTitle')}</h3>
          <p className="text-muted-foreground text-sm">
            Manage photo groups that can be used for service documentation
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} disabled={isCreating}>
          <Plus className="mr-2 h-4 w-4" />
          {t('photos.addGroup')}
        </Button>
      </div>

      {photoGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-muted-foreground mb-2">{t('photos.noGroups')}</div>
            <p className="text-muted-foreground mb-4 text-center text-sm">
              Create photo groups to define photo requirements for your services (e.g., "Before Photos", "Equipment
              Photos", etc.).
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('photos.createFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {photoGroups.map((photoGroup) => (
            <Card key={photoGroup.id}>
              <CardHeader className="pb-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Mobile: Single row with arrow, text, and action buttons - centered */}
                  <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroupExpansion(photoGroup.id)}
                      className="h-8 w-8 flex-shrink-0 p-0"
                    >
                      {expandedGroups.has(photoGroup.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    <div className="min-w-0 flex-1">
                      <CardTitle className="flex items-center justify-start gap-2 text-base">
                        {photoGroup.name}
                        {photoGroup.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </CardTitle>
                      {photoGroup.description && (
                        <CardDescription className="text-sm">{photoGroup.description}</CardDescription>
                      )}
                    </div>

                    {/* Action buttons - positioned on the right */}
                    <div className="flex flex-shrink-0 gap-2">
                      <Badge variant={photoGroup.isActive ? 'default' : 'outline'} className="text-xs">
                        {photoGroup.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPhotoGroup(photoGroup)}
                        disabled={isUpdating}
                        className="h-8 w-8 p-0"
                        title={t('photos.editGroup')}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {canDeletePhotoGroup(photoGroup) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingPhotoGroup(photoGroup)}
                          disabled={isDeleting}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          title={t('photos.deleteGroup')}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              {expandedGroups.has(photoGroup.id) && (
                <CardContent>
                  <PhotoDefinitionsManager photoGroup={photoGroup} companyId={companyId} />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreatePhotoGroupDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreatePhotoGroup}
        isLoading={isCreating}
      />

      {/* Edit Dialog */}
      <EditPhotoGroupDialog
        open={!!editingPhotoGroup}
        onOpenChange={() => setEditingPhotoGroup(null)}
        photoGroup={editingPhotoGroup}
        onSubmit={handleUpdatePhotoGroup}
        isLoading={isUpdating}
      />

      {/* Delete Confirmation */}
      <ConfirmActionDialog
        open={!!deletingPhotoGroup}
        onOpenChange={() => setDeletingPhotoGroup(null)}
        title={t('photos.deleteGroup')}
        description={t('confirm.deleteAffectsServices', { name: deletingPhotoGroup?.name ?? '' })}
        onConfirm={handleDeletePhotoGroup}
        variant="destructive"
      />
    </div>
  );
}
