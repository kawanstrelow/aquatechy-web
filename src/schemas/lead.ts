import { z } from 'zod';

import { ConvertLeadRequest, CreateLeadRequest, Lead, UpdateLeadRequest } from '@/ts/interfaces/Lead';

import { defaultSchemas } from './defaultSchemas';

export function phoneDigits(value?: string | null) {
  return (value ?? '').replace(/\D/g, '');
}

export function isBlankPhone(value?: string | null) {
  return phoneDigits(value).length <= 1;
}

function addContactIssues(data: { email?: string; phone?: string }, ctx: z.RefinementCtx) {
  const email = data.email?.trim() ?? '';
  const phoneBlank = isBlankPhone(data.phone);

  if (email && !z.string().email().safeParse(email).success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'validation.email.invalid',
      path: ['email']
    });
  }

  if (!phoneBlank && phoneDigits(data.phone).length !== 11) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'validation.phone.incomplete',
      path: ['phone']
    });
  }

  if (!email && phoneBlank) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'clients.errors.leadContactRequired',
      path: ['email']
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'clients.errors.leadContactRequired',
      path: ['phone']
    });
  }
}

export const createLeadSchema = z
  .object({
    companyOwnerId: z.string().min(1, { message: 'clients.errors.ownerRequired' }),
    firstName: defaultSchemas.firstName,
    lastName: defaultSchemas.lastName,
    address: defaultSchemas.address,
    addressLine2: z.string().trim().optional(),
    city: defaultSchemas.city,
    state: defaultSchemas.state,
    zip: defaultSchemas.zipCode,
    notes: z.string().trim().optional(),
    contactMethod: z.enum(['email', 'phone'], {
      required_error: 'clients.errors.chooseContact',
      invalid_type_error: 'clients.errors.chooseContact'
    }),
    email: z.string().trim().optional(),
    phone: z.string().trim().optional()
  })
  .superRefine((data, ctx) => {
    if (data.contactMethod === 'email') {
      const email = data.email?.trim() ?? '';
      if (!email || !z.string().email().safeParse(email).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: email ? 'validation.email.invalid' : 'validation.email.required',
          path: ['email']
        });
      }
      return;
    }

    if (isBlankPhone(data.phone) || phoneDigits(data.phone).length !== 11) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'validation.phone.incomplete',
        path: ['phone']
      });
    }
  });

export function buildUpdateLeadSchema(originalPhone?: string | null) {
  return z
    .object({
      firstName: defaultSchemas.firstName,
      lastName: defaultSchemas.lastName,
      address: defaultSchemas.address,
      addressLine2: z.string().trim().optional(),
      city: defaultSchemas.city,
      state: defaultSchemas.state,
      zip: defaultSchemas.zipCode,
      notes: z.string().trim().optional(),
      email: z.string().trim().optional(),
      phone: z.string().trim().optional()
    })
    .superRefine((data, ctx) => {
      const email = data.email?.trim() ?? '';
      const phoneBlank = isBlankPhone(data.phone);
      const phoneUnchanged = (data.phone ?? '').trim() === (originalPhone ?? '').trim();

      if (email && !z.string().email().safeParse(email).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'validation.email.invalid',
          path: ['email']
        });
      }

      if (!phoneBlank && !phoneUnchanged && phoneDigits(data.phone).length !== 11) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'validation.phone.incomplete',
          path: ['phone']
        });
      }

      if (!email && phoneBlank) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'clients.errors.leadContactRequired',
          path: ['email']
        });
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'clients.errors.leadContactRequired',
          path: ['phone']
        });
      }
    });
}

export const convertLeadSchema = z.object({
  email: defaultSchemas.email,
  phone: defaultSchemas.phone,
  city: defaultSchemas.city,
  state: z
    .string({ required_error: 'validation.state.required' })
    .trim()
    .length(2, { message: 'clients.errors.stateTwoLetters' }),
  zip: defaultSchemas.zipCode,
  clientType: z.enum(['Residential', 'Commercial'], {
    required_error: 'validation.clientType.required'
  }),
  address: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  invoiceEmail: z.union([z.literal(''), z.string().trim().email({ message: 'validation.email.invalid' })]).optional(),
  customerCode: z.string().trim().optional(),
  clientCompany: z.string().trim().optional()
});

export type CreateLeadFormValues = z.infer<typeof createLeadSchema>;
export type UpdateLeadFormValues = z.infer<ReturnType<typeof buildUpdateLeadSchema>>;
export type ConvertLeadFormValues = z.infer<typeof convertLeadSchema>;

function trimmed(value?: string | null) {
  return value?.trim() ?? '';
}

export function toCreateLeadRequest(values: CreateLeadFormValues): CreateLeadRequest {
  const request: CreateLeadRequest = {
    companyOwnerId: values.companyOwnerId,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    address: values.address.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    zip: values.zip.trim()
  };
  const email = trimmed(values.email);
  const addressLine2 = trimmed(values.addressLine2);
  const notes = trimmed(values.notes);

  if (values.contactMethod === 'email' && email) request.email = email;
  if (values.contactMethod === 'phone' && !isBlankPhone(values.phone) && values.phone) {
    request.phone = values.phone.trim();
  }
  if (addressLine2) request.addressLine2 = addressLine2;
  if (notes) request.notes = notes;

  return request;
}

export function toUpdateLeadRequest(lead: Lead, values: UpdateLeadFormValues): UpdateLeadRequest | null {
  const request: UpdateLeadRequest = {};
  const next = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    address: values.address.trim(),
    addressLine2: trimmed(values.addressLine2),
    notes: trimmed(values.notes),
    email: trimmed(values.email),
    phone: isBlankPhone(values.phone) ? '' : trimmed(values.phone)
  };
  const current = {
    firstName: lead.firstName ?? '',
    lastName: lead.lastName ?? '',
    address: lead.address ?? '',
    addressLine2: lead.addressLine2 ?? '',
    notes: lead.notes ?? '',
    email: lead.email ?? '',
    phone: lead.phone ?? ''
  };

  (Object.keys(next) as (keyof typeof next)[]).forEach((key) => {
    if (next[key] !== current[key]) {
      request[key] = next[key];
    }
  });

  return Object.keys(request).length > 0 ? request : null;
}

export function toConvertLeadRequest(values: ConvertLeadFormValues): ConvertLeadRequest {
  const request: ConvertLeadRequest = {
    email: values.email.trim(),
    phone: values.phone.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    zip: values.zip.trim(),
    clientType: values.clientType
  };
  const optional = {
    address: trimmed(values.address),
    addressLine2: trimmed(values.addressLine2),
    notes: trimmed(values.notes),
    invoiceEmail: trimmed(values.invoiceEmail),
    customerCode: trimmed(values.customerCode),
    clientCompany: trimmed(values.clientCompany)
  };

  (Object.keys(optional) as (keyof typeof optional)[]).forEach((key) => {
    if (optional[key]) {
      request[key] = optional[key];
    }
  });

  return request;
}
