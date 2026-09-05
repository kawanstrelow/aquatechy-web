import { addMinutes, format } from 'date-fns';

import { Assignment } from '@/ts/interfaces/Assignments';
import { HereRouteResult } from '@/ts/interfaces/HereMaps';
import { Service } from '@/ts/interfaces/Service';

export function getAssignmentsForServices(
  services: Service[],
  allAssignments: Assignment[]
): (Assignment | undefined)[] {
  return services.map((service) =>
    allAssignments.find((assignment) => assignment.id === (service.assignment?.id ?? service.assignmentId))
  );
}

export function hasRouteTiming(assignments: (Assignment | undefined)[]): boolean {
  return assignments.some(
    (assignment) => assignment?.timeInMinutesToNextStop != null || assignment?.distanceInMilesToNextStop != null
  );
}

export function getEstimatedArrivalTime(assignments: (Assignment | undefined)[], currentIndex: number): string | null {
  if (!hasRouteTiming(assignments)) {
    return null;
  }

  const startTime = new Date();
  startTime.setHours(8, 0, 0, 0);

  let accumulatedMinutes = 0;

  for (let i = 0; i < currentIndex; i++) {
    accumulatedMinutes += 15;
    if (assignments[i]?.timeInMinutesToNextStop) {
      accumulatedMinutes += assignments[i]!.timeInMinutesToNextStop!;
    }
  }

  return format(addMinutes(startTime, accumulatedMinutes), 'h:mm a');
}

export function getRouteTotals(assignments: (Assignment | undefined)[]): {
  totalDistance: string;
  totalDuration: string;
} {
  if (assignments.length <= 1) {
    return {
      totalDistance: '',
      totalDuration: ''
    };
  }

  const legs = assignments.slice(0, -1);
  const totalDist = legs.reduce((sum, assignment) => sum + (assignment?.distanceInMilesToNextStop || 0), 0);
  const totalDur = legs.reduce((sum, assignment) => sum + (assignment?.timeInMinutesToNextStop || 0), 0);

  return {
    totalDistance: `${Math.max(totalDist, 1).toFixed(1)} mi`,
    totalDuration: `${Math.max(Math.round(totalDur), 1)} min`
  };
}

export function getRoutableAssignments(assignments: (Assignment | undefined)[]): Assignment[] {
  return assignments.filter((assignment): assignment is Assignment => Boolean(assignment?.pool?.coords));
}

export function preserveAssignmentOrders(reordered: Assignment[], previous: Assignment[]): Assignment[] {
  const reserved = previous.map((assignment) => assignment.order).sort((a, b) => a - b);
  return reordered.map((assignment, index) => ({
    ...assignment,
    order: reserved[index] ?? index + 1
  }));
}

export function applyHereRouteToAssignments(
  sourceAssignments: Assignment[],
  routeResult: HereRouteResult,
  originType: 'home' | 'first',
  destinationType: 'home' | 'last',
  optimize: boolean
): Assignment[] {
  const legOffset = originType === 'home' ? 1 : 0;
  let assignmentsToUpdate = sourceAssignments;

  if (optimize && routeResult.waypointOrder) {
    if (originType === 'home') {
      assignmentsToUpdate = routeResult.waypointOrder.map((originalIndex) => sourceAssignments[originalIndex]);
    } else {
      assignmentsToUpdate = [
        sourceAssignments[0],
        ...routeResult.waypointOrder.map((originalIndex) => sourceAssignments[originalIndex + 1]),
        ...(destinationType === 'last' ? [sourceAssignments[sourceAssignments.length - 1]] : [])
      ];
    }
  }

  return assignmentsToUpdate.map((assignment, index) => {
    const isLastAssignment = index === assignmentsToUpdate.length - 1;
    const shouldHaveNextStop = isLastAssignment ? destinationType === 'home' : true;
    const leg = shouldHaveNextStop ? routeResult.legs[index + legOffset] : undefined;

    return {
      ...assignment,
      timeInMinutesToNextStop: leg?.timeInMinutes ?? null,
      distanceInMilesToNextStop: leg?.distanceInMiles ?? null
    };
  });
}

export function reorderServicesByAssignments(services: Service[], assignments: Assignment[]): Service[] {
  const byAssignmentId = new Map<string, Service[]>();

  services.forEach((service) => {
    const assignmentId = service.assignment?.id ?? service.assignmentId;
    const list = byAssignmentId.get(assignmentId) ?? [];
    list.push(service);
    byAssignmentId.set(assignmentId, list);
  });

  const result: Service[] = [];
  assignments.forEach((assignment) => {
    const list = byAssignmentId.get(assignment.id);
    if (list?.length) {
      result.push(list.shift()!);
    }
  });
  byAssignmentId.forEach((list) => {
    result.push(...list);
  });

  return result;
}
