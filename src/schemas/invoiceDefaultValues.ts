import * as z from 'zod';

import { defaultSchemas } from './defaultSchemas';

const { notes } = defaultSchemas;

export const invoiceDefaultValuesSchema = z.object({
  paymentInstructions: z
    .string({
      invalid_type_error: 'invoices.errors.paymentInstructionsType'
    })
    .trim()
    .nullable()
    .optional(),
  notes: notes.nullable().optional(),
  defaultFrequency: z
    .enum(['Weekly', 'Monthly', 'Each2Months', 'Each3Months', 'Each4Months', 'Each6Months', 'Yearly'], {
      invalid_type_error: 'invoices.errors.defaultFrequencyType'
    })
    .nullable()
    .optional(),
  defaultPaymentTerm: z
    .enum(['OneDay', 'ThreeDays', 'SevenDays', 'FifteenDays', 'ThirtyDays', 'SixtyDays'], {
      invalid_type_error: 'invoices.errors.defaultPaymentTermType'
    })
    .nullable()
    .optional()
});

export const editInvoiceDefaultValuesSchema = z.object({
  paymentInstructions: z
    .string({
      invalid_type_error: 'invoices.errors.paymentInstructionsType'
    })
    .trim()
    .nullable()
    .optional(),
  notes: notes.nullable().optional(),
  defaultFrequency: z
    .enum(['Weekly', 'Monthly', 'Each2Months', 'Each3Months', 'Each4Months', 'Each6Months', 'Yearly'], {
      invalid_type_error: 'invoices.errors.defaultFrequencyType'
    })
    .nullable()
    .optional(),
  defaultPaymentTerm: z
    .enum(['OneDay', 'ThreeDays', 'SevenDays', 'FifteenDays', 'ThirtyDays', 'SixtyDays'], {
      invalid_type_error: 'invoices.errors.defaultPaymentTermType'
    })
    .nullable()
    .optional()
});
