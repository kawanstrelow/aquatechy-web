'use client';

import { DollarSign, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';

import type { InvoiceListSummaryDollars } from '@/hooks/react-query/invoices/useGetInvoices';

interface InvoiceSummaryCardsProps {
  summary?: InvoiceListSummaryDollars | null;
}

export function InvoiceSummaryCards({ summary }: InvoiceSummaryCardsProps) {
  const totalInvoices = summary?.totalInvoices ?? 0;
  const totalAmount = summary?.totalAmount ?? 0;
  const paidCount = summary?.paid.count ?? 0;
  const paidAmount = summary?.paid.amount ?? 0;
  const unpaidCount = summary?.unpaid.count ?? 0;
  const unpaidAmount = summary?.unpaid.amount ?? 0;
  const overdueCount = summary?.overdue.count ?? 0;

  const cards = [
    {
      title: 'Total Invoices',
      value: totalInvoices.toString(),
      icon: FileText,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Amount',
      value: `$${totalAmount.toFixed(2)}`,
      icon: DollarSign,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Paid',
      value: paidCount.toString(),
      subValue: `$${paidAmount.toFixed(2)}`,
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Unpaid',
      value: unpaidCount.toString(),
      subValue: `$${unpaidAmount.toFixed(2)}`,
      icon: Clock,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Overdue',
      value: overdueCount.toString(),
      icon: AlertCircle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-lg ${card.bgColor} p-2`}>
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{card.value}</p>
              {card.subValue && (
                <p className="mt-1 text-sm text-gray-600">{card.subValue}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
