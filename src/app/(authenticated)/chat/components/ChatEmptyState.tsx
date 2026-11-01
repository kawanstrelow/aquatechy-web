'use client';

import { MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { BetaBadge } from './ChatBetaNotice';

type ChatEmptyStateProps = {
  onSuggestionClick: (prompt: string) => void;
};

export function ChatEmptyState({ onSuggestionClick }: ChatEmptyStateProps) {
  const t = useTranslations('chat');
  const suggestions = [
    t('suggestions.unpaidInvoices'),
    t('suggestions.servicesTomorrow'),
    t('suggestions.openRequests'),
    t('suggestions.findClient')
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#364D9D]/10">
        <MessageSquare className="h-6 w-6 text-[#364D9D]" />
      </div>
      <div className="flex items-center justify-center gap-2">
        <h2 className="text-xl font-semibold text-slate-900">{t('askAboutBusiness')}</h2>
        <BetaBadge />
      </div>
      <p className="mt-2 max-w-md text-sm text-slate-500">{t('emptyDescription')}</p>
      <div className="mt-8 grid w-full max-w-xl gap-2 sm:grid-cols-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestionClick(suggestion)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm text-slate-700 transition hover:border-[#364D9D]/40 hover:bg-[#364D9D]/5"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
