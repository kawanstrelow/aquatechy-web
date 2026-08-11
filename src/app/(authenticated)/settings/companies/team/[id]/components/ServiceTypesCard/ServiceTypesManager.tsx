'use client';

import { useState } from 'react';
import { useIsMutating } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Settings } from 'lucide-react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useGetServiceTypes } from '@/hooks/react-query/service-types/useGetServiceTypes';
import { useCreateServiceType } from '@/hooks/react-query/service-types/useCreateServiceType';
import { useUpdateServiceType } from '@/hooks/react-query/service-types/useUpdateServiceType';
import { useDeleteServiceType } from '@/hooks/react-query/service-types/useDeleteServiceType';
import { useGetChecklistTemplates } from '@/hooks/react-query/checklist-templates/useGetChecklistTemplates';
import { useGetReadingGroups } from '@/hooks/react-query/reading-groups/useGetReadingGroups';
import { useGetConsumableGroups } from '@/hooks/react-query/consumable-groups/useGetConsumableGroups';
import { useGetPhotoGroups } from '@/hooks/react-query/photo-groups/useGetPhotoGroups';
import { useLinkReadingGroup } from '@/hooks/react-query/service-types/useLinkReadingGroup';
import { useUnlinkReadingGroup } from '@/hooks/react-query/service-types/useUnlinkReadingGroup';
import { useLinkConsumableGroup } from '@/hooks/react-query/service-types/useLinkConsumableGroup';
import { useUnlinkConsumableGroup } from '@/hooks/react-query/service-types/useUnlinkConsumableGroup';
import { useLinkPhotoGroup } from '@/hooks/react-query/service-types/useLinkPhotoGroup';
import { useUnlinkPhotoGroup } from '@/hooks/react-query/service-types/useUnlinkPhotoGroup';
import { useGetSelectorGroups } from '@/hooks/react-query/selector-groups/useGetSelectorGroups';
import { useLinkSelectorGroup } from '@/hooks/react-query/service-types/useLinkSelectorGroup';
import { useUnlinkSelectorGroup } from '@/hooks/react-query/service-types/useUnlinkSelectorGroup';

import { ServiceType, CreateServiceTypeRequest, UpdateServiceTypeRequest } from '@/ts/interfaces/ServiceTypes';

import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { EditServiceTypeDialog } from './EditServiceTypeDialog';
import { CreateServiceTypeDialog } from './CreateServiceTypeDialog';

interface ServiceTypesManagerProps {
  companyId: string;
}

export function ServiceTypesManager({ companyId }: ServiceTypesManagerProps) {
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null);
  const [deletingServiceType, setDeletingServiceType] = useState<ServiceType | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: serviceTypesData, isLoading } = useGetServiceTypes(companyId);
  const { data: checklistTemplatesData } = useGetChecklistTemplates({ companyId });
  const { data: readingGroupsData } = useGetReadingGroups(companyId);
  const { data: consumableGroupsData } = useGetConsumableGroups(companyId);
  const { data: photoGroupsData } = useGetPhotoGroups(companyId);
  const { data: selectorGroupsData } = useGetSelectorGroups(companyId);
  const { mutate: createServiceType, isPending: isCreating } = useCreateServiceType(companyId);
  const { mutate: updateServiceType, isPending: isUpdating } = useUpdateServiceType(companyId);
  const { mutate: deleteServiceType, isPending: isDeleting } = useDeleteServiceType(companyId);
  const { mutate: linkReadingGroup } = useLinkReadingGroup();
  const { mutate: unlinkReadingGroup } = useUnlinkReadingGroup();
  const { mutate: linkConsumableGroup } = useLinkConsumableGroup();
  const { mutate: unlinkConsumableGroup } = useUnlinkConsumableGroup();
  const { mutate: linkPhotoGroup } = useLinkPhotoGroup();
  const { mutate: unlinkPhotoGroup } = useUnlinkPhotoGroup();
  const { mutate: linkSelectorGroup } = useLinkSelectorGroup();
  const { mutate: unlinkSelectorGroup } = useUnlinkSelectorGroup();

  const isLinkingGroups =
    useIsMutating({ mutationKey: ['service-type-groups'] }) > 0;

  const serviceTypes = serviceTypesData?.serviceTypes || [];
  const checklistTemplates = checklistTemplatesData?.templates || [];
  const readingGroups = readingGroupsData?.readingGroups || [];
  const consumableGroups = consumableGroupsData?.consumableGroups || [];
  const photoGroups = photoGroupsData?.photoGroups || [];
  const selectorGroups = selectorGroupsData?.selectorGroups || [];

  // Helper function to get checklist template name by ID
  const getChecklistTemplateName = (serviceType: ServiceType) => {
    const templateId = serviceType.checklistTemplateId || serviceType.defaultChecklistId;
    if (!templateId) return 'No template';
    const template = checklistTemplates.find(t => t.id === templateId);
    return template?.name || 'Unknown template';
  };

  const handleCreateServiceType = (data: CreateServiceTypeRequest) => {
    createServiceType(data, {
      onSuccess: () => {
        setShowCreateDialog(false);
      }
    });
  };

  const handleUpdateServiceType = (data: UpdateServiceTypeRequest) => {
    if (editingServiceType) {
      updateServiceType({ serviceTypeId: editingServiceType.id, data }, {
        onSuccess: () => {
          setEditingServiceType(null);
        }
      });
    }
  };

  const handleDeleteServiceType = async () => {
    if (deletingServiceType) {
      deleteServiceType(deletingServiceType.id, {
        onSuccess: () => {
          setDeletingServiceType(null);
        }
      });
    }
  };

  const canDeleteServiceType = (serviceType: ServiceType) => {
    return !serviceType.isDefault;
  };

  const handleLinkReadingGroup = (serviceTypeId: string, readingGroupId: string, order: number) => {
    linkReadingGroup({ serviceTypeId, data: { readingGroupId, order } });
  };

  const handleUnlinkReadingGroup = (serviceTypeId: string, readingGroupId: string) => {
    unlinkReadingGroup({ serviceTypeId, readingGroupId });
  };

  const handleLinkConsumableGroup = (serviceTypeId: string, consumableGroupId: string, order: number) => {
    linkConsumableGroup({ serviceTypeId, data: { consumableGroupId, order } });
  };

  const handleUnlinkConsumableGroup = (serviceTypeId: string, consumableGroupId: string) => {
    unlinkConsumableGroup({ serviceTypeId, consumableGroupId });
  };

  const handleLinkPhotoGroup = (serviceTypeId: string, photoGroupId: string, order: number) => {
    linkPhotoGroup({ serviceTypeId, data: { photoGroupId, order } });
  };

  const handleUnlinkPhotoGroup = (serviceTypeId: string, photoGroupId: string) => {
    unlinkPhotoGroup({ serviceTypeId, photoGroupId });
  };

  const handleLinkSelectorGroup = (serviceTypeId: string, selectorGroupId: string, order: number) => {
    linkSelectorGroup({ serviceTypeId, data: { selectorGroupId, order } });
  };

  const handleUnlinkSelectorGroup = (serviceTypeId: string, selectorGroupId: string) => {
    unlinkSelectorGroup({ serviceTypeId, selectorGroupId });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h3 className="text-lg font-semibold">Service Types</h3>
          <p className="text-sm text-muted-foreground">
            Manage service types that can be selected when creating service reports
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} disabled={isCreating}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service Type
        </Button>
      </div>

      {serviceTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-muted-foreground mb-2">No service types</div>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Create service types to categorize your services (e.g., Pool Cleaning, Maintenance, etc.).
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Service Type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceTypes.map((serviceType) => (
                <TableRow key={serviceType.id}>
                  <TableCell>
                    <div className="font-medium">{serviceType.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {serviceType.description || 'No description'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingServiceType(serviceType)}
                      disabled={isUpdating}
                      className="h-8 w-8 p-0"
                      title="Configure Service Type"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Dialog */}
      <CreateServiceTypeDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateServiceType}
        isLoading={isCreating}
        checklistTemplates={checklistTemplates}
        readingGroups={readingGroups}
        consumableGroups={consumableGroups}
        photoGroups={photoGroups}
        selectorGroups={selectorGroups}
      />

      {/* Edit Dialog */}
      <EditServiceTypeDialog
        open={!!editingServiceType}
        onOpenChange={() => setEditingServiceType(null)}
        serviceType={editingServiceType}
        companyId={companyId}
        onSubmit={handleUpdateServiceType}
        isLoading={isUpdating}
        isLinkingGroups={isLinkingGroups}
        checklistTemplates={checklistTemplates}
        readingGroups={readingGroups}
        consumableGroups={consumableGroups}
        photoGroups={photoGroups}
        selectorGroups={selectorGroups}
        onLinkReadingGroup={handleLinkReadingGroup}
        onUnlinkReadingGroup={handleUnlinkReadingGroup}
        onLinkConsumableGroup={handleLinkConsumableGroup}
        onUnlinkConsumableGroup={handleUnlinkConsumableGroup}
        onLinkPhotoGroup={handleLinkPhotoGroup}
        onUnlinkPhotoGroup={handleUnlinkPhotoGroup}
        onLinkSelectorGroup={handleLinkSelectorGroup}
        onUnlinkSelectorGroup={handleUnlinkSelectorGroup}
      />


      {/* Delete Confirmation */}
      <ConfirmActionDialog
        open={!!deletingServiceType}
        onOpenChange={() => setDeletingServiceType(null)}
        title="Delete Service Type"
        description={`Are you sure you want to delete "${deletingServiceType?.name}"? This action cannot be undone and may affect existing services.`}
        onConfirm={handleDeleteServiceType}
        variant="destructive"
      />
    </div>
  );
}
