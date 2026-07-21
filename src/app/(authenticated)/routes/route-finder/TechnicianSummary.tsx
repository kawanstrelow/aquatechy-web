'use client';

import { Assignment } from '@/ts/interfaces/Assignments';
import { Typography } from '@/components/Typography';
import { useEffect, useState } from 'react';
import useGetMembersOfAllCompaniesByUserId from '@/hooks/react-query/companies/getMembersOfAllCompaniesByUserId';
import { useUserStore } from '@/store/user';
import Cookies from 'js-cookie';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const COOKIE_NAME = 'technician-weekday-colors';

interface Props {
  assignments: Assignment[];
  onFilterChange: (filteredAssignments: Assignment[]) => void;
  onColorChange: (newColorScheme: TechnicianWeekdayColors) => void;
  initialColorScheme: TechnicianWeekdayColors;
}

interface TechnicianWeekdayColors {
  [technicianId: string]: {
    [weekday: string]: string;
  };
}

type TechFilters = {
  [techId: string]: {
    [day: string]: boolean;
  };
};

function getFiltersCookieName(userId: string) {
  return `route-finder-tech-filters-${userId}`;
}

function defaultDaysForTech(): { [day: string]: boolean } {
  return weekdays.reduce<{ [key: string]: boolean }>((days, day) => ({
    ...days,
    [day]: true
  }), {});
}

function loadTechFilters(userId: string): TechFilters {
  if (!userId) return {};
  const stored = Cookies.get(getFiltersCookieName(userId));
  if (!stored) return {};
  try {
    return JSON.parse(stored) as TechFilters;
  } catch {
    return {};
  }
}

function saveTechFilters(userId: string, filters: TechFilters) {
  if (!userId) return;
  Cookies.set(getFiltersCookieName(userId), JSON.stringify(filters), {
    expires: 30,
    path: '/'
  });
}

function mergeTechFilters(existing: TechFilters, assignments: Assignment[]): TechFilters {
  const techIds = Array.from(new Set(assignments.map((a) => a.assignmentToId)));
  const merged: TechFilters = {};

  techIds.forEach((techId) => {
    if (existing[techId]) {
      merged[techId] = { ...existing[techId] };
      weekdays.forEach((day) => {
        if (merged[techId][day] === undefined) {
          merged[techId][day] = true;
        }
      });
    } else {
      merged[techId] = defaultDaysForTech();
    }
  });

  return merged;
}

function getAssignmentWeekday(assignment: Assignment): typeof weekdays[number] {
  return new Date(assignment.startOn)
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase() as typeof weekdays[number];
}

function filterAssignments(
  assignments: Assignment[],
  techFilters: TechFilters,
  colorScheme: TechnicianWeekdayColors
) {
  return assignments
    .filter((assignment) => {
      const techFilter = techFilters[assignment.assignmentToId];
      const weekday = getAssignmentWeekday(assignment);
      return techFilter && techFilter[weekday];
    })
    .map((assignment) => {
      const weekday = getAssignmentWeekday(assignment);
      return {
        ...assignment,
        color: colorScheme[assignment.assignmentToId]?.[weekday] || '#808080'
      };
    });
}

export function TechnicianSummary({
  assignments,
  onFilterChange,
  onColorChange,
  initialColorScheme
}: Props) {
  const userId = Cookies.get('userId') ?? '';

  const [techFilters, setTechFilters] = useState<TechFilters>(() => loadTechFilters(userId));

  const [colorScheme, setColorScheme] = useState<TechnicianWeekdayColors>(initialColorScheme);

  const user = useUserStore((state) => state.user);
  const { data: members } = useGetMembersOfAllCompaniesByUserId(user.id);

  useEffect(() => {
    setColorScheme(initialColorScheme);
  }, [initialColorScheme]);

  useEffect(() => {
    setTechFilters((prev) => {
      const merged = mergeTechFilters(prev, assignments);
      if (userId) saveTechFilters(userId, merged);
      return merged;
    });
  }, [assignments, userId]);

  useEffect(() => {
    onFilterChange(filterAssignments(assignments, techFilters, colorScheme));
  }, [assignments, techFilters, colorScheme, onFilterChange]);

  const technicianAssignments = assignments.reduce((acc, assignment) => {
    const techId = assignment.assignmentToId;
    const technician = members?.find(member => member.id === techId);

    if (!acc[techId]) {
      acc[techId] = {
        name: technician ? `${technician.firstName} ${technician.lastName}` : techId,
        assignments: [],
      };
    }
    acc[techId].assignments.push(assignment);
    return acc;
  }, {} as { [key: string]: { name: string; assignments: Assignment[] } });

  const handleDayToggle = (techId: string, day: string, checked: boolean) => {
    const newFilters = {
      ...techFilters,
      [techId]: {
        ...techFilters[techId],
        [day]: checked
      }
    };
    setTechFilters(newFilters);
    saveTechFilters(userId, newFilters);
    onFilterChange(filterAssignments(assignments, newFilters, colorScheme));
  };

  const handleColorChange = (techId: string, day: string, color: string) => {
    const newColorScheme = {
      ...colorScheme,
      [techId]: {
        ...colorScheme[techId],
        [day]: color
      }
    };

    setColorScheme(newColorScheme);
    Cookies.set(COOKIE_NAME, JSON.stringify(newColorScheme), {
      expires: 30,
      path: '/'
    });
    onColorChange(newColorScheme);
  };

  const handleTechnicianToggle = (techId: string, checked: boolean) => {
    const newFilters = {
      ...techFilters,
      [techId]: weekdays.reduce<{ [key: string]: boolean }>((days, day) => ({
        ...days,
        [day]: checked
      }), {})
    };
    setTechFilters(newFilters);
    saveTechFilters(userId, newFilters);
    onFilterChange(filterAssignments(assignments, newFilters, colorScheme));
  };

  const isTechnicianAllChecked = (techId: string) => {
    const techFilter = techFilters[techId];
    if (!techFilter) return false;
    return weekdays.every(day => techFilter[day]);
  };

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={Object.keys(technicianAssignments)} className="space-y-4">
        {Object.entries(technicianAssignments).map(([techId, tech]) => (
          <AccordionItem
            key={techId}
            value={techId}
            className="bg-white rounded-xl shadow-sm border-none"
          >
            <AccordionTrigger className="hover:no-underline px-4 py-3">
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const isAllChecked = isTechnicianAllChecked(techId);
                    handleTechnicianToggle(techId, !isAllChecked);
                  }}
                  className={`
                    p-1 rounded-md transition-colors shrink-0
                    ${isTechnicianAllChecked(techId)
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
                      d={isTechnicianAllChecked(techId)
                        ? "M5 13l4 4L19 7"
                        : "M6 18L18 6M6 6l12 12"
                      }
                    />
                  </svg>
                </button>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {tech.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <Typography element="h4" className="text-left font-semibold text-gray-900">
                    {tech.name}
                  </Typography>
                  <Typography element="span" className="text-left text-sm text-gray-500">
                    {tech.assignments.length} total assignments
                  </Typography>
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent>
              <div className="p-3">
                <div className="divide-y divide-gray-100">
                  {weekdays.map((day) => {
                    const assignmentsForDay = tech.assignments.filter(
                      a => a.weekday.toLowerCase() === day
                    ).length;
                    const isActive = techFilters[techId]?.[day] ?? true;
                    const currentColor = colorScheme[techId]?.[day] || '#808080';

                    return (
                      <div
                        key={`${techId}-${day}`}
                        className={`
                          flex items-center justify-between py-2 px-3
                          ${isActive ? '' : 'opacity-60'}
                          hover:bg-gray-50 rounded-lg transition-all
                        `}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Input
                              type="color"
                              value={currentColor}
                              onChange={(e) => handleColorChange(techId, day, e.target.value)}
                              className="w-6 h-6 p-0 rounded-full cursor-pointer border-0
                                opacity-0 absolute inset-0"
                            />
                            <div
                              className="w-6 h-6 rounded-full ring-2 ring-offset-2 ring-gray-200"
                              style={{ backgroundColor: currentColor }}
                            />
                          </div>
                          <button
                            onClick={() => handleDayToggle(techId, day, !isActive)}
                            className="flex items-center gap-3"
                          >
                            <span className="font-medium capitalize text-left text-gray-700 min-w-[100px]">
                              {day}
                            </span>
                            {assignmentsForDay > 0 && (
                              <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                <span className="text-sm text-gray-500">
                                  {assignmentsForDay} assignments
                                </span>
                              </div>
                            )}
                          </button>
                        </div>

                        <button
                          onClick={() => handleDayToggle(techId, day, !isActive)}
                          className={`
                            p-1 rounded-md transition-colors
                            ${isActive
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
                              d={isActive
                                ? "M5 13l4 4L19 7"
                                : "M6 18L18 6M6 6l12 12"
                              }
                            />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
