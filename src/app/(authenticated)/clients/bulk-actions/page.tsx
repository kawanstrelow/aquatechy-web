'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/Typography';
import { ArrowLeftIcon, SaveIcon, SearchIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import useGetAllClients from '@/hooks/react-query/clients/getAllClients';
import { useUpdateBulkPreferences, BulkPreferenceUpdate } from '@/hooks/react-query/clients/updateBulkPreferences';
import { Client } from '@/ts/interfaces/Client';
import { useToast } from '@/components/ui/use-toast';

export default function BulkActionsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());

  // Get real client data
  const { data: allClients = [], isLoading } = useGetAllClients();

  // Hook for updating bulk preferences
  const { mutate: updateBulkPreferences, isPending: isUpdating } = useUpdateBulkPreferences();

  // Toast hook
  const { toast } = useToast();

  // Initialize clients when data is loaded
  useEffect(() => {
    if (allClients && allClients.length > 0) {
      setClients(allClients);
    }
  }, [allClients]);

  const filteredClients = clients.filter(client =>
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${client.address}, ${client.city}, ${client.state} ${client.zip}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(new Set(filteredClients.map(client => client.id)));
    } else {
      setSelectedClients(new Set());
    }
  };

  const handleSelectClient = (clientId: string, checked: boolean) => {
    const newSelected = new Set(selectedClients);
    if (checked) {
      newSelected.add(clientId);
    } else {
      newSelected.delete(clientId);
    }
    setSelectedClients(newSelected);
  };

  const handlePreferenceChange = (clientId: string, preference: string, value: boolean) => {
    setClients(prev => prev.map(client =>
      client.id === clientId
        ? {
            ...client,
            preferences: {
              ...client.preferences,
              serviceEmailPreferences: {
                ...client.preferences?.serviceEmailPreferences,
                [preference]: value
              }
            } as Client['preferences']
          }
        : client
    ));
  };

  const handleSaveChanges = () => {
    // Prepare data for the API call
    const clientsToUpdate = Array.from(selectedClients).map(clientId => {
      const client = clients.find(c => c.id === clientId);
      if (!client) return null;

      // Only include preferences that have been modified
      const originalClient = allClients.find(c => c.id === clientId);
      const modifiedPreferences: any = {};

      if (client.preferences?.serviceEmailPreferences) {
        const originalPrefs = originalClient?.preferences?.serviceEmailPreferences;
        const currentPrefs = client.preferences.serviceEmailPreferences;

        // Check each preference and only include if it's different from original
        if (originalPrefs?.sendEmails !== currentPrefs.sendEmails) {
          modifiedPreferences.sendEmails = currentPrefs.sendEmails;
        }
        if (originalPrefs?.sendSMS !== currentPrefs.sendSMS) {
          modifiedPreferences.sendSMS = currentPrefs.sendSMS;
        }
        // if (originalPrefs?.attachChemicalsReadings !== currentPrefs.attachChemicalsReadings) {
        //   modifiedPreferences.attachChemicalsReadings = currentPrefs.attachChemicalsReadings;
        // }
        // if (originalPrefs?.attachChecklist !== currentPrefs.attachChecklist) {
        //   modifiedPreferences.attachChecklist = currentPrefs.attachChecklist;
        // }
        // if (originalPrefs?.attachServicePhotos !== currentPrefs.attachServicePhotos) {
        //   modifiedPreferences.attachServicePhotos = currentPrefs.attachServicePhotos;
        // }
        if (originalPrefs?.sendFilterCleaningEmails !== currentPrefs.sendFilterCleaningEmails) {
          modifiedPreferences.sendFilterCleaningEmails = currentPrefs.sendFilterCleaningEmails;
        }
        if (originalPrefs?.attachReadingsGroups !== currentPrefs.attachReadingsGroups) {
          modifiedPreferences.attachReadingsGroups = currentPrefs.attachReadingsGroups;
        }
        if (originalPrefs?.attachConsumablesGroups !== currentPrefs.attachConsumablesGroups) {
          modifiedPreferences.attachConsumablesGroups = currentPrefs.attachConsumablesGroups;
        }
        if (originalPrefs?.attachPhotoGroups !== currentPrefs.attachPhotoGroups) {
          modifiedPreferences.attachPhotoGroups = currentPrefs.attachPhotoGroups;
        }
        if (originalPrefs?.attachSelectorsGroups !== currentPrefs.attachSelectorsGroups) {
          modifiedPreferences.attachSelectorsGroups = currentPrefs.attachSelectorsGroups;
        }
        if (originalPrefs?.attachCustomChecklist !== currentPrefs.attachCustomChecklist) {
          modifiedPreferences.attachCustomChecklist = currentPrefs.attachCustomChecklist;
        }
      }

      return {
        clientId: client.id,
        serviceEmailPreferences: modifiedPreferences
      };
    }).filter(Boolean);

    if (clientsToUpdate.length === 0) {
      toast({
        duration: 3000,
        title: 'No changes to save',
        variant: 'default'
      });
      return;
    }

    // Call the API
    updateBulkPreferences({ clients: clientsToUpdate as BulkPreferenceUpdate[] });

    // Clear selection after successful update
    setSelectedClients(new Set());
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <Typography element="h1" className="text-2xl font-semibold">
          Bulk Actions - Client Preferences
        </Typography>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 max-w-md items-center gap-2">
          <SearchIcon className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search clients by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSelectedClients(new Set())}
            disabled={selectedClients.size === 0}
          >
            Clear Selection
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={selectedClients.size === 0 || isUpdating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUpdating ? (
              <>
                <LoadingSpinner />
                Saving...
              </>
            ) : (
              <>
                <SaveIcon className="mr-2 h-4 w-4" />
                Save Changes ({selectedClients.size})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedClients.size === filteredClients.length && filteredClients.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-center">Send Service E-mails</TableHead>
              <TableHead className="text-center">Send Service SMS</TableHead>
              {/* <TableHead className="text-center">Include Chemical Readings</TableHead>
              <TableHead className="text-center">Include Checklist</TableHead>
              <TableHead className="text-center">Include Service Photos</TableHead> */}
              <TableHead className="text-center">Include Readings</TableHead>
              <TableHead className="text-center">Include Consumables</TableHead>
              <TableHead className="text-center">Include Photos</TableHead>
              <TableHead className="text-center">Include Selectors</TableHead>
              <TableHead className="text-center">Include Checklist</TableHead>
              <TableHead className="text-center">Filter Cleaning Notifications</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedClients.has(client.id)}
                    onCheckedChange={(checked) => handleSelectClient(client.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {client.firstName} {client.lastName}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    {client.address} {client.addressLine2}, {client.city}, {client.state} {client.zip}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={client.preferences?.serviceEmailPreferences?.sendEmails || false}
                    onCheckedChange={(checked) => {
                      handlePreferenceChange(client.id, 'sendEmails', checked as boolean);
                      // Automatically select the row when preference changes
                      if (!selectedClients.has(client.id)) {
                        setSelectedClients(prev => new Set([...Array.from(prev), client.id]));
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={client.preferences?.serviceEmailPreferences?.sendSMS || false}
                    onCheckedChange={(checked) => {
                      handlePreferenceChange(client.id, 'sendSMS', checked as boolean);
                      // Automatically select the row when preference changes
                      if (!selectedClients.has(client.id)) {
                        setSelectedClients(prev => new Set([...Array.from(prev), client.id]));
                      }
                    }}
                  />
                </TableCell>
                {/* <TableCell className="text-center">
                  <Checkbox
                    checked={client.preferences?.serviceEmailPreferences?.attachChemicalsReadings || false}
                    onCheckedChange={(checked) => {
                      handlePreferenceChange(client.id, 'attachChemicalsReadings', checked as boolean);
                      // Automatically select the row when preference changes
                      if (!selectedClients.has(client.id)) {
                        setSelectedClients(prev => new Set([...Array.from(prev), client.id]));
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={client.preferences?.serviceEmailPreferences?.attachChecklist || false}
                    onCheckedChange={(checked) => {
                      handlePreferenceChange(client.id, 'attachChecklist', checked as boolean);
                      // Automatically select the row when preference changes
                      if (!selectedClients.has(client.id)) {
                        setSelectedClients(prev => new Set([...Array.from(prev), client.id]));
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={client.preferences?.serviceEmailPreferences?.attachServicePhotos || false}
                    onCheckedChange={(checked) => {
                      handlePreferenceChange(client.id, 'attachServicePhotos', checked as boolean);
                      // Automatically select the row when preference changes
                      if (!selectedClients.has(client.id)) {
                        setSelectedClients(prev => new Set([...Array.from(prev), client.id]));
                      }
                    }}
                  />
                </TableCell> */}
                <TableCell className="text-center">
                  <Checkbox
                    checked={client.preferences?.serviceEmailPreferences?.attachReadingsGroups || false}
                    onCheckedChange={(checked) => {
                      handlePreferenceChange(client.id, 'attachReadingsGroups', checked as boolean);
                      // Automatically select the row when preference changes
                      if (!selectedClients.has(client.id)) {
                        setSelectedClients(prev => new Set([...Array.from(prev), client.id]));
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={client.preferences?.serviceEmailPreferences?.attachConsumablesGroups || false}
                    onCheckedChange={(checked) => {
                      handlePreferenceChange(client.id, 'attachConsumablesGroups', checked as boolean);
                      // Automatically select the row when preference changes
                      if (!selectedClients.has(client.id)) {
                        setSelectedClients(prev => new Set([...Array.from(prev), client.id]));
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={client.preferences?.serviceEmailPreferences?.attachPhotoGroups || false}
                    onCheckedChange={(checked) => {
                      handlePreferenceChange(client.id, 'attachPhotoGroups', checked as boolean);
                      // Automatically select the row when preference changes
                      if (!selectedClients.has(client.id)) {
                        setSelectedClients(prev => new Set([...Array.from(prev), client.id]));
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={client.preferences?.serviceEmailPreferences?.attachSelectorsGroups || false}
                    onCheckedChange={(checked) => {
                      handlePreferenceChange(client.id, 'attachSelectorsGroups', checked as boolean);
                      // Automatically select the row when preference changes
                      if (!selectedClients.has(client.id)) {
                        setSelectedClients(prev => new Set([...Array.from(prev), client.id]));
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={client.preferences?.serviceEmailPreferences?.attachCustomChecklist || false}
                    onCheckedChange={(checked) => {
                      handlePreferenceChange(client.id, 'attachCustomChecklist', checked as boolean);
                      // Automatically select the row when preference changes
                      if (!selectedClients.has(client.id)) {
                        setSelectedClients(prev => new Set([...Array.from(prev), client.id]));
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={client.preferences?.serviceEmailPreferences?.sendFilterCleaningEmails || false}
                    onCheckedChange={(checked) => {
                      handlePreferenceChange(client.id, 'sendFilterCleaningEmails', checked as boolean);
                      // Automatically select the row when preference changes
                      if (!selectedClients.has(client.id)) {
                        setSelectedClients(prev => new Set([...Array.from(prev), client.id]));
                      }
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
