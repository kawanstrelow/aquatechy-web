import { z } from 'zod';
import { dateSchema } from '@/schemas/date';

import { defaultSchemas } from './defaultSchemas';

export const transferAssignmentsSchema = z.object({
  assignmentToId: z
    .string({
      required_error: 'assignmentToId is required',
      invalid_type_error: 'assignmentToId must be a string'
    })
    .trim()
    .min(1, { message: 'assignmentToId must be at least 1 characters' }),
  weekday: defaultSchemas.weekday,
  isEntireRoute: z.boolean({
    required_error: 'isEntireRoute is required',
    invalid_type_error: 'isEntireRoute must be a boolean'
  }),
  scheduledTo: z.string().optional(),
  startOn: z.coerce
    .date({
      required_error: 'startOn is required',
      invalid_type_error: 'startOn must be a date'
    })
    .optional(),
  endAfter: z
    .string({
      required_error: 'endAfter is required',
      invalid_type_error: 'endAfter must be a string'
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
      message: 'Start on and end after are required',
      path: ['endAfter']
    }
  );

export const newAssignmentSchema = z
  .object({
    assignmentToId: z.string().min(1),
    poolId: z.string(),
    client: z.string(),
    serviceTypeId: z.string().min(1, 'Service type is required'),
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
      message: 'Scheduled date is required for one-time assignments',
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
      message: 'Start date and end date are required for recurring assignments',
      path: ['startOn']
    }
  );
