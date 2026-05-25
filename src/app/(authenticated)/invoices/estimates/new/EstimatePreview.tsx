'use client';

import { format } from 'date-fns';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { DetailedEstimate } from '../utils/estimateUiTypes';

interface EstimatePreviewProps {
  estimate: DetailedEstimate & {
    companyOwner?: {
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      addressLine2?: string;
    };
    clientAddress?: string;
    estimateNumber?: string;
  };
}

const statusOptions: Record<DetailedEstimate['status'], { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  sent: { label: 'Sent', className: 'bg-blue-100 text-blue-600' },
  accepted: { label: 'Accepted', className: 'bg-green-100 text-green-600' },
  declined: { label: 'Declined', className: 'bg-red-100 text-red-600' },
  expired: { label: 'Expired', className: 'bg-orange-100 text-orange-600' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-200 text-gray-700' }
};

export function EstimatePreview({ estimate }: EstimatePreviewProps) {
  const statusConfig = statusOptions[estimate.status] || {
    className: 'bg-gray-100 text-gray-600',
    label: estimate.status
  };

  const companyOwner = estimate.companyOwner;
  const companyAddress = companyOwner
    ? [
        companyOwner.address,
        companyOwner.addressLine2,
        [companyOwner.city, companyOwner.state, companyOwner.zip].filter(Boolean).join(', ')
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-[794px] bg-white shadow-lg" style={{ minHeight: '1123px' }}>
        <div className="p-12 md:p-16">
          <div className="mb-8 flex items-start justify-between border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{companyOwner?.name ?? estimate.companyName}</h1>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-900">ESTIMATE</h2>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">From</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <div className="font-semibold">{companyOwner?.name ?? estimate.companyName}</div>
                {companyAddress && <div className="whitespace-pre-line text-gray-600">{companyAddress}</div>}
                {companyOwner?.phone && <div>Phone: {companyOwner.phone}</div>}
                {companyOwner?.email && <div>Email: {companyOwner.email}</div>}
              </div>
            </div>

            <div className="text-right">
              <div className="mb-4 inline-block">
                <div
                  className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold ${statusConfig.className}`}
                >
                  {statusConfig.label}
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                {estimate.estimateNumber && (
                  <div>
                    <span className="font-semibold text-gray-500">Estimate Number:</span>{' '}
                    <span className="font-semibold text-gray-900">{estimate.estimateNumber}</span>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-gray-500">Issued Date:</span>{' '}
                  {format(new Date(estimate.issuedDate), 'MMM dd, yyyy')}
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Valid Until:</span>
                  {' '}
                  {format(new Date(estimate.validUntil), 'MMM dd, yyyy')}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">Prepared For</h3>
            <div className="space-y-1 text-sm text-gray-700">
              <div className="font-semibold text-gray-900">{estimate.clientName}</div>
              {estimate.clientAddress && (
                <div className="whitespace-pre-line text-gray-600">{estimate.clientAddress}</div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-300 bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Description</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Qty</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Unit Price</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimate.lineItems.length > 0 ? (
                  estimate.lineItems.map((item, index) => (
                    <TableRow key={index} className="border-gray-200">
                      <TableCell className="font-medium text-gray-900">
                        {item.description}
                        {item.sku && <span className="mt-1 block text-xs text-gray-500">SKU: {item.sku}</span>}
                      </TableCell>
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

          <div className="mb-8 flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between border-t border-gray-200 pt-2 text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold text-gray-900">${estimate.subtotal.toFixed(2)}</span>
              </div>
              {estimate.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-semibold text-gray-900">${estimate.taxAmount.toFixed(2)}</span>
                </div>
              )}
              {estimate.discountRate > 0 && estimate.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount ({estimate.discountRate.toFixed(2)}%):</span>
                  <span className="font-semibold text-gray-900">-${estimate.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-lg font-bold">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">${estimate.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {estimate.terms && (
            <div className="mb-6 border-t border-gray-200 pt-6">
              <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">Terms</h3>
              <p className="whitespace-pre-line text-sm text-gray-700">{estimate.terms}</p>
            </div>
          )}

          {estimate.notes && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">Notes</h3>
              <p className="whitespace-pre-line text-sm text-gray-700">{estimate.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
