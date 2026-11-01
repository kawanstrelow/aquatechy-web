import * as z from 'zod';

import { defaultSchemas } from './defaultSchemas';

const { address, city, notes, state, zipCode, volumeInGallons } = defaultSchemas;

export const poolSchema = z.object({
  poolAddress: address,
  animalDanger: z.boolean({
    required_error: 'clients.errors.animalDangerRequired',
    invalid_type_error: 'clients.errors.animalDangerBoolean'
  }),
  poolCity: city,
  enterSide: z
    .string({
      required_error: 'clients.errors.enterSideRequired',
      invalid_type_error: 'clients.errors.enterSideString'
    })
    .trim()
    .min(1, { message: 'clients.errors.enterSideMin' })
    .optional(),
  lockerCode: z
    .string({
      required_error: 'clients.errors.lockerCodeRequired',
      invalid_type_error: 'clients.errors.lockerCodeString'
    })
    .nullable()
    .optional(),

  poolNotes: notes,
  hasSaltSystem: z.enum(['true', 'false'], {
    required_error: 'clients.errors.saltSystemRequired',
    invalid_type_error: 'clients.errors.saltSystemYesNo'
  }),
  poolState: state,
  poolZip: zipCode,
  bodyOfWater: z
    .string({
      invalid_type_error: 'clients.errors.bodyOfWaterString'
    })
    .trim()
    .nullable()
    .optional(),
  volumeInGallons,
  estimatesConvertedFrom: z.number().int().optional()
});

const latitude = z
  .number({
    invalid_type_error: 'clients.errors.latitudeNumber'
  })
  .min(-90, { message: 'clients.errors.latitudeRange' })
  .max(90, { message: 'clients.errors.latitudeRange' });

const longitude = z
  .number({
    invalid_type_error: 'clients.errors.longitudeNumber'
  })
  .min(-180, { message: 'clients.errors.longitudeRange' })
  .max(180, { message: 'clients.errors.longitudeRange' });

export const editPoolSchema = z
  .object({
    poolId: z
      .string({
        required_error: 'clients.errors.poolIdRequired',
        invalid_type_error: 'clients.errors.poolIdString'
      })
      .trim()
      .min(1, { message: 'clients.errors.poolIdMin' }),
    address: address.optional(),
    city: city.optional(),
    enterSide: z
      .string({
        required_error: 'clients.errors.enterSideRequiredId',
        invalid_type_error: 'clients.errors.enterSideStringId'
      })
      .trim()
      .optional(),
    lockerCode: z
      .string({
        required_error: 'clients.errors.lockerCodeRequired',
        invalid_type_error: 'clients.errors.lockerCodeStringId'
      })
      .optional(),
    state: defaultSchemas.state.optional(),
    notes: notes.optional(),
    monthlyPayment: defaultSchemas.monthlyPayment.optional(),
    paymentUnit: defaultSchemas.paymentUnit.optional(),
    zip: defaultSchemas.zipCode.optional(),
    animalDanger: z.boolean().optional(),
    isActive: z.boolean().optional(),
    addressLine2: z.optional(z.string().trim()),
    bodyOfWater: z
      .string({
        invalid_type_error: 'clients.errors.bodyOfWaterString'
      })
      .trim()
      .nullable()
      .optional(),
    volumeInGallons: volumeInGallons.optional(),
    estimatesConvertedFrom: z.number().int().optional(),
    lat: latitude.optional(),
    lng: longitude.optional()
  })
  .superRefine((data, ctx) => {
    const hasLat = data.lat !== undefined;
    const hasLng = data.lng !== undefined;

    if (hasLat === hasLng) return;

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'clients.errors.latLngBoth',
      path: [hasLat ? 'lng' : 'lat']
    });
  });
