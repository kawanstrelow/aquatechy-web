import { Company } from '@/ts/interfaces/Company';
import { RecurringInvoiceDelivery } from '@/ts/interfaces/RecurringInvoiceTemplate';

export function isInvoiceSmsEnabled(company?: Company | null): boolean {
  return company?.preferences?.invoiceSettingsPreferences?.communication?.sendSms === true;
}

export function isEstimateSmsEnabled(company?: Company | null): boolean {
  return company?.preferences?.estimateSettingsPreferences?.communication?.sendSms === true;
}

export function getRecurringInvoiceDeliveryOptions(smsEnabled: boolean) {
  return [
    {
      key: RecurringInvoiceDelivery.SaveAsDraft,
      value: RecurringInvoiceDelivery.SaveAsDraft,
      name: 'Create invoices and save as draft'
    },
    {
      key: RecurringInvoiceDelivery.SendOnCreation,
      value: RecurringInvoiceDelivery.SendOnCreation,
      name: smsEnabled ? 'Create invoices and send invoice' : 'Create invoices and send e-mail'
    },
    {
      key: RecurringInvoiceDelivery.CreateOnly,
      value: RecurringInvoiceDelivery.CreateOnly,
      name: smsEnabled ? 'Create invoices only and do not send invoice' : 'Create invoices only and do not send e-mail'
    }
  ];
}
