'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { AiMessage } from '@/ts/interfaces/AiChat';
import { cn } from '@/lib/utils';

import { ChatEmptyState } from './ChatEmptyState';
import { ChatMessageContent } from './ChatMessageContent';

type ChatThreadProps = {
  messages: AiMessage[];
  isSending: boolean;
  pendingUserContent: string | null;
  onSuggestionClick: (prompt: string) => void;
};

export function ChatThread({ messages, isSending, pendingUserContent, onSuggestionClick }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const visibleMessages = messages.filter((m) => m.role === 'user' || m.role === 'assistant');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages.length, isSending, pendingUserContent]);

  const showEmpty = visibleMessages.length === 0 && !pendingUserContent;

  if (showEmpty) {
    return <ChatEmptyState onSuggestionClick={onSuggestionClick} />;
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6">
      <div className="flex w-full flex-col gap-4">
        {visibleMessages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div key={message.id} className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  isUser ? 'bg-[#364D9D] text-white' : 'border border-slate-200 bg-white text-slate-800 shadow-sm'
                )}
              >
                <ChatMessageContent content={message.content} />
              </div>
            </div>
          );
        })}

        {pendingUserContent && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl bg-[#364D9D] px-4 py-2.5 text-sm leading-relaxed text-white">
              <ChatMessageContent content={pendingUserContent} />
            </div>
          </div>
        )}

        {isSending && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
