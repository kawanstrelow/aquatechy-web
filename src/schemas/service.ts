import { z } from 'zod';

import { Frequency } from '@/ts/enums/enums';

import { defaultSchemas } from './defaultSchemas';

export const transferServiceSchema = z
  .object({
    scope: z.enum(['this_service', 'all_recurring']),
    serviceId: z.string().optional(),
    assignedToId: z
      .string({
        required_error: 'assignedToId is required.',
        invalid_type_error: 'assignedToId must be a string.'
      })
      .trim()
      .min(1, { message: 'assignedToId must be at least 1 character.' }),
    scheduledTo: z.string().optional(),
    weekday: defaultSchemas.weekday.optional(),
    startOn: z.coerce
      .date({
        required_error: 'startOn is required',
        invalid_type_error: 'startOn must be a date'
      })
      .optional(),
    endAfter: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.scope === 'this_service') {
      if (!data.serviceId || data.serviceId.trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'serviceId is required.', path: ['serviceId'] });
      }
      if (!data.scheduledTo || data.scheduledTo.trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'scheduledTo is required.', path: ['scheduledTo'] });
      }
      return;
    }

    if (!data.weekday) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Weekday is required.', path: ['weekday'] });
    }
    if (!data.startOn) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Start on is required', path: ['startOn'] });
    }
    if (!data.endAfter || String(data.endAfter).trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End after is required', path: ['endAfter'] });
    }
  });

export const batchTransferServiceSchema = z
  .object({
    scope: z.enum(['one_time', 'permanent']),
    assignedToId: z
      .string({
        required_error: 'assignedToId is required.',
        invalid_type_error: 'assignedToId must be a string.'
      })
      .trim()
      .min(1, { message: 'assignedToId must be at least 1 character.' }),
    scheduledTo: z.string().optional(),
    weekday: defaultSchemas.weekday.optional(),
    startOn: z.coerce
      .date({
        required_error: 'startOn is required',
        invalid_type_error: 'startOn must be a date'
      })
      .optional(),
    endAfter: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.scope === 'one_time') {
      if (!data.scheduledTo || data.scheduledTo.trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'scheduledTo is required.', path: ['scheduledTo'] });
      }
      return;
    }

    if (!data.weekday) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Weekday is required.', path: ['weekday'] });
    }
    if (!data.startOn) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Start on is required', path: ['startOn'] });
    }
    if (!data.endAfter || String(data.endAfter).trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End after is required', path: ['endAfter'] });
    }
  });

export const newServiceSchema = z
  .object({
    poolId: z
      .string({
        required_error: 'poolId is required.',
        invalid_type_error: 'poolId must be a string.'
      })
      .trim()
      .min(1, { message: 'poolId must be at least 1 character.' }),
    assignedToId: z
      .string({
        required_error: 'assignedToId is required.',
        invalid_type_error: 'assignedToId must be a string.'
      })
      .trim()
      .min(1, { message: 'assignedToId must be at least 1 character.' }),
    scheduledTo: z.string().optional(),
    clientId: z
      .string({
        required_error: 'clientId is required.',
        invalid_type_error: 'clientId must be a string.'
      })
      .trim()
      .min(1, { message: 'clientId must be at least 1 character.' }),
    serviceTypeId: z
      .string({
        required_error: 'serviceTypeId is required.',
        invalid_type_error: 'serviceTypeId must be a string.'
      })
      .trim()
      .min(1, { message: 'serviceTypeId must be at least 1 character.' }),
    instructions: z.string().optional(),
    frequency: z.nativeEnum(Frequency, {
      required_error: 'Frequency is required.',
      invalid_type_error: 'Frequency must be a valid option.'
    }),
    weekday: defaultSchemas.weekday.optional(),
    startOn: z.coerce.date().optional(),
    endAfter: z.string().optional()
  })
  .refine(
    (data) => {
      if (data.frequency === Frequency.ONCE) {
        return !!data.scheduledTo;
      }
      return true;
    },
    {
      message: 'Scheduled date is required for one-time services',
      path: ['scheduledTo']
    }
  )
  .refine(
    (data) => {
      if (data.frequency !== Frequency.ONCE) {
        return !!data.weekday && !!data.startOn && !!data.endAfter;
      }
      return true;
    },
    {
      message: 'Weekday, start date and end date are required for recurring services',
      path: ['startOn']
    }
  );
