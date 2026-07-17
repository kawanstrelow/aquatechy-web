import { z } from 'zod';

import { Frequency, IanaTimeZones } from '@/ts/enums/enums';

function commonStringSchema(message: string, min: number = 1) {
  return z
    .string({
      required_error: `${message} is required.`,
      invalid_type_error: `${message} must be a string.`
    })
    .trim()
    .min(min, { message: `${message} must be at least ${min} character.` });
}

export const defaultSchemas = {
  stringOptional: z.string().optional(),
  address: commonStringSchema('Address'),
  clientAddressLine2: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  city: commonStringSchema('City'),
  email: z
    .string({
      required_error: 'E-mail is required.'
    })
    .email({ message: 'Invalid e-mail.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  name: commonStringSchema('Name', 2),
  firstName: commonStringSchema('First name', 2),
  lastName: commonStringSchema('Last name', 2),
  company: commonStringSchema('Company', 2),

  notes: z.string().trim().optional(),
  phone: z.string().length(17, { message: 'Phone number is incomplete' }),
  state: commonStringSchema('State', 2),
  zipCode: z
    .string()
    .min(5, { message: 'Zip code must be at least 5 characters long' })
    .regex(/^\d{5}(?:[-\s]?\d{4})?$/, 'Invalid zip code')
    .min(5, { message: 'Zip code must be at least 5 characters long' }),
  language: z.enum(['English', 'Portuguese', 'Spanish'], {
    required_error: 'Language is required.',
    invalid_type_error: "Language must be 'English', 'Portuguese' or 'Spanish'."
  }),
  monthlyPayment: z.number().nullable().optional(),
  paymentUnit: z.coerce.number().min(1, { message: 'Payment unit must be 1 or higher.' }).optional(),
  volumeInGallons: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.coerce.number().int().min(1, { message: 'Volume must be greater than 0.' }).optional()
  ),
  clientType: z.enum(['Residential', 'Commercial'], {
    required_error: 'Client type is required.',
    invalid_type_error: "Client type must be 'Residential' or 'Company'."
  }),
  weekday: z.enum(['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'], {
    required_error: 'Weekday is required.',
    invalid_type_error: 'Weekday must be a string.'
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
        message: 'Invalid file or file must be less than 7MB and in .csv format.'
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
        message: 'Invalid image file or file must be less than 7MB and in .jpeg or .png format.'
      }
    )
  ),
  poolType: z.enum(['Salt', 'Chlorine', 'Other'], {
    required_error: 'Pool type is required.',
    invalid_type_error: "Pool type must be 'Salt', 'Chlorine' or 'Other'."
  }),
  date: z.coerce.date(),
  timezone: z.nativeEnum(IanaTimeZones, {
    required_error: 'Timezone is required.',
    invalid_type_error: 'Invalid timezone.'
  }),
  frequency: z.string(z.enum([Frequency.WEEKLY, Frequency.E2WEEKS, Frequency.E3WEEKS, Frequency.E4WEEKS])),
};
