'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import Image from 'next/image';
import { Plus, Trash2, Download, Loader2 } from 'lucide-react';

import { useUpdatePoolPhotos } from '@/hooks/react-query/pools/useUpdatePoolPhotos';
import { Pool } from '@/ts/interfaces/Pool';

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/jpg,image/gif,image/heic';

function getDownloadFilename(url: string, index: number): string {
  try {
    const pathname = new URL(url).pathname;
    const base = pathname.split('/').pop() || '';
    if (base && /\.(jpe?g|png|gif|heic)$/i.test(base)) return base;
  } catch {
    // ignore
  }
  return `pool-photo-${index + 1}.jpg`;
}

interface PhotosTabProps {
  pool: Pool;
  clientId: string;
}

export default function PhotosTab({ pool, clientId }: PhotosTabProps) {
  const t = useTranslations('clients');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  const { mutate: updatePoolPhotos, isPending } = useUpdatePoolPhotos();

  const photos = pool.photos ?? [];
  const isAdding = isPending && !deletingUrl;

  const handleAddPhotos = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const fileList = Array.from(files).filter((f) => f.size > 0);
    if (fileList.length === 0) return;
    updatePoolPhotos(
      { poolId: pool.id, clientId, newFiles: fileList },
      {
        onSettled: () => {
          e.target.value = '';
        }
      }
    );
  };

  const handleRemovePhoto = (url: string) => {
    setDeletingUrl(url);
    updatePoolPhotos({ poolId: pool.id, clientId, urlsToRemove: [url] }, { onSettled: () => setDeletingUrl(null) });
  };

  const handleDownloadPhoto = async (url: string, index: number) => {
    setDownloadingUrl(url);
    try {
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = getDownloadFilename(url, index);
      link.rel = 'noopener';
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank', 'noopener');
    } finally {
      setDownloadingUrl(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((url, index) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
          >
            <Image
              src={url}
              alt={t('photos.poolPhoto')}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />
            {deletingUrl === url && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => handleDownloadPhoto(url, index)}
                disabled={downloadingUrl === url}
                className="rounded-full bg-gray-800/90 p-1.5 text-white shadow-lg transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 disabled:opacity-50"
                aria-label={t('photos.download')}
              >
                {downloadingUrl === url ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleRemovePhoto(url)}
                className="rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50"
                disabled={isPending}
                aria-label={t('photos.delete')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {/* Add photo square - dotted border */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleAddPhotos}
            className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-gray-400 hover:bg-gray-100 disabled:opacity-50"
            disabled={isPending}
            aria-label={t('photos.add')}
          >
            {isAdding ? (
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            ) : (
              <Plus className="h-8 w-8 text-gray-400" />
            )}
          </button>
          <p className="text-sm font-medium text-gray-700">{isAdding ? t('shared.uploading') : t('shared.addPhoto')}</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {photos.length === 0 && !isAdding && <p className="text-sm text-gray-500">{t('photos.empty')}</p>}
    </div>
  );
}
