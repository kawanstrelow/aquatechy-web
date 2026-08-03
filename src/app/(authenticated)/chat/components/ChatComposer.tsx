'use client';

import { ArrowUp, Loader2 } from 'lucide-react';
import { KeyboardEvent, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CompanyWithMyRole } from '@/ts/interfaces/Company';
import { cn } from '@/lib/utils';

import { CompanyScopeToggle } from './CompanyScopeToggle';

const MAX_CONTENT_LENGTH = 4000;

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  companies: CompanyWithMyRole[];
  selectedCompanyId: string | null;
  onCompanySelect: (companyId: string) => void;
  companyLocked: boolean;
};

export function ChatComposer({
  value,
  onChange,
  onSend,
  isSending,
  companies,
  selectedCompanyId,
  onCompanySelect,
  companyLocked
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && trimmed.length <= MAX_CONTENT_LENGTH && !isSending;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white px-3 py-3 sm:px-6">
      <div className="w-full">
        <div className="mb-2 flex items-center gap-2">
          <CompanyScopeToggle
            companies={companies}
            selectedCompanyId={selectedCompanyId}
            onSelect={onCompanySelect}
            disabled={isSending}
          />
          {companyLocked ? (
            <span className="text-[11px] text-slate-400">Changing company starts a new chat</span>
          ) : (
            <span className="text-[11px] text-slate-400">Company scope for this chat</span>
          )}
        </div>

        <div className="relative rounded-2xl border border-slate-200 bg-slate-50 shadow-sm focus-within:border-[#364D9D]/50 focus-within:ring-1 focus-within:ring-[#364D9D]/30">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about clients, invoices, services…"
            disabled={isSending}
            rows={1}
            className={cn(
              'min-h-[48px] resize-none border-0 bg-transparent py-3 pl-4 pr-14 text-sm shadow-none focus-visible:ring-0',
              'max-h-40'
            )}
          />
          <Button
            type="button"
            size="icon"
            disabled={!canSend}
            onClick={onSend}
            className="absolute bottom-2 right-2 h-9 w-9 rounded-full bg-[#364D9D] hover:bg-[#2d3f82] disabled:opacity-40"
            aria-label="Send message"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[11px] text-slate-400">
          Enter to send · Shift+Enter for a new line · Read-only assistant
        </p>
      </div>
    </div>
  );
}
