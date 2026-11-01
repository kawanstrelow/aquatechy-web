'use client';

import { DirectionsRenderer, GoogleMap, Marker } from '@react-google-maps/api';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Separator } from '@/components/ui/separator';
import { Colors } from '@/constants/colors';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { Assignment } from '@/ts/interfaces/Assignments';

type DirectionsResult = google.maps.DirectionsResult | null;

const calculateMapCenter = (assignments: Assignment[]) => {
  const coords = assignments.map((assignment) => assignment.pool.coords);
  const avgLat = coords.reduce((sum, coord) => sum + coord.lat, 0) / coords.length;
  const avgLng = coords.reduce((sum, coord) => sum + coord.lng, 0) / coords.length;

  if (assignments.length === 0) {
    return {
      lat: 40.039444085342595,
      lng: -97.07113126266353
    };
  }

  return { lat: avgLat, lng: avgLng };
};

const calculateBounds = (assignments: Assignment[]): google.maps.LatLngBounds | null => {
  if (assignments.length === 0) return null;

  const bounds = new google.maps.LatLngBounds();
  assignments.forEach((assignment) => {
    bounds.extend(assignment.pool.coords);
  });

  return bounds;
};

type Props = {
  assignments: Assignment[];
  directions: DirectionsResult | undefined;
  distance: string;
  duration: string;
  isLoaded: boolean;
  loadError: Error | undefined;
};

const Map = ({ assignments, directions, distance, duration, isLoaded, loadError }: Props) => {
  const t = useTranslations('routes');
  const { width } = useWindowDimensions();
  const mapRef = useRef<google.maps.Map | null>(null);
  const hasZoomedRef = useRef(false);

  // Show distance/duration when we have calculated values
  const showDistanceDuration = distance !== '' && duration !== '';

  // Track assignment IDs to detect changes
  const assignmentIds = assignments.map((a) => a.id).join(',');

  // Reset zoom flag when assignments change (e.g., switching weekdays)
  useEffect(() => {
    hasZoomedRef.current = false;
  }, [assignmentIds]);

  // Zoom to fit all markers on first render
  useEffect(() => {
    if (mapRef.current && assignments.length > 0 && !hasZoomedRef.current && isLoaded) {
      const bounds = calculateBounds(assignments);
      if (bounds) {
        // Use setTimeout to ensure markers are rendered
        setTimeout(() => {
          if (mapRef.current && !hasZoomedRef.current) {
            mapRef.current.fitBounds(bounds);
            hasZoomedRef.current = true;
          }
        }, 100);
      }
    }
  }, [assignments.length, isLoaded, assignments]);

  if (loadError) {
    return <div>{t('errorLoadingMaps')}</div>;
  }

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  const mapCenter = calculateMapCenter(assignments);

  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;

    // Zoom to fit all markers when map first loads
    if (assignments.length > 0) {
      const bounds = calculateBounds(assignments);
      if (bounds) {
        // Use setTimeout to ensure markers are rendered
        setTimeout(() => {
          map.fitBounds(bounds);
        }, 100);
      }
    }
  };

  return width ? (
    <div className="h-full">
      {showDistanceDuration && (
        <div className="absolute z-10 ml-2.5 mt-16 rounded-sm bg-gray-50 px-2 shadow-lg sm:right-24 sm:mt-2.5">
          <h3 className="py-1">{t('distance', { value: distance })}</h3>
          <Separator />
          <h3 className="py-1">{t('duration', { value: duration })}</h3>
        </div>
      )}

      <GoogleMap
        onLoad={onLoad}
        mapContainerStyle={{
          width: '100%',
          height: width > 576 ? '100vh' : '50vh',
          overflow: 'hidden',
          borderRadius: '8px'
        }}
        zoom={assignments.length === 0 ? 4 : 10}
        center={mapCenter}
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
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                zIndex: 50,
                strokeColor: Colors.blue[500],
                strokeWeight: 5
              }
            }}
          />
        )}
        {assignments.map((assignment) => (
          <Marker
            key={assignment.id}
            position={{
              lat: assignment.pool.coords.lat,
              lng: assignment.pool.coords.lng
            }}
            icon={{
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="40" height="50" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.373 0 0 5.373 0 12C0 21 12 40 12 40C12 40 24 21 24 12C24 5.373 18.627 0 12 0Z" fill="${Colors.blue[500]}"/>
                  <text x="12" y="18" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="white">${assignment.order}</text>
                </svg>
              `)}`,
              scaledSize: new google.maps.Size(40, 50),
              anchor: new google.maps.Point(12, 40)
            }}
          />
        ))}
      </GoogleMap>
    </div>
  ) : null;
};

export default Map;
