import { z } from 'zod';
import { dateSchema } from '@/schemas/date';

import { defaultSchemas } from './defaultSchemas';

export const transferAssignmentsSchema = z
  .object({
    assignmentToId: z
      .string({
        required_error: 'routes.errors.technicianRequired',
        invalid_type_error: 'routes.errors.technicianInvalid'
      })
      .trim()
      .min(1, { message: 'routes.errors.technicianMin' }),
    weekday: defaultSchemas.weekday,
    isEntireRoute: z.boolean({
      required_error: 'routes.errors.entireRouteRequired',
      invalid_type_error: 'routes.errors.entireRouteInvalid'
    }),
    scheduledTo: z.string().optional(),
    startOn: z.coerce
      .date({
        required_error: 'routes.errors.startOnRequired',
        invalid_type_error: 'routes.errors.startOnInvalid'
      })
      .optional(),
    endAfter: z
      .string({
        required_error: 'routes.errors.endAfterRequired',
        invalid_type_error: 'routes.errors.endAfterInvalid'
      })
      .optional()
  })
  .refine(
    (data) => {
      // One-time transfers use scheduledTo; recurring transfers use startOn + endAfter
      if (data.scheduledTo && String(data.scheduledTo).trim() !== '') {
        return true;
      }
      return Boolean(data.startOn && data.endAfter && String(data.endAfter).trim() !== '');
    },
    {
      message: 'routes.errors.startOnAndEndAfterRequired',
      path: ['endAfter']
    }
  );

export const newAssignmentSchema = z
  .object({
    assignmentToId: z.string().min(1, { message: 'routes.errors.technicianRequired' }),
    poolId: z.string(),
    client: z.string(),
    serviceTypeId: z.string().min(1, 'routes.errors.serviceTypeRequired'),
    frequency: defaultSchemas.frequency,
    weekday: defaultSchemas.weekday,
    scheduledTo: z.string().optional(),
    startOn: z.coerce.date().optional(),
    endAfter: z.string().optional(),
    instructions: z.string().optional()
  })
  .refine(
    (data) => {
      // If frequency is ONCE, scheduledTo is required
      if (data.frequency === 'ONCE') {
        return !!data.scheduledTo;
      }
      return true;
    },
    {
      message: 'routes.errors.scheduledDateRequired',
      path: ['scheduledTo']
    }
  )
  .refine(
    (data) => {
      // If frequency is NOT ONCE, startOn and endAfter are required
      if (data.frequency !== 'ONCE') {
        return !!data.startOn && !!data.endAfter;
      }
      return true;
    },
    {
      message: 'routes.errors.recurringDatesRequired',
      path: ['startOn']
    }
  );
