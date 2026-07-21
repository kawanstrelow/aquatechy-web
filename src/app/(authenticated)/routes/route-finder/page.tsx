'use client';

import { useLoadScript } from '@react-google-maps/api';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Cookies from 'js-cookie';
import { Calendar, Palette, CheckSquare, MousePointer } from 'lucide-react';

import { Form } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { libraries } from '@/constants';
import { AddressInput } from '@/components/AddressInput';
import { IanaTimeZones } from '@/ts/enums/enums';
import Map from './Map';
import { useAssignmentsContext } from '@/context/assignments';
import { TechnicianSummary } from './TechnicianSummary';
import { Assignment } from '@/ts/interfaces/Assignments';
import { Typography } from '@/components/Typography';
import useGetPoolsWithoutAssignments from '@/hooks/react-query/pools/getPoolsWithoutAssignments';

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';

const formSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  preferredDay: z.string()
});

type FormValues = z.infer<typeof formSchema>;

function generateRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

interface TechnicianWeekdayColors {
  [technicianId: string]: {
    [weekday: string]: string;
  };
}

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const COOKIE_NAME = 'technician-weekday-colors';

function generateTechnicianWeekdayColors(technicianIds: string[]): TechnicianWeekdayColors {
  const colors: TechnicianWeekdayColors = {};
  
  technicianIds.forEach(techId => {
    colors[techId] = {};
    WEEKDAYS.forEach(day => {
      colors[techId][day] = generateRandomColor();
    });
  });
  
  return colors;
}

function PoolsWithoutAssignments({ 
  showPoolsWithoutAssignments, 
  onTogglePoolsWithoutAssignments 
}: { 
  showPoolsWithoutAssignments: boolean;
  onTogglePoolsWithoutAssignments: (checked: boolean) => void;
}) {
  const { data: poolsWithoutAssignments } = useGetPoolsWithoutAssignments();
  const count = poolsWithoutAssignments?.length || 0;

  return (
    <div className="mb-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Red circle with "?" */}
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 font-semibold text-xl">?</span>
          </div>
          <div>
            <Typography element="h4" className="text-left font-semibold text-gray-900">
              Pools without assignments
            </Typography>
            <Typography element="span" className="text-sm text-gray-500">
              {count} pools without assignment
            </Typography>
          </div>
        </div>
        
        {/* Toggle button with clickable text */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onTogglePoolsWithoutAssignments(!showPoolsWithoutAssignments)}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-md px-2 py-1 transition-colors"
          >
            <span className="text-sm text-gray-500">
              {showPoolsWithoutAssignments ? 'Hide' : 'Show'} on map
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent double-triggering
                onTogglePoolsWithoutAssignments(!showPoolsWithoutAssignments);
              }}
              className={`
                p-1 rounded-md transition-colors
                ${showPoolsWithoutAssignments 
                  ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                  : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                }
              `}
            >
              <svg 
                className="w-5 h-5"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={showPoolsWithoutAssignments 
                    ? "M5 13l4 4L19 7" 
                    : "M6 18L18 6M6 6l12 12"
                  } 
                />
              </svg>
            </button>
          </button>
        </div>
      </div>
    </div>
  );
}

function RouteFinderContent() {
  const { allAssignments } = useAssignmentsContext();
  const { data: poolsWithoutAssignments = [] } = useGetPoolsWithoutAssignments();
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loadError, setLoadError] = useState<Error | undefined>();
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [showPoolsWithoutAssignments, setShowPoolsWithoutAssignments] = useState(false);
  
  const [currentColorScheme, setCurrentColorScheme] = useState<TechnicianWeekdayColors>(() => {
    // Initialize with stored colors or generate new ones
    const storedColors = Cookies.get(COOKIE_NAME);
    if (storedColors) {
      return JSON.parse(storedColors);
    }
    return {};
  });

  const { isLoaded } = useLoadScript({
    googleMapsApiKey,
    libraries
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: '',
      preferredDay: 'any'
    }
  });

  const handleAddressSelect = async (address: {
    fullAddress: string;
    state: string;
    city: string;
    zipCode: string;
    timezone: IanaTimeZones;
  }) => {
    // Get coordinates using Geocoding service
    const geocoder = new google.maps.Geocoder();
    const fullAddress = `${address.fullAddress}, ${address.city}, ${address.state} ${address.zipCode}`;
    
    try {
      const result = await geocoder.geocode({ address: fullAddress });
      if (result.results[0]?.geometry?.location) {
        setSelectedCoords({
          lat: result.results[0].geometry.location.lat(),
          lng: result.results[0].geometry.location.lng()
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  useEffect(() => {
    if (Object.keys(currentColorScheme).length > 0) return; // Skip if we already have colors

    const validAssignments = allAssignments.filter(a => a.assignmentToId);
    if (validAssignments.length === 0) return;

    const technicianIds = Array.from(new Set(validAssignments.map(a => a.assignmentToId)));
    const newColors = generateTechnicianWeekdayColors(technicianIds);
    
    Cookies.set(COOKIE_NAME, JSON.stringify(newColors), {
      expires: 30,
      path: '/'
    });
    setCurrentColorScheme(newColors);
  }, [allAssignments, currentColorScheme]);

  const handleColorChange = (newColorScheme: TechnicianWeekdayColors) => {
    setCurrentColorScheme(newColorScheme);
  };

  const handleTogglePoolsWithoutAssignments = (checked: boolean) => {
    setShowPoolsWithoutAssignments(checked);
  };

  if (!isLoaded) return <LoadingSpinner />;

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="w-full lg:w-1/3">
          <div className="mb-4 space-y-4">

            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="space-y-4">
                
                
                <div className="grid gap-3">
                  <div className="flex gap-3 items-start">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50">
                      <Calendar className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-600">
                      View your technician's weekly assignments with color-coded markers
                    </p>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50">
                      <CheckSquare className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Toggle visibility of specific days for each technician
                    </p>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50">
                      <Palette className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Customize route colors to match your preferences
                    </p>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50">
                      <MousePointer className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Click markers to view detailed assignment information
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form className="space-y-4 mb-4">
              <AddressInput
                name="address"
                label="Pool Address"
                placeholder="Enter pool address"
                onAddressSelect={handleAddressSelect}
              />
            </form>

            <PoolsWithoutAssignments 
              showPoolsWithoutAssignments={showPoolsWithoutAssignments}
              onTogglePoolsWithoutAssignments={handleTogglePoolsWithoutAssignments}
            />

            <TechnicianSummary 
              assignments={allAssignments}
              onFilterChange={setFilteredAssignments}
              onColorChange={handleColorChange}
              initialColorScheme={currentColorScheme}
            />
          </Form>
        </div>

        <div className="h-[600px] w-full lg:w-2/3">
          <Map
            assignments={filteredAssignments}
            poolsWithoutAssignments={showPoolsWithoutAssignments ? poolsWithoutAssignments : []}
            newLocation={selectedCoords}
            isLoaded={isLoaded}
            loadError={loadError}
          />
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
      <RouteFinderContent />
  );
} 