import { z } from 'zod';

import { Frequency } from '@/ts/enums/enums';

import { defaultSchemas } from './defaultSchemas';

export const transferServiceSchema = z
  .object({
    scope: z.enum(['this_service', 'all_recurring']),
    serviceId: z.string().optional(),
    assignedToId: z
      .string({
        required_error: 'services.errors.technicianRequired',
        invalid_type_error: 'services.errors.technicianInvalid'
      })
      .trim()
      .min(1, { message: 'services.errors.technicianMin' }),
    scheduledTo: z.string().optional(),
    weekday: defaultSchemas.weekday.optional(),
    startOn: z.coerce
      .date({
        required_error: 'services.errors.startOnRequired',
        invalid_type_error: 'services.errors.startOnInvalid'
      })
      .optional(),
    endAfter: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.scope === 'this_service') {
      if (!data.serviceId || data.serviceId.trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'services.errors.serviceRequired', path: ['serviceId'] });
      }
      if (!data.scheduledTo || data.scheduledTo.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'services.errors.scheduledToRequired',
          path: ['scheduledTo']
        });
      }
      return;
    }

    if (!data.weekday) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'services.errors.weekdayRequired', path: ['weekday'] });
    }
    if (!data.startOn) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'services.errors.startOnRequired', path: ['startOn'] });
    }
    if (!data.endAfter || String(data.endAfter).trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'services.errors.endAfterRequired', path: ['endAfter'] });
    }
  });

export const batchTransferServiceSchema = z
  .object({
    scope: z.enum(['one_time', 'permanent']),
    assignedToId: z
      .string({
        required_error: 'services.errors.technicianRequired',
        invalid_type_error: 'services.errors.technicianInvalid'
      })
      .trim()
      .min(1, { message: 'services.errors.technicianMin' }),
    scheduledTo: z.string().optional(),
    weekday: defaultSchemas.weekday.optional(),
    startOn: z.coerce
      .date({
        required_error: 'services.errors.startOnRequired',
        invalid_type_error: 'services.errors.startOnInvalid'
      })
      .optional(),
    endAfter: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.scope === 'one_time') {
      if (!data.scheduledTo || data.scheduledTo.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'services.errors.scheduledToRequired',
          path: ['scheduledTo']
        });
      }
      return;
    }

    if (!data.weekday) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'services.errors.weekdayRequired', path: ['weekday'] });
    }
    if (!data.startOn) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'services.errors.startOnRequired', path: ['startOn'] });
    }
    if (!data.endAfter || String(data.endAfter).trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'services.errors.endAfterRequired', path: ['endAfter'] });
    }
  });

export const newServiceSchema = z
  .object({
    poolId: z
      .string({
        required_error: 'services.errors.poolRequired',
        invalid_type_error: 'services.errors.poolInvalid'
      })
      .trim()
      .min(1, { message: 'services.errors.poolMin' }),
    assignedToId: z
      .string({
        required_error: 'services.errors.technicianRequired',
        invalid_type_error: 'services.errors.technicianInvalid'
      })
      .trim()
      .min(1, { message: 'services.errors.technicianMin' }),
    scheduledTo: z.string().optional(),
    clientId: z
      .string({
        required_error: 'services.errors.clientRequired',
        invalid_type_error: 'services.errors.clientInvalid'
      })
      .trim()
      .min(1, { message: 'services.errors.clientMin' }),
    serviceTypeId: z
      .string({
        required_error: 'services.errors.serviceTypeRequired',
        invalid_type_error: 'services.errors.serviceTypeInvalid'
      })
      .trim()
      .min(1, { message: 'services.errors.serviceTypeMin' }),
    instructions: z.string().optional(),
    frequency: z.nativeEnum(Frequency, {
      required_error: 'services.errors.frequencyRequired',
      invalid_type_error: 'services.errors.frequencyInvalid'
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
      message: 'services.errors.oneTimeScheduledDateRequired',
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
      message: 'services.errors.recurringDatesRequired',
      path: ['startOn']
    }
  );
