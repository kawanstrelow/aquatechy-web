'use client';

import { DirectionsRenderer, GoogleMap, InfoBox, Marker } from '@react-google-maps/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Colors } from '@/constants/colors';
import { Assignment } from '@/ts/interfaces/Assignments';
import { Pool } from '@/ts/interfaces/Pool';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Typography } from '@/components/Typography';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { X, ArrowLeftRight, Trash2 } from 'lucide-react';
import { Coords } from '@/ts/interfaces/Pool';
import useGetMembersOfAllCompaniesByUserId from '@/hooks/react-query/companies/getMembersOfAllCompaniesByUserId';
import { useUserStore } from '@/store/user';
import { DialogAssignPool } from './ModalAssignPool';
import { DialogTransferRoute } from '../assignments/ModalTransferRoute';
import { DialogDeleteAssignment } from '../assignments/ModalDeleteAssignment';

interface AssignmentWithColor extends Assignment {
  color?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '8px'
};

const calculateMapCenter = (assignments: Assignment[], poolsWithoutAssignments: Pool[], newLocation: Coords | null) => {
  if (newLocation) {
    return newLocation;
  }

  const allCoords = [
    ...assignments.map((assignment) => assignment.pool.coords),
    ...poolsWithoutAssignments.map((pool) => pool.coords)
  ];

  if (allCoords.length === 0) {
    return {
      lat: 40.039444085342595,
      lng: -97.07113126266353
    };
  }

  const avgLat = allCoords.reduce((sum, coord) => sum + coord.lat, 0) / allCoords.length;
  const avgLng = allCoords.reduce((sum, coord) => sum + coord.lng, 0) / allCoords.length;

  return { lat: avgLat, lng: avgLng };
};

interface MapProps {
  assignments: AssignmentWithColor[];
  poolsWithoutAssignments: Pool[];
  newLocation: Coords | null;
  isLoaded: boolean;
  loadError: Error | undefined;
}

const Map = ({ assignments, poolsWithoutAssignments, newLocation, isLoaded, loadError }: MapProps) => {
  const t = useTranslations('routes');
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithColor | null>(null);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [poolToAssign, setPoolToAssign] = useState<Pool | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
  const [assignmentToTransfer, setAssignmentToTransfer] = useState<Assignment | null>(null); // Add this state

  const user = useUserStore((state) => state.user);
  const { data: members } = useGetMembersOfAllCompaniesByUserId(user.id);

  if (loadError) {
    return <div>{t('errorLoadingMaps')}</div>;
  }

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  const mapCenter = calculateMapCenter(assignments, poolsWithoutAssignments, newLocation);

  return (
    <div className="relative h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={assignments.length === 0 && poolsWithoutAssignments.length === 0 ? 4 : 10}
        center={mapCenter}
        onClick={() => {
          setSelectedAssignment(null);
          setSelectedPool(null);
        }}
        options={{
          styles: [
            {
              featureType: 'poi',
              elementType: 'all',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'transit',
              elementType: 'all',
              stylers: [{ visibility: 'off' }]
            }
          ]
        }}
      >
        {/* Existing assignments */}
        <div>
          {assignments
            .filter((assignment) => assignment.color !== 'transparent')
            .map((assignment: AssignmentWithColor) => {
              return (
                <Marker
                  onClick={() => {
                    setSelectedAssignment(assignment);
                    setSelectedPool(null);
                  }}
                  key={assignment.id}
                  position={{
                    lat: assignment.pool.coords.lat,
                    lng: assignment.pool.coords.lng
                  }}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: assignment.color,
                    fillOpacity: 1,
                    scale: 10,
                    strokeColor: 'white',
                    strokeWeight: 1.5
                  }}
                />
              );
            })}
        </div>

        {/* Pools without assignments */}
        <div>
          {poolsWithoutAssignments.map((pool: Pool) => {
            return (
              <Marker
                onClick={() => {
                  setSelectedPool(pool);
                  setSelectedAssignment(null);
                }}
                key={pool.id}
                position={{
                  lat: pool.coords.lat,
                  lng: pool.coords.lng
                }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: '#FF0000',
                  fillOpacity: 0.7,
                  scale: 8,
                  strokeColor: 'white',
                  strokeWeight: 2
                }}
              />
            );
          })}
        </div>

        {/* New location marker */}
        {newLocation && (
          <Marker
            position={newLocation}
            icon={{
              path: 'M -2,-2 2,2 M 2,-2 -2,2',
              strokeColor: '#FF0000',
              strokeWeight: 6,
              scale: 6,
              strokeOpacity: 1
            }}
          />
        )}

        {/* Info window for selected assignment */}
        {selectedAssignment && (
          <InfoBox
            position={
              new google.maps.LatLng(selectedAssignment.pool.coords.lat ?? 0, selectedAssignment.pool.coords.lng ?? 0)
            }
            options={{
              closeBoxURL: '',
              enableEventPropagation: true,
              maxWidth: 500
            }}
          >
            <div className="min-w-32 rounded-md bg-white p-2 px-3 shadow-md animate-in fade-in-0">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex flex-1 items-center justify-start gap-2">
                  <span
                    className="h-2 w-6 rounded-md"
                    style={{
                      backgroundColor: selectedAssignment.color
                    }}
                  />
                </div>
                <Button
                  variant="ghost"
                  className="h-auto w-auto rounded-full p-1"
                  onClick={() => setSelectedAssignment(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <Typography element="p" className="text-sm">
                  <span className="font-semibold">{t('technician')} </span>
                  {members?.find((m) => m.id === selectedAssignment.assignmentToId)
                    ? `${members.find((m) => m.id === selectedAssignment.assignmentToId)?.firstName} ${members.find((m) => m.id === selectedAssignment.assignmentToId)?.lastName}`
                    : t('unknown')}
                </Typography>
                <Typography element="p" className="text-sm">
                  <span className="font-semibold">{t('client')} </span>
                  {selectedAssignment.pool.name.trim()}
                </Typography>
                <Typography element="p" className="text-sm">
                  <span className="font-semibold">{t('address')} </span>
                  {`${selectedAssignment.pool.address}, ${selectedAssignment.pool.city}, ${selectedAssignment.pool.zip}`}
                </Typography>
                <Typography element="p" className="text-sm">
                  <span className="font-semibold">{t('day')} </span>
                  {format(selectedAssignment.startOn, 'EEEE')}
                </Typography>

                {/* Action buttons */}
                <div className="mt-4 flex w-full items-center gap-2">
                  <Button
                    size="default"
                    style={{ width: '100%' }}
                    variant="outline"
                    onClick={() => {
                      setTimeout(() => {
                        setAssignmentToTransfer(selectedAssignment);
                        setIsTransferModalOpen(true);
                      }, 0);
                    }}
                    className="flex items-center gap-1"
                  >
                    <ArrowLeftRight className="h-3 w-3" />
                    {t('transfer')}
                  </Button>
                  <Button
                    size="default"
                    style={{ width: '100%' }}
                    variant="destructive"
                    onClick={() => {
                      setTimeout(() => {
                        setAssignmentToDelete(selectedAssignment);
                        setIsDeleteModalOpen(true);
                      }, 0);
                    }}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t('delete')}
                  </Button>
                </div>
              </div>
            </div>
          </InfoBox>
        )}

        {/* Info window for selected pool without assignment */}
        {selectedPool && (
          <InfoBox
            position={new google.maps.LatLng(selectedPool.coords.lat ?? 0, selectedPool.coords.lng ?? 0)}
            options={{
              closeBoxURL: '',
              enableEventPropagation: true,
              maxWidth: 500
            }}
          >
            <div className="min-w-32 rounded-md bg-white p-2 px-3 shadow-md animate-in fade-in-0">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex flex-1 items-center justify-start gap-2">
                  <span
                    className="h-2 w-6 rounded-md"
                    style={{
                      backgroundColor: '#FF0000'
                    }}
                  />
                </div>
                <Button
                  variant="ghost"
                  className="h-auto w-auto rounded-full p-1"
                  onClick={() => setSelectedPool(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <Typography element="p" className="text-sm">
                  <span className="font-semibold">{t('pool')} </span>
                  {selectedPool.name.trim()}
                </Typography>
                <Typography element="p" className="text-sm">
                  <span className="font-semibold">{t('address')} </span>
                  {`${selectedPool.address}, ${selectedPool.city}, ${selectedPool.zip}`}
                </Typography>
                <Typography element="p" className="text-sm font-semibold text-red-600">
                  {t('noAssignmentScheduled')}
                </Typography>
                <div className="mt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setPoolToAssign(selectedPool);
                      setIsAssignModalOpen(true);
                    }}
                    className="w-full"
                  >
                    {t('assign')}
                  </Button>
                </div>
              </div>
            </div>
          </InfoBox>
        )}
      </GoogleMap>

      {/* Assign Pool Modal */}
      <DialogAssignPool
        open={isAssignModalOpen}
        setOpen={(open) => {
          setIsAssignModalOpen(open);
          if (!open) {
            setPoolToAssign(null);
          }
        }}
        pool={poolToAssign}
      />

      {/* Transfer Assignment Modal */}
      {assignmentToTransfer && (
        <DialogTransferRoute
          open={isTransferModalOpen}
          setOpen={(open) => {
            setIsTransferModalOpen(open);
            if (!open) {
              setAssignmentToTransfer(null);
            }
          }}
          assignment={assignmentToTransfer}
        />
      )}

      {/* Delete Assignment Modal */}
      {assignmentToDelete && (
        <DialogDeleteAssignment
          open={isDeleteModalOpen}
          setOpen={(open) => {
            setIsDeleteModalOpen(open);
            if (!open) {
              setAssignmentToDelete(null);
            }
          }}
          assignment={assignmentToDelete}
        />
      )}
    </div>
  );
};

export default Map;
