import * as z from 'zod';

import { defaultSchemas } from './defaultSchemas';

const { address, city, notes, state, zipCode, poolType } = defaultSchemas;

export const poolSchema = z.object({
  poolAddress: address,
  animalDanger: z.boolean({
    required_error: 'Animal danger is required.',
    invalid_type_error: 'Animal danger must be a boolean.'
  }),
  poolCity: city,
  enterSide: z
    .string({
      required_error: 'Enter side is required.',
      invalid_type_error: 'Enter side must be a string.'
    })
    .trim()
    .min(1, { message: 'Enter side must be at least 1 character.' })
    .optional(),
  lockerCode: z
    .string({
      required_error: "lockerCode field is required, even if it's null.",
      invalid_type_error: 'Locker code must be a string.'
    })
    .nullable()
    .optional(),

  poolNotes: notes,
  poolType: z.enum(['Chlorine', 'Salt', 'Other'], {
    required_error: 'poolType is required.',
    invalid_type_error: "Pool type must be 'Chlorine', 'Salt' or 'Other'."
  }),
  poolState: state,
  poolZip: zipCode,
  bodyOfWater: z
    .string({
      invalid_type_error: 'Body of water must be a string.'
    })
    .trim()
    .nullable()
    .optional(),
  estimatesConvertedFrom: z.number().int().optional()
});

export const editPoolSchema = z.object({
  poolId: z
    .string({
      required_error: 'poolId is required.',
      invalid_type_error: 'poolId must be a string.'
    })
    .trim()
    .min(1, { message: 'poolId must be at least 1 character.' }),
  address: address.optional(),
  city: city.optional(),
  enterSide: z
    .string({
      required_error: 'enterSide is required.',
      invalid_type_error: 'enterSide must be a string.'
    })
    .trim()
    .optional(),
  lockerCode: z
    .string({
      required_error: "lockerCode field is required, even if it's null.",
      invalid_type_error: 'lockerCode must be a string.'
    })
    .optional(),
  state: defaultSchemas.state.optional(),
  notes: notes.optional(),
  monthlyPayment: defaultSchemas.monthlyPayment.optional(),
  paymentUnit: defaultSchemas.paymentUnit.optional(),
  poolType: poolType.optional(),
  zip: defaultSchemas.zipCode.optional(),
  animalDanger: z.boolean().optional(),
  isActive: z.boolean().optional(),
  addressLine2: z.optional(z.string().trim()),
  bodyOfWater: z
    .string({
      invalid_type_error: 'Body of water must be a string.'
    })
    .trim()
    .nullable()
    .optional(),
  estimatesConvertedFrom: z.number().int().optional()
});
