'use client';

import { ImagePlus, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AvatarEditor from 'react-avatar-editor';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const LOGO_ACCEPT = 'image/jpeg,image/jpg,image/png,image/gif,image/heic,.heic';

type CompanyLogoPickerProps = {
  value: File | null;
  onChange: (file: File | null) => void;
  companyName?: string;
  label?: string;
  className?: string;
};

export function CompanyLogoPicker({
  value,
  onChange,
  companyName = 'Company',
  label = 'Company logo',
  className
}: CompanyLogoPickerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const editorRef = useRef<AvatarEditor>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const handlePickClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setZoom(1);
      setDialogOpen(true);
    }
    event.target.value = '';
  };

  const handleSaveLogo = () => {
    if (editorRef.current && selectedImage) {
      const canvas = editorRef.current.getImageScaledToCanvas();
      canvas.toBlob((blob) => {
        if (blob) {
          const baseName = selectedImage.name.replace(/\.[^.]+$/, '') || 'logo';
          const file = new File([blob], `${baseName}.png`, { type: 'image/png' });
          onChange(file);
          setDialogOpen(false);
          setSelectedImage(null);
        }
      }, 'image/png');
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedImage(null);
      setZoom(1);
    }
  };

  const initials = companyName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className={cn('rounded-lg border border-dashed border-gray-200 bg-gray-50/60 p-4', className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-gray-900">{label}</p>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-200">
              Optional
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Shown on invoices, reports, and client emails. Square images work best.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handlePickClick}
          className={cn(
            'group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
            value
              ? 'border-transparent bg-white shadow-sm'
              : 'border-gray-300 bg-white hover:border-sky-400 hover:bg-sky-50/50'
          )}
          aria-label={value ? 'Change company logo' : 'Upload company logo'}
        >
          {value && previewUrl ? (
            <>
              <Avatar className="h-full w-full">
                <AvatarImage src={previewUrl} alt={`${companyName} logo`} className="object-cover" />
                <AvatarFallback className="text-lg">{initials || 'CO'}</AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <Upload className="h-5 w-5 text-white" />
              </span>
            </>
          ) : (
            <span className="flex flex-col items-center gap-1 text-gray-400 transition-colors group-hover:text-sky-600">
              <ImagePlus className="h-6 w-6" />
              <span className="text-[10px] font-medium uppercase tracking-wide">Upload</span>
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            {value ? (
              <>
                <p className="truncate text-sm font-medium text-gray-900">{value.name}</p>
                <p className="text-xs text-gray-500">Click the logo or use Change to crop a different image.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-900">Add your company logo</p>
                <p className="text-xs text-gray-500">JPG, PNG, GIF, or HEIC. You can crop and zoom before saving.</p>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept={LOGO_ACCEPT}
              onChange={handleFileChange}
            />
            <Button type="button" variant="outline" size="sm" onClick={handlePickClick}>
              <Upload className="mr-2 h-3.5 w-3.5" />
              {value ? 'Change logo' : 'Upload logo'}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-red-600"
                onClick={() => onChange(null)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{value ? 'Adjust company logo' : 'Crop company logo'}</DialogTitle>
            <DialogDescription>
              Drag to reposition and use zoom so your logo fills the circle cleanly.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-5 py-2">
            {selectedImage && (
              <>
                <div className="overflow-hidden rounded-full border bg-gray-100 shadow-sm">
                  <AvatarEditor
                    ref={editorRef}
                    image={selectedImage}
                    width={250}
                    height={250}
                    border={0}
                    borderRadius={125}
                    color={[0, 0, 0, 0.55]}
                    scale={zoom}
                    rotate={0}
                  />
                </div>

                <div className="w-full space-y-2 px-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">Zoom</span>
                    <span className="tabular-nums text-gray-500">{zoomPercent}%</span>
                  </div>
                  <Slider value={[zoom]} onValueChange={(v) => setZoom(v[0])} min={1} max={3} step={0.05} />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" type="button" onClick={() => handleDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveLogo} disabled={!selectedImage}>
              Use this logo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
