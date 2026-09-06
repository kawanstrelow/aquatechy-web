'use client';

import { DirectionsRenderer, GoogleMap, Marker } from '@react-google-maps/api';
import { useEffect, useRef } from 'react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Separator } from '@/components/ui/separator';
import { Colors } from '@/constants/colors';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { cn } from '@/lib/utils';
import { Service } from '@/ts/interfaces/Service';
import { getInitials } from '@/utils/others';

type DirectionsResult = google.maps.DirectionsResult | null;

const calculateMapCenter = (services: Service[]) => {
  const coords = services.map((service) => service?.pool?.coords);
  const avgLat = coords.reduce((sum, coord) => sum + coord!.lat, 0) / coords.length;
  const avgLng = coords.reduce((sum, coord) => sum + coord!.lng, 0) / coords.length;

  if (services.length === 0) {
    return {
      lat: 40.039444085342595,
      lng: -97.07113126266353
    };
  }

  return { lat: avgLat, lng: avgLng };
};

const calculateBounds = (services: Service[]): google.maps.LatLngBounds | null => {
  if (services.length === 0) return null;

  const bounds = new google.maps.LatLngBounds();
  services.forEach((service) => {
    if (service.pool?.coords) {
      bounds.extend(service.pool.coords);
    }
  });

  return bounds;
};

const fitMapToServices = (map: google.maps.Map, services: Service[], padding?: number) => {
  const bounds = calculateBounds(services);
  if (!bounds) return;
  map.fitBounds(bounds, padding);
};

type Props = {
  services: Service[];
  directions: DirectionsResult | undefined;
  distance: string;
  duration: string;
  isLoaded: boolean;
  loadError: Error | undefined;
  height?: string;
  fitBoundsPadding?: number;
  compact?: boolean;
};

const Map = ({
  services,
  directions,
  distance,
  duration,
  isLoaded,
  loadError,
  height,
  fitBoundsPadding,
  compact
}: Props) => {
  const { width } = useWindowDimensions();
  const mapRef = useRef<google.maps.Map | null>(null);
  const hasZoomedRef = useRef(false);
  const mapHeight = height ?? (width && width > 576 ? '100vh' : '50vh');

  const showDistanceDuration = distance !== '' && duration !== '';

  // Track service IDs to detect changes
  const serviceIds = services.map((s) => s.id).join(',');

  // Reset zoom flag when services change (e.g., switching days)
  useEffect(() => {
    hasZoomedRef.current = false;
  }, [serviceIds]);

  // Zoom to fit all markers on first render or when services change
  useEffect(() => {
    if (mapRef.current && services.length > 0 && !hasZoomedRef.current && isLoaded) {
      setTimeout(() => {
        if (mapRef.current && !hasZoomedRef.current) {
          fitMapToServices(mapRef.current, services, fitBoundsPadding);
          hasZoomedRef.current = true;
        }
      }, 100);
    }
    // serviceIds already tracks service changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceIds, isLoaded]);

  // Dialogs start at 0 size; resize and fit bounds after the modal layout settles
  useEffect(() => {
    if (!height || !mapRef.current || !isLoaded) return;

    const timeout = setTimeout(() => {
      if (!mapRef.current) return;
      google.maps.event.trigger(mapRef.current, 'resize');
      fitMapToServices(mapRef.current, services, fitBoundsPadding);
      hasZoomedRef.current = true;
    }, 250);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, serviceIds, isLoaded]);

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  const mapCenter = calculateMapCenter(services);

  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;

    if (services.length > 0) {
      setTimeout(() => {
        fitMapToServices(map, services, fitBoundsPadding);
      }, 100);
    }
  };

  return width || height ? (
    <div className="relative h-full">
      {showDistanceDuration && (
        <div
          className={cn(
            'absolute z-10 rounded-sm bg-white/95 px-2 shadow-lg',
            compact ? 'bottom-2 left-2 text-xs' : 'ml-2.5 mt-16 sm:right-24 sm:mt-2.5'
          )}
        >
          <h3 className="py-1">Distance: {distance}</h3>
          <Separator />
          <h3 className="py-1">Drive time: {duration}</h3>
        </div>
      )}

      <GoogleMap
        onLoad={onLoad}
        mapContainerStyle={{
          width: '100%',
          height: mapHeight,
          overflow: 'hidden',
          borderRadius: '8px'
        }}
        zoom={services.length === 0 ? 4 : 10}
        center={mapCenter}
        options={{
          streetViewControl: !compact,
          mapTypeControl: false,
          fullscreenControl: !compact,
          zoomControl: true,
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
        {services.map((service) => {
          const name = `${service.clientOwner.firstName} ${service.clientOwner.lastName}`;
          return (
            <Marker
              key={service.id}
              position={{
                lat: service.pool!.coords.lat,
                lng: service.pool!.coords.lng
              }}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                  <svg width="40" height="50" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.373 0 0 5.373 0 12C0 21 12 40 12 40C12 40 24 21 24 12C24 5.373 18.627 0 12 0Z" fill="${Colors.blue[500]}"/>
                    <text x="12" y="18" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="white">${getInitials(name)}</text>
                  </svg>
                `)}`,
                scaledSize: new google.maps.Size(40, 50),
                anchor: new google.maps.Point(12, 40)
              }}
            />
          );
        })}
      </GoogleMap>
    </div>
  ) : null;
};

export default Map;
