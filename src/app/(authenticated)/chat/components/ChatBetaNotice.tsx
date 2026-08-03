'use client';

import { FlaskConical } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'ai-chat-beta-notice-seen';
const OPEN_EVENT = 'ai-chat-open-beta-notice';

export function openChatBetaNotice() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

type BetaBadgeProps = {
  className?: string;
};

export function BetaBadge({ className }: BetaBadgeProps) {
  return (
    <button
      type="button"
      onClick={openChatBetaNotice}
      className={cn('inline-flex shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#364D9D]', className)}
      aria-label="About AI Chat beta"
    >
      <Badge
        variant="secondary"
        className="cursor-pointer bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200"
      >
        Beta
      </Badge>
    </button>
  );
}

export function ChatBetaNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }

    const handleOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_EVENT, handleOpen);
  }, []);

  const markSeen = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore storage failures
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      markSeen();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-800">
              <FlaskConical className="h-4 w-4" />
            </span>
            AI Chat is in beta
          </DialogTitle>
          <DialogDescription className="pt-2 text-slate-600">
            This feature is still under development and may contain bugs or unexpected behavior. Answers can be
            incomplete or incorrect — please double-check important information before acting on it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" className="bg-[#364D9D] hover:bg-[#2d3f82]" onClick={() => handleOpenChange(false)}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
