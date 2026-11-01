'use client';

import { useTranslations } from 'next-intl';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Settings, Trash2 } from 'lucide-react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useGetSelectorGroups } from '@/hooks/react-query/selector-groups/useGetSelectorGroups';
import { useCreateSelectorGroup } from '@/hooks/react-query/selector-groups/useCreateSelectorGroup';
import { useDeleteSelectorGroup } from '@/hooks/react-query/selector-groups/useDeleteSelectorGroup';

import { SelectorGroup, CreateSelectorGroupRequest } from '@/ts/interfaces/SelectorGroups';

import { CreateSelectorGroupDialog } from './CreateSelectorGroupDialog';
import { ComprehensiveSelectorGroupManager } from './ComprehensiveSelectorGroupManager';
import ConfirmActionDialog from '@/components/confirm-action-dialog';

interface SelectorGroupsManagerProps {
  companyId: string;
}

export function SelectorGroupsManager({ companyId }: SelectorGroupsManagerProps) {
  const t = useTranslations('settings');

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [managingDefinitionsForGroup, setManagingDefinitionsForGroup] = useState<SelectorGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<SelectorGroup | null>(null);

  const { data: selectorGroupsData, isLoading } = useGetSelectorGroups(companyId);
  const { mutate: createSelectorGroup, isPending: isCreating } = useCreateSelectorGroup();
  const { mutate: deleteSelectorGroup, isPending: isDeleting } = useDeleteSelectorGroup();

  const selectorGroups = selectorGroupsData?.selectorGroups || [];

  const handleCreateSelectorGroup = (data: CreateSelectorGroupRequest) => {
    createSelectorGroup(
      { companyId, data },
      {
        onSuccess: () => {
          setShowCreateDialog(false);
        }
      }
    );
  };

  const handleDeleteGroup = async () => {
    if (deletingGroup) {
      deleteSelectorGroup(
        {
          selectorGroupId: deletingGroup.id,
          companyId
        },
        {
          onSuccess: () => {
            setDeletingGroup(null);
          }
        }
      );
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('selectors.groupsTitle')}</h3>
          <p className="text-muted-foreground text-sm">{t('selectors.manageHint')}</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} disabled={isCreating}>
          <Plus className="mr-2 h-4 w-4" />
          {t('selectors.addGroup')}
        </Button>
      </div>

      {selectorGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-muted-foreground mb-2">{t('selectors.noGroups')}</div>
            <p className="text-muted-foreground mb-4 text-center text-sm">
              Create selector groups to define questions with multiple choice answers for your services (e.g., "Basic
              Questions", "Equipment Status", etc.).
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('selectors.createFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('fields.name')}</TableHead>
                <TableHead>{t('fields.description')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('fields.questions')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('companies.status')}</TableHead>
                <TableHead className="text-right">{t('fields.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectorGroups.map((selectorGroup) => (
                <TableRow key={selectorGroup.id}>
                  <TableCell>
                    <div className="font-medium">{selectorGroup.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-muted-foreground text-sm">
                      {selectorGroup.description || t('fields.noDescription')}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-muted-foreground text-sm">
                      {selectorGroup.selectorDefinitions?.length || 0} questions
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={selectorGroup.isActive ? 'default' : 'outline'} className="text-xs">
                      {selectorGroup.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setManagingDefinitionsForGroup(selectorGroup)}
                        className="h-8 w-8 p-0"
                        title={t('selectors.manageGroup')}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingGroup(selectorGroup)}
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                        title={t('selectors.deleteGroup')}
                        disabled={selectorGroup.isDefault}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Dialog */}
      <CreateSelectorGroupDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateSelectorGroup}
        isLoading={isCreating}
      />

      {/* Comprehensive Manager Dialog */}
      <ComprehensiveSelectorGroupManager
        open={!!managingDefinitionsForGroup}
        onOpenChange={() => setManagingDefinitionsForGroup(null)}
        selectorGroup={managingDefinitionsForGroup}
        companyId={companyId}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmActionDialog
        open={!!deletingGroup}
        onOpenChange={() => setDeletingGroup(null)}
        title={t('selectors.deleteGroup')}
        description={t('confirm.deleteWithChildren', { name: deletingGroup?.name ?? '' })}
        onConfirm={handleDeleteGroup}
      />
    </div>
  );
}
