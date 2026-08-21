'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}

export function VideoModal({ isOpen, onClose, videoUrl, title }: VideoModalProps) {
  // Extract Vimeo video ID from URL
  const getVimeoId = (url: string) => {
    const match = url.match(/(?:vimeo.com\/)(\d+)/);
    return match ? match[1] : '';
  };

  const vimeoId = getVimeoId(videoUrl);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-[900px]"
        onEscapeKeyDown={onClose}
        onInteractOutside={onClose}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="aspect-video w-full">
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
            className="h-full w-full rounded-md"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
