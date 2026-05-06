'use client';

import { useMemo } from 'react';
import { Calendar, DollarSign, FileStack } from 'lucide-react';

import { RecurringInvoiceTemplate } from '@/hooks/react-query/invoices/useGetRecurringInvoiceTemplates';
import { RecurringInvoiceFrequency } from '@/ts/interfaces/RecurringInvoiceTemplate';

function occurrencesPerYear(frequency: RecurringInvoiceFrequency): number {
  switch (frequency) {
    case RecurringInvoiceFrequency.Weekly:
      return 52;
    case RecurringInvoiceFrequency.Monthly:
      return 12;
    case RecurringInvoiceFrequency.Each2Months:
      return 6;
    case RecurringInvoiceFrequency.Each3Months:
      return 4;
    case RecurringInvoiceFrequency.Each4Months:
      return 3;
    case RecurringInvoiceFrequency.Each6Months:
      return 2;
    case RecurringInvoiceFrequency.Yearly:
      return 1;
    default:
      return 0;
  }
}

interface RecurringInvoiceSummaryCardsProps {
  templates: RecurringInvoiceTemplate[];
}

export function RecurringInvoiceSummaryCards({ templates }: RecurringInvoiceSummaryCardsProps) {
  const { totalTemplates, totalMonthly, totalAnnual } = useMemo(() => {
    const totalTemplates = templates.length;

    let totalAnnual = 0;
    for (const t of templates) {
      const perYear = occurrencesPerYear(t.frequency);
      totalAnnual += (t.total ?? 0) * perYear;
    }
    const totalMonthly = totalAnnual / 12;

    return { totalTemplates, totalMonthly, totalAnnual };
  }, [templates]);

  const cards = [
    {
      title: 'Total recurring templates',
      value: totalTemplates.toString(),
      icon: FileStack,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total monthly payments',
      value: `$${totalMonthly.toFixed(2)}`,
      icon: DollarSign,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total annual payments',
      value: `$${totalAnnual.toFixed(2)}`,
      icon: Calendar,
      iconColor: 'text-violet-600',
      bgColor: 'bg-violet-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
