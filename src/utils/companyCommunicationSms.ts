import { translateMessage } from '@/i18n/runtime';
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
      name: translateMessage('shell.createInvoicesSaveAsDraft', 'Create invoices and save as draft')
    },
    {
      key: RecurringInvoiceDelivery.SendOnCreation,
      value: RecurringInvoiceDelivery.SendOnCreation,
      name: smsEnabled
        ? translateMessage('shell.createInvoicesAndSendInvoice', 'Create invoices and send invoice')
        : translateMessage('shell.createInvoicesAndSendEmail', 'Create invoices and send e-mail')
    },
    {
      key: RecurringInvoiceDelivery.CreateOnly,
      value: RecurringInvoiceDelivery.CreateOnly,
      name: smsEnabled
        ? translateMessage('shell.createInvoicesOnlyDoNotSendInvoice', 'Create invoices only and do not send invoice')
        : translateMessage('shell.createInvoicesOnlyDoNotSendEmail', 'Create invoices only and do not send e-mail')
    }
  ];
}
