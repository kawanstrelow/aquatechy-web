import { z } from 'zod';

import { Frequency, IanaTimeZones } from '@/ts/enums/enums';

function commonStringSchema(field: string, min: number = 1) {
  return z
    .string({
      required_error: `validation.${field}.required`,
      invalid_type_error: `validation.${field}.invalidType`
    })
    .trim()
    .min(min, { message: `validation.${field}.min` });
}

export const defaultSchemas = {
  stringOptional: z.string().optional(),
  address: commonStringSchema('address'),
  clientAddressLine2: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  city: commonStringSchema('city'),
  email: z
    .string({
      required_error: 'validation.email.required'
    })
    .email({ message: 'validation.email.invalid' }),
  password: z.string().min(8, { message: 'validation.password.min' }),
  name: commonStringSchema('name', 2),
  firstName: commonStringSchema('firstName', 2),
  lastName: commonStringSchema('lastName', 2),
  company: commonStringSchema('company', 2),

  notes: z.string().trim().optional(),
  phone: z.string().length(17, { message: 'validation.phone.incomplete' }),
  state: commonStringSchema('state', 2),
  zipCode: z
    .string()
    .min(5, { message: 'validation.zipCode.min' })
    .regex(/^\d{5}(?:[-\s]?\d{4})?$/, 'validation.zipCode.invalid')
    .min(5, { message: 'validation.zipCode.min' }),
  language: z.enum(['English', 'Portuguese', 'Spanish'], {
    required_error: 'validation.language.required',
    invalid_type_error: 'validation.language.invalidType'
  }),
  monthlyPayment: z.number().nullable().optional(),
  paymentUnit: z.coerce.number().min(1, { message: 'validation.paymentUnit.min' }).optional(),
  volumeInGallons: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.coerce.number().int().min(1, { message: 'validation.volume.min' }).optional()
  ),
  clientType: z.enum(['Residential', 'Commercial'], {
    required_error: 'validation.clientType.required',
    invalid_type_error: 'validation.clientType.invalidType'
  }),
  weekday: z.enum(['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'], {
    required_error: 'validation.weekday.required',
    invalid_type_error: 'validation.weekday.invalidType'
  }),
  csvFile: z
    .any()
    .refine(
      (file) => {
        if (typeof File !== 'undefined' && file instanceof File) {
          return file.size < 7000000 && ['text/csv'].includes(file?.type);
        }
        return false; // Invalid if not running in the browser or if file is invalid
      },
      {
        message: 'validation.csvFile.invalid'
      }
    )
    .optional(),
  imageFile: z.array(
    z.any().refine(
      (file) => {
        if (typeof File !== 'undefined' && file instanceof File) {
          return file.size < 7000000 && ['image/jpeg', 'image/png'].includes(file?.type);
        }
        return false; // Invalid if not running in the browser or if file is invalid
      },
      {
        message: 'validation.imageFile.invalid'
      }
    )
  ),
  poolType: z.enum(['Salt', 'Chlorine', 'Other'], {
    required_error: 'validation.poolType.required',
    invalid_type_error: 'validation.poolType.invalidType'
  }),
  date: z.coerce.date(),
  timezone: z.nativeEnum(IanaTimeZones, {
    required_error: 'validation.timezone.required',
    invalid_type_error: 'validation.timezone.invalid'
  }),
  frequency: z.string(z.enum([Frequency.WEEKLY, Frequency.E2WEEKS, Frequency.E3WEEKS, Frequency.E4WEEKS])),
};
