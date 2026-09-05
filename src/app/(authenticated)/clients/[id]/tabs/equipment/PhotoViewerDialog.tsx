'use client';

import { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export type ViewingPhoto = {
  url: string;
  alt: string;
  index: number;
};

const PHOTO_DIALOG_PADDING = 48;
const PHOTO_DIALOG_CHROME_HEIGHT = 80;

function getDownloadFilename(url: string, index: number): string {
  try {
    const pathname = new URL(url).pathname;
    const base = pathname.split('/').pop() || '';
    if (base && /\.(jpe?g|png|gif|heic|webp)$/i.test(base)) return base;
  } catch {
    // ignore
  }
  return `equipment-photo-${index + 1}.jpg`;
}

async function downloadBlob(src: string, filename: string) {
  const res = await fetch(src, { mode: 'cors' });
  if (!res.ok) throw new Error('download failed');
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  link.rel = 'noopener';
  link.click();
  URL.revokeObjectURL(blobUrl);
}

interface PhotoViewerDialogProps {
  photo: ViewingPhoto | null;
  onClose: () => void;
}

export function PhotoViewerDialog({ photo, onClose }: PhotoViewerDialogProps) {
  const [photoDisplaySize, setPhotoDisplaySize] = useState<{ width: number; height: number } | null>(null);
  const [isDownloadingPhoto, setIsDownloadingPhoto] = useState(false);

  useEffect(() => {
    setPhotoDisplaySize(null);
  }, [photo?.url]);

  const handlePhotoLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    const maxImageWidth = window.innerWidth * 0.92 - PHOTO_DIALOG_PADDING * 2;
    const maxImageHeight = window.innerHeight * 0.88 - PHOTO_DIALOG_CHROME_HEIGHT;
    const scale = Math.min(1, maxImageWidth / naturalWidth, maxImageHeight / naturalHeight);

    setPhotoDisplaySize({
      width: Math.round(naturalWidth * scale),
      height: Math.round(naturalHeight * scale)
    });
  };

  const handleDownloadPhoto = async () => {
    if (!photo) return;
    setIsDownloadingPhoto(true);
    const filename = getDownloadFilename(photo.url, photo.index);
    try {
      await downloadBlob(photo.url, filename);
    } catch {
      try {
        await downloadBlob(`/api/proxy-image?url=${encodeURIComponent(photo.url)}`, filename);
      } catch {
        window.open(photo.url, '_blank', 'noopener');
      }
    } finally {
      setIsDownloadingPhoto(false);
    }
  };

  return (
    <Dialog open={!!photo} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="w-auto max-w-[95vw] gap-3 overflow-hidden p-6"
        style={photoDisplaySize ? { width: photoDisplaySize.width + PHOTO_DIALOG_PADDING } : undefined}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Photo</DialogTitle>
        </DialogHeader>
        {photo && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex min-h-[4rem] items-center justify-center">
              {!photoDisplaySize && <Loader2 className="h-8 w-8 animate-spin text-gray-400" />}
              <img
                src={photo.url}
                alt={photo.alt}
                onLoad={handlePhotoLoad}
                className={photoDisplaySize ? 'rounded-md' : 'invisible absolute h-0 w-0'}
                style={
                  photoDisplaySize
                    ? { width: photoDisplaySize.width, height: photoDisplaySize.height }
                    : undefined
                }
              />
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              disabled={isDownloadingPhoto || !photoDisplaySize}
              onClick={handleDownloadPhoto}
            >
              {isDownloadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isDownloadingPhoto ? 'Downloading...' : 'Download Photo'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
