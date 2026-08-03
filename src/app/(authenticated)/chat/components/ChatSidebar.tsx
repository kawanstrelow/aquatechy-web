'use client';

import { formatDistanceToNow } from 'date-fns';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AiConversation } from '@/ts/interfaces/AiChat';
import { cn } from '@/lib/utils';

type ChatSidebarProps = {
  conversations: AiConversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  isDeleting: boolean;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

export function ChatSidebar({
  conversations,
  activeConversationId,
  isLoading,
  isDeleting,
  onNewChat,
  onSelect,
  onDelete
}: ChatSidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-200 bg-white lg:w-[260px] lg:shrink-0">
      <div className="border-b border-slate-200 p-3">
        <Button type="button" className="w-full gap-2 bg-[#364D9D] hover:bg-[#2d3f82]" onClick={onNewChat}>
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {!isLoading && conversations.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-slate-400">No conversations yet</p>
        )}

        <ul className="space-y-0.5">
          {conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;
            return (
              <li key={conversation.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className={cn(
                    'w-full rounded-lg px-3 py-2.5 pr-9 text-left transition',
                    isActive ? 'bg-[#364D9D]/10 text-slate-900' : 'text-slate-700 hover:bg-slate-100'
                  )}
                >
                  <div className="truncate text-sm font-medium">{conversation.title?.trim() || 'New chat'}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                  </div>
                </button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      aria-label="Delete conversation"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the conversation from your history. You cannot undo this action.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => onDelete(conversation.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
