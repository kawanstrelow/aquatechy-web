'use client';

import { format } from 'date-fns';
import { DetailedInvoice } from '../utils/fakeData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface InvoicePreviewProps {
  invoice: DetailedInvoice;
}

const statusOptions: Record<DetailedInvoice['status'], { label: string; className: string }> = {
  paid: {
    label: 'Paid',
    className: 'bg-green-100 text-green-600'
  },
  unpaid: {
    label: 'Unpaid',
    className: 'bg-yellow-100 text-yellow-600'
  },
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-600'
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-red-100 text-red-600'
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-gray-200 text-gray-700'
  }
};

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const statusConfig = statusOptions[invoice.status] || {
    className: 'bg-gray-100 text-gray-600',
    label: invoice.status
  };

  const companyOwner = invoice.companyOwner;

  // Format company address from invoice company owner only
  const companyAddress = companyOwner
    ? [
        companyOwner.address,
        companyOwner.addressLine2,
        [companyOwner.city, companyOwner.state, companyOwner.zip].filter(Boolean).join(', ')
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  // Format client address
  const clientAddress = invoice.clientAddress || '';

  return (
    <div className="flex justify-center p-4">
      {/* A4-sized container: 210mm x 297mm ≈ 794px x 1123px at 96dpi */}
      <div className="w-full max-w-[794px] bg-white shadow-lg" style={{ minHeight: '1123px' }}>
        <div className="p-12 md:p-16">
          {/* Header: Company Logo/Name and Invoice Title */}
          <div className="mb-8 flex items-start justify-between border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{companyOwner?.name ?? 'Company Name'}</h1>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
            </div>
          </div>

          {/* Company & Invoice Info: Two-column layout */}
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Left: Company Information (from invoice company owner) */}
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">From</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <div className="font-semibold">{companyOwner?.name ?? 'Company Name'}</div>
                {companyAddress && <div className="whitespace-pre-line text-gray-600">{companyAddress}</div>}
                {companyOwner?.phone && <div>Phone: {companyOwner.phone}</div>}
                {companyOwner?.email && <div>Email: {companyOwner.email}</div>}
              </div>
            </div>

            {/* Right: Invoice Details */}
            <div className="text-right">
              <div className="mb-4 inline-block">
                <div
                  className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold ${statusConfig.className}`}
                >
                  {statusConfig.label}
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div>
                  <span className="font-semibold text-gray-500">Invoice Number:</span>{' '}
                  <span className="font-semibold text-gray-900">{invoice.invoiceNumber}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Issued Date:</span>{' '}
                  {format(new Date(invoice.issuedDate), 'MMM dd, yyyy')}
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Due Date:</span>{' '}
                  {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                </div>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="mb-8">
            <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">Bill To</h3>
            <div className="space-y-1 text-sm text-gray-700">
              <div className="font-semibold text-gray-900">{invoice.clientName}</div>
              {clientAddress && <div className="whitespace-pre-line text-gray-600">{clientAddress}</div>}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-8">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-300 bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Description</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Quantity</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Unit Price</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lineItems.length > 0 ? (
                  invoice.lineItems.map((item, index) => (
                    <TableRow key={index} className="border-gray-200">
                      <TableCell className="font-medium text-gray-900">{item.description}</TableCell>
                      <TableCell className="text-right text-gray-700">{Number(item.quantity) || 0}</TableCell>
                      <TableCell className="text-right text-gray-700">
                        ${(Number(item.unitPrice) || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        ${(Number(item.amount) || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      No line items added yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totals: Right-aligned */}
          <div className="mb-8 flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between border-t border-gray-200 pt-2 text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold text-gray-900">${invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-semibold text-gray-900">${invoice.taxAmount.toFixed(2)}</span>
                </div>
              )}
              {invoice.discountRate &&
                invoice.discountRate > 0 &&
                invoice.discountAmount &&
                invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount ({invoice.discountRate.toFixed(2)}%):</span>
                    <span className="font-semibold text-gray-900">-${(invoice.discountAmount || 0).toFixed(2)}</span>
                  </div>
                )}
              <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-lg font-bold">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          {invoice.paymentTerms && (
            <div className="mb-6 border-t border-gray-200 pt-6">
              <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">Payment Terms</h3>
              <p className="text-sm text-gray-700">{invoice.paymentTerms}</p>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-6 border-t border-gray-200 pt-6">
              <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">Notes</h3>
              <p className="whitespace-pre-line text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}

          {/* Payment Instructions */}
          {invoice.paymentInstructions && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">Payment Instructions</h3>
              <p className="text-sm text-gray-700">{invoice.paymentInstructions}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
