'use client';

import {
  CheckCircleIcon,
  ListChecks,
  XCircleIcon,
  Beaker,
  FlaskConical,
  ImageIcon,
  Mail,
  Download,
  MapPin,
  FileText,
  Trash2,
  Plus
} from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { zipImages } from '@/lib/js-zip';
import { format } from 'date-fns';
import { Service } from '@/ts/interfaces/Service';
import { generateServicePDF } from '@/utils/generateServicePDF';
import { useResendServiceEmail } from '@/hooks/react-query/services/useResendServiceEmail';
import { useDeleteServicePhoto } from '@/hooks/react-query/services/useDeleteServicePhoto';
import { useAddServicePhotos } from '@/hooks/react-query/services/useAddServicePhotos';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type Props = {
  service: Service;
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function ModalViewService({ service, open, setOpen }: Props) {
  const resendEmailMutation = useResendServiceEmail();
  const deletePhotoMutation = useDeleteServicePhoto();
  const addPhotosMutation = useAddServicePhotos();

  const [photoToDelete, setPhotoToDelete] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddPhotoDialog, setShowAddPhotoDialog] = useState(false);
  const [showResendEmailDialog, setShowResendEmailDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentService, setCurrentService] = useState<Service>(service);

  useEffect(() => {
    setCurrentService(service);
  }, [service]);

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'InProgress':
        return 'Service is in progress.';
      case 'Open':
        return 'Service is still open.';
      case 'Skipped':
        return 'Service was skipped.';
      default:
        return '';
    }
  };

  const handleResendEmailClick = () => {
    setShowResendEmailDialog(true);
  };

  const handleResendEmail = () => {
    if (currentService?.id) {
      resendEmailMutation.mutate(
        { serviceId: currentService.id },
        {
          onSuccess: () => {
            setShowResendEmailDialog(false);
            
          },
          onError: () => {
            setShowResendEmailDialog(false);
            
          }
        }
      );
    }
  };

  const handleDeletePhoto = (photo: any) => {
    setPhotoToDelete(photo);
    setShowDeleteDialog(true);
  };

  const confirmDeletePhoto = () => {
    if (photoToDelete && currentService?.id) {
      deletePhotoMutation.mutate(
        { serviceId: currentService.id, photoToDelete, currentService: currentService },
        {
          onSuccess: (updatedService) => {
            setShowDeleteDialog(false);
            setPhotoToDelete(null);
            setCurrentService(updatedService.service);
          }
        }
      );
    }
  };

  const handleAddPhotos = () => {
    setShowAddPhotoDialog(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const confirmAddPhotos = () => {
    if (selectedFiles.length > 0 && currentService?.id) {
      // Get photo definitions from the service
      const photoDefinitions = currentService.photosSnapshot?.flatMap(group => group.photoDefinitions) || [];

      // Filter for "After service" photo definitions
      const afterServiceDefinitions = photoDefinitions.filter(def =>
        def.name.toLowerCase().includes('after service') ||
        def.name.toLowerCase().includes('after-service') ||
        def.name.toLowerCase().includes('after')
      );

      // Use the first "After service" definition, or fallback to first available, or create a default one
      const photoDefinitionId = afterServiceDefinitions.length > 0
        ? afterServiceDefinitions[0].id
        : photoDefinitions.length > 0
        ? photoDefinitions[0].id
        : 'default-photo-definition';

      const newPhotos = selectedFiles.map(file => ({
        photoDefinitionId,
        file,
        notes: `Added photo - ${file.name}`
      }));

      addPhotosMutation.mutate(
        {
          serviceId: currentService.id,
          newPhotos,
          photoDefinitions,
          currentService: currentService
        },
        {
          onSuccess: (updatedService) => {
            setShowAddPhotoDialog(false);
            setSelectedFiles([]);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            setCurrentService(updatedService.service);
          }
        }
      );
    }
  };

  // Helper functions for new structured data
  const getStructuredPhotos = () => {
    if (currentService?.structuredPhotos && currentService.structuredPhotos.length > 0) {
      return currentService.structuredPhotos;
    }
    // Fallback to old photos array
    if (currentService?.photos && currentService.photos.length > 0) {
      return currentService.photos.map((photo: string, index: number) => ({
        id: `legacy-${index}`,
        url: photo,
        photoDefinitionId: 'legacy',
        notes: null,
        createdAt: currentService.completedAt || new Date().toISOString()
      }));
    }
    return [];
  };

  const getPhotosForDownload = () => {
    const structuredPhotos = getStructuredPhotos();
    return structuredPhotos.map((photo: any) => photo.url);
  };

  const hasPhotos = () => {
    const photos = getStructuredPhotos();
    return photos && photos.length > 0;
  };

  const getPhotoGroups = () => {
    if (!currentService?.photosSnapshot) return [];

    return currentService.photosSnapshot.map((group: any) => {
      const groupPhotos = currentService?.structuredPhotos?.filter(
        (photo: any) => group.photoDefinitions.some((def: any) => def.id === photo.photoDefinitionId)
      ) || [];

      return {
        ...group,
        photos: groupPhotos
      };
    });
  };

  const getReadingGroups = () => {
    if (currentService?.readingsSnapshot) {
      return currentService.readingsSnapshot.map((group: any) => ({
        ...group,
        readings: currentService?.readings?.filter((reading: any) =>
          group.readingDefinitions.some((def: any) => def.id === reading.readingDefinitionId)
        ) || []
      }));
    }

    // Fallback to old structure
    if (currentService?.chemicalsReading) {
      return [{
        id: 'legacy',
        name: 'Chemical Readings',
        description: 'Legacy chemical readings',
        readings: Object.entries(currentService.chemicalsReading).map(([key, value]) => ({
          readingDefinitionId: key,
          value: value,
          readingDefinition: {
            name: key.charAt(0).toUpperCase() + key.slice(1),
            unit: key === 'ph' ? 'pH' : 'ppm'
          }
        }))
      }];
    }

    return [];
  };

  const getConsumableGroups = () => {
    if (currentService?.consumablesSnapshot) {
      return currentService.consumablesSnapshot.map((group: any) => ({
        ...group,
        consumables: currentService?.consumables?.filter((consumable: any) =>
          group.consumableDefinitions.some((def: any) => def.id === consumable.consumableDefinitionId)
        ) || []
      }));
    }

    // Fallback to old structure
    if (currentService?.chemicalsSpent) {
      return [{
        id: 'legacy',
        name: 'Chemicals Spent',
        description: 'Legacy chemicals spent',
        consumables: Object.entries(currentService.chemicalsSpent).map(([key, value]) => ({
          consumableDefinitionId: key,
          quantity: value,
          consumableDefinition: {
            name: key.charAt(0).toUpperCase() + key.slice(1),
            unit: key === 'liquidChlorine' || key === 'muriaticAcid' ? 'gallon' :
                  key === 'tablet' ? 'unit' : 'oz'
          }
        }))
      }];
    }

    return [];
  };

  const getChecklistItems = () => {
    // Use new structured checklist if available
    if (currentService?.checklistSnapshot && currentService?.customChecklist) {
      return currentService.checklistSnapshot.map((item: any) => ({
        ...item,
        completed: currentService.customChecklist![item.id] || false
      }));
    }

    // Fallback to old checklist structure
    if (currentService?.checklist) {
      return [
        { id: 'poolVacuumed', label: 'Pool Vacuumed', completed: currentService.checklist.poolVacuumed },
        { id: 'skimmerCleaned', label: 'Skimmer Cleaned', completed: currentService.checklist.skimmerCleaned },
        { id: 'tilesBrushed', label: 'Tiles Brushed', completed: currentService.checklist.tilesBrushed },
        { id: 'pumpBasketCleaned', label: 'Pump Basket Cleaned', completed: currentService.checklist.pumpBasketCleaned },
        { id: 'filterWashed', label: 'Filter Washed', completed: currentService.checklist.filterWashed },
        { id: 'filterChanged', label: 'Filter Changed', completed: currentService.checklist.filterChanged },
        { id: 'chemicalsAdjusted', label: 'Chemicals Adjusted', completed: currentService.checklist.chemicalsAdjusted }
      ];
    }

    return [];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-[#364D9D]" />
            <DialogTitle className="text-xl font-semibold">Service Report</DialogTitle>
          </div>

          {currentService.status === 'Completed' && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <div className="flex-1">
                {format(new Date(currentService?.completedAt || new Date()), "EEEE, MMMM do 'at' h:mm a")}
                <span className="ml-1 font-medium">
                  by {currentService?.completedByUser?.firstName || ''} {currentService?.completedByUser?.lastName || ''}
                </span>
              </div>
            </div>
          )}

          <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            <span>
              {currentService?.pool?.bodyOfWater ? `${currentService?.pool?.bodyOfWater} - ` : ''}{currentService?.pool?.address}{currentService?.pool?.addressLine2 ? ` ${currentService?.pool?.addressLine2}` : ''}, {currentService?.pool?.city}, {currentService?.pool?.state}, {currentService?.pool?.zip}
            </span>
          </div>
        </DialogHeader>

        {currentService.status === 'Completed' ? (
          <>
            <Accordion type="single" collapsible defaultValue="photos" className="mt-4">
              {/* Service Photos Section - Always show */}
              <AccordionItem value="photos">
                <AccordionTrigger className="text-lg">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-[#364D9D]" />
                    <span className="text-md">Service Photos</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {hasPhotos() ? (
                    <>
                      {currentService?.photosSnapshot && currentService?.photosSnapshot.length > 0 && currentService?.photos?.length === 0 ? (
                        // New structured photos
                        <div className="space-y-4">
                          {getPhotoGroups().map((group: any, groupIndex: number) => (
                            <Card key={groupIndex}>
                              <CardHeader>
                                <CardTitle className="text-lg">{group.name}</CardTitle>
                                {group.description && (
                                  <p className="text-sm text-gray-600">{group.description}</p>
                                )}
                              </CardHeader>
                              <CardContent>
                                {group.photos.length > 0 ? (
                                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                                    {group.photos.map((photo: any, photoIndex: number) => {
                                      const photoDefinition = group.photoDefinitions?.find((def: any) => def.id === photo.photoDefinitionId);
                                      return (
                                        <div key={photoIndex} className="space-y-2">
                                          {photoDefinition && (
                                            <p className="text-sm font-medium text-gray-700">{photoDefinition.name}</p>
                                          )}
                                          {photo.notes && (
                                            <p className="text-xs text-gray-500">{photo.notes}</p>
                                          )}
                                          <div className="group relative aspect-square overflow-hidden rounded-lg">
                                            <Image
                                              src={photo.url}
                                              alt={photoDefinition?.name || `Service photo ${photoIndex + 1}`}
                                              layout="fill"
                                              className="object-cover transition-transform hover:scale-105"
                                            />
                                            {/* Delete button on hover */}
                                            <button
                                              onClick={() => handleDeletePhoto(photo)}
                                              className="absolute right-2 top-2 hidden rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-all hover:bg-red-600 group-hover:block"
                                              disabled={deletePhotoMutation.isPending}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </button>
                                          </div>

                                        </div>
                                      );
                                    })}
                                    {/* Add photo button */}
                                    <div className="space-y-2">
                                      <button
                                        onClick={handleAddPhotos}
                                        className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-gray-400 hover:bg-gray-100"
                                        disabled={addPhotosMutation.isPending}
                                      >
                                        <Plus className="h-8 w-8 text-gray-400" />
                                      </button>
                                      <p className="text-sm font-medium text-gray-700">Add Photo</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center space-y-4">
                                    <p className="text-sm text-gray-500">No photos available for this group.</p>
                                    <button
                                      onClick={handleAddPhotos}
                                      className="flex aspect-square w-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-gray-400 hover:bg-gray-100"
                                      disabled={addPhotosMutation.isPending}
                                    >
                                      <Plus className="h-8 w-8 text-gray-400" />
                                    </button>
                                    <p className="text-sm font-medium text-gray-700">Add Photo</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        // Legacy photos
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                          {getStructuredPhotos()?.map((photo: any, index: number) => (
                            <div key={index} className="group relative aspect-square overflow-hidden rounded-lg">
                              <Image
                                src={photo.url}
                                alt={`Service photo ${index + 1}`}
                                layout="fill"
                                className="object-cover transition-transform hover:scale-105"
                              />
                              {/* Delete button on hover for legacy photos */}
                              <button
                                onClick={() => handleDeletePhoto(photo)}
                                className="absolute right-2 top-2 hidden rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-all hover:bg-red-600 group-hover:block"
                                disabled={deletePhotoMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          {/* Add photo button for legacy photos */}
                          <div className="space-y-2">
                            <button
                              onClick={handleAddPhotos}
                              className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-gray-400 hover:bg-gray-100"
                              disabled={addPhotosMutation.isPending}
                            >
                              <Plus className="h-8 w-8 text-gray-400" />
                            </button>
                            <p className="text-sm font-medium text-gray-700">Add Photo</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // No photos - show add photo button
                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                      <p className="text-sm text-gray-500">No photos have been added to this service yet.</p>
                      <button
                        onClick={handleAddPhotos}
                        className="flex aspect-square w-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-gray-400 hover:bg-gray-100"
                        disabled={addPhotosMutation.isPending}
                      >
                        <Plus className="h-8 w-8 text-gray-400" />
                      </button>
                      <p className="text-sm font-medium text-gray-700">Add Photos</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Readings Section */}
              {getReadingGroups().length > 0 && (
                <AccordionItem value="readings">
                  <AccordionTrigger className="text-lg">
                    <div className="flex items-center gap-2">
                      <Beaker className="h-5 w-5 text-[#364D9D]" />
                      <span className="text-md">Readings</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {getReadingGroups().map((group: any, groupIndex: number) => (
                        <Card key={groupIndex}>
                          <CardHeader>
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            {group.description && (
                              <p className="text-sm text-gray-600">{group.description}</p>
                            )}
                          </CardHeader>
                          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            {group.readings.length > 0 ? (
                              group.readings.map((reading: any, readingIndex: number) => {
                                // Find the reading definition from the group's readingDefinitions
                                const readingDefinition = group.readingDefinitions?.find((def: any) => def.id === reading.readingDefinitionId);
                                return (
                                  <div key={readingIndex} className="rounded-lg bg-gray-50 p-3">
                                    <div className="text-sm text-gray-500">
                                      {readingDefinition?.name || reading.readingDefinitionId}
                                      {readingDefinition?.unit && ` (${readingDefinition.unit})`}
                                    </div>
                                    <div className="text-lg font-semibold">{reading.value || 'N/A'}</div>
                                  </div>
                                );
                              })
                            ) : (
                              // Fallback for legacy structure
                              group.readingDefinitions?.map((def: any, defIndex: number) => {
                                const reading = group.readings.find((r: any) => r.readingDefinitionId === def.id);
                                return (
                                  <div key={defIndex} className="rounded-lg bg-gray-50 p-3">
                                    <div className="text-sm text-gray-500">
                                      {def.name} {def.unit && `(${def.unit})`}
                                    </div>
                                    <div className="text-lg font-semibold">{reading?.value || 'N/A'}</div>
                                  </div>
                                );
                              })
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Consumables Section */}
              {getConsumableGroups().length > 0 && (
                <AccordionItem value="consumables">
                  <AccordionTrigger className="text-lg">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="h-5 w-5 text-[#364D9D]" />
                      <span className="text-md">Consumables</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {getConsumableGroups().map((group: any, groupIndex: number) => (
                        <Card key={groupIndex}>
                          <CardHeader>
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            {group.description && (
                              <p className="text-sm text-gray-600">{group.description}</p>
                            )}
                          </CardHeader>
                          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            {group.consumables.length > 0 ? (
                              group.consumables.map((consumable: any, consumableIndex: number) => {
                                // Find the consumable definition from the group's consumableDefinitions
                                const consumableDefinition = group.consumableDefinitions?.find((def: any) => def.id === consumable.consumableDefinitionId);
                                return (
                                  <div key={consumableIndex} className="rounded-lg bg-gray-50 p-3">
                                    <div className="text-sm text-gray-500">
                                      {consumableDefinition?.name || consumable.consumableDefinitionId}
                                      {consumableDefinition?.unit && ` (${consumableDefinition.unit})`}
                                    </div>
                                    <div className="text-lg font-semibold">
                                      {consumable.quantity ? `${consumable.quantity} ${consumableDefinition?.unit || ''}` : 'N/A'}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              // Fallback for legacy structure
                              group.consumableDefinitions?.map((def: any, defIndex: number) => {
                                const consumable = group.consumables.find((c: any) => c.consumableDefinitionId === def.id);
                                return (
                                  <div key={defIndex} className="rounded-lg bg-gray-50 p-3">
                                    <div className="text-sm text-gray-500">
                                      {def.name} {def.unit && `(${def.unit})`}
                                    </div>
                                    <div className="text-lg font-semibold">
                                      {consumable?.quantity ? `${consumable.quantity} ${def.unit || ''}` : 'N/A'}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Checklist Section */}
              {getChecklistItems().length > 0 && (
                <AccordionItem value="checklist">
                  <AccordionTrigger className="text-lg">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-[#364D9D]" />
                      <span className="text-md">Service Checklist</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Card>
                      <CardContent className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">
                        {getChecklistItems().map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                            <span className="text-gray-700">{item.label || item.name}</span>
                            {item.completed ? (
                              <CheckCircleIcon className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircleIcon className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              )}

            </Accordion>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3 sm:px-0 sm:py-0">
              <Button
                onClick={handleResendEmailClick}
                variant="outline"
                className="flex items-center gap-2"
                disabled={resendEmailMutation.isPending}
              >
                <Mail className="h-4 w-4" />
                {resendEmailMutation.isPending ? 'Sending...' : 'Resend Email'}
              </Button>

              {hasPhotos() && (
                <Button
                  onClick={async () => {
                    try {
                      const photosForDownload = getPhotosForDownload();
                      const zipContent = await zipImages(photosForDownload);
                      const url = URL.createObjectURL(zipContent);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'service-photos.zip';
                      link.click();
                      URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('Error downloading photos:', error);
                      alert('Failed to download photos. Please try again.');
                    }
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Photos
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-40 items-center justify-center text-lg text-gray-500">
            {getStatusMessage(currentService.status)}
          </div>
        )}
      </DialogContent>

      {/* Delete Photo Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePhoto}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletePhotoMutation.isPending}
            >
              {deletePhotoMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Photos Dialog */}
      <Dialog open={showAddPhotoDialog} onOpenChange={setShowAddPhotoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Photos</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="photo-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Select photos to upload
              </label>
              <input
                ref={fileInputRef}
                id="photo-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Selected files:</p>
                <div className="space-y-1">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddPhotoDialog(false);
                setSelectedFiles([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAddPhotos}
              disabled={selectedFiles.length === 0 || addPhotosMutation.isPending}
            >
              {addPhotosMutation.isPending ? 'Uploading...' : 'Upload Photos'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resend Email Confirmation Dialog */}
      <AlertDialog open={showResendEmailDialog} onOpenChange={setShowResendEmailDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resend Service Email</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to resend the service report email to the client? This will send a new copy of the service report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResendEmail}
              disabled={resendEmailMutation.isPending}
            >
              {resendEmailMutation.isPending ? 'Sending...' : 'Resend Email'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
