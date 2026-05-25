'use client';

import { DollarSign, FileText, CheckCircle, Send, Clock } from 'lucide-react';

import { EstimateListRow } from '../utils/estimateUiTypes';

interface EstimateSummaryCardsProps {
  estimates: EstimateListRow[];
}

export function EstimateSummaryCards({ estimates }: EstimateSummaryCardsProps) {
  const totalEstimates = estimates.length;
  const totalAmount = estimates.reduce((sum, est) => sum + est.amount, 0);
  const draftCount = estimates.filter((est) => est.status === 'draft').length;
  const sentCount = estimates.filter((est) => est.status === 'sent').length;
  const acceptedCount = estimates.filter((est) => est.status === 'accepted').length;

  const acceptedAmount = estimates
    .filter((est) => est.status === 'accepted')
    .reduce((sum, est) => sum + est.amount, 0);

  const sentAmount = estimates
    .filter((est) => est.status === 'sent')
    .reduce((sum, est) => sum + est.amount, 0);

  const cards = [
    {
      title: 'Total Estimates',
      value: totalEstimates.toString(),
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
      title: 'Draft',
      value: draftCount.toString(),
      icon: Clock,
      iconColor: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
    {
      title: 'Sent',
      value: sentCount.toString(),
      subValue: sentCount > 0 ? `$${sentAmount.toFixed(2)}` : undefined,
      icon: Send,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Accepted',
      value: acceptedCount.toString(),
      subValue: acceptedCount > 0 ? `$${acceptedAmount.toFixed(2)}` : undefined,
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50'
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
              {card.subValue && <p className="mt-1 text-sm text-gray-600">{card.subValue}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
