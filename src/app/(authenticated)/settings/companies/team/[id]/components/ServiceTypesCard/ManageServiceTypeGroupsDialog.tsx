'use client';

import { useTranslations } from 'next-intl';

import { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus } from 'lucide-react';

import { ServiceType } from '@/ts/interfaces/ServiceTypes';
import { ReadingGroup } from '@/ts/interfaces/ReadingGroups';
import { ConsumableGroup } from '@/ts/interfaces/ConsumableGroups';

interface ManageServiceTypeGroupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceType: ServiceType | null;
  availableReadingGroups: ReadingGroup[];
  availableConsumableGroups: ConsumableGroup[];
  onLinkReadingGroup: (serviceTypeId: string, readingGroupId: string, order: number) => void;
  onUnlinkReadingGroup: (serviceTypeId: string, readingGroupId: string) => void;
  onLinkConsumableGroup: (serviceTypeId: string, consumableGroupId: string, order: number) => void;
  onUnlinkConsumableGroup: (serviceTypeId: string, consumableGroupId: string) => void;
}

export function ManageServiceTypeGroupsDialog({
  open,
  onOpenChange,
  serviceType,
  availableReadingGroups,
  availableConsumableGroups,
  onLinkReadingGroup,
  onUnlinkReadingGroup,
  onLinkConsumableGroup,
  onUnlinkConsumableGroup
}: ManageServiceTypeGroupsDialogProps) {
  const t = useTranslations('settings');

  const [selectedReadingGroup, setSelectedReadingGroup] = useState<string>('');
  const [selectedConsumableGroup, setSelectedConsumableGroup] = useState<string>('');

  if (!serviceType) {
    return null;
  }

  const handleClose = () => {
    setSelectedReadingGroup('');
    setSelectedConsumableGroup('');
    onOpenChange(false);
  };

  const handleLinkReadingGroup = () => {
    if (selectedReadingGroup) {
      const order = (serviceType.readingGroups?.length || 0) + 1;
      onLinkReadingGroup(serviceType.id, selectedReadingGroup, order);
      setSelectedReadingGroup('');
    }
  };

  const handleLinkConsumableGroup = () => {
    if (selectedConsumableGroup) {
      const order = (serviceType.consumableGroups?.length || 0) + 1;
      onLinkConsumableGroup(serviceType.id, selectedConsumableGroup, order);
      setSelectedConsumableGroup('');
    }
  };

  // Get available groups (not already linked)
  const linkedReadingGroupIds = serviceType.readingGroups?.map((g) => g.id) || [];
  const linkedConsumableGroupIds = serviceType.consumableGroups?.map((g) => g.id) || [];

  const availableReadingGroupsToLink = availableReadingGroups.filter(
    (group) => !linkedReadingGroupIds.includes(group.id)
  );
  const availableConsumableGroupsToLink = availableConsumableGroups.filter(
    (group) => !linkedConsumableGroupIds.includes(group.id)
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('serviceTypes.manageGroups', { name: serviceType.name })}</DialogTitle>
          <DialogDescription>
            Link reading groups and consumable groups to this service type. These groups will be available when creating
            services of this type.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reading Groups Section */}
          <div>
            <h3 className="mb-3 text-lg font-medium">{t('readings.groupsTitle')}</h3>

            {/* Linked Reading Groups */}
            <div className="mb-4 space-y-2">
              {serviceType.readingGroups && serviceType.readingGroups.length > 0 ? (
                serviceType.readingGroups.map((group, index) => (
                  <div key={group.id} className="bg-muted flex items-center justify-between rounded-lg p-3">
                    <div>
                      <div className="font-medium">{group.name}</div>
                      <div className="text-muted-foreground text-sm">
                        {group.description || t('fields.noDescription')}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {group.readingDefinitions?.length || 0} definitions
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUnlinkReadingGroup(serviceType.id, group.id)}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground bg-muted rounded-lg p-3 text-sm">
                  {t('serviceTypes.noReadingLinked')}
                </div>
              )}
            </div>

            {/* Add Reading Group */}
            {availableReadingGroupsToLink.length > 0 && (
              <div className="flex gap-2">
                <Select value={selectedReadingGroup} onValueChange={setSelectedReadingGroup}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t('serviceTypes.selectReadingToLink')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableReadingGroupsToLink.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} {group.isDefault && '(Default)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleLinkReadingGroup} disabled={!selectedReadingGroup} size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Link
                </Button>
              </div>
            )}
          </div>

          {/* Consumable Groups Section */}
          <div>
            <h3 className="mb-3 text-lg font-medium">{t('consumables.groupsTitle')}</h3>

            {/* Linked Consumable Groups */}
            <div className="mb-4 space-y-2">
              {serviceType.consumableGroups && serviceType.consumableGroups.length > 0 ? (
                serviceType.consumableGroups.map((group, index) => (
                  <div key={group.id} className="bg-muted flex items-center justify-between rounded-lg p-3">
                    <div>
                      <div className="font-medium">{group.name}</div>
                      <div className="text-muted-foreground text-sm">
                        {group.description || t('fields.noDescription')}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {group.consumableDefinitions?.length || 0} definitions
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUnlinkConsumableGroup(serviceType.id, group.id)}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground bg-muted rounded-lg p-3 text-sm">
                  {t('serviceTypes.noConsumableLinked')}
                </div>
              )}
            </div>

            {/* Add Consumable Group */}
            {availableConsumableGroupsToLink.length > 0 && (
              <div className="flex gap-2">
                <Select value={selectedConsumableGroup} onValueChange={setSelectedConsumableGroup}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t('serviceTypes.selectConsumableToLink')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableConsumableGroupsToLink.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} {group.isDefault && '(Default)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleLinkConsumableGroup} disabled={!selectedConsumableGroup} size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Link
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('actions.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
