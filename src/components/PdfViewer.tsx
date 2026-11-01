import { translateMessage } from '@/i18n/runtime';

interface PdfViewerProps {
  pdfData: Blob | null;
}

export function PdfViewer({ pdfData }: PdfViewerProps) {
  const url = pdfData ? URL.createObjectURL(pdfData) : '';

  return (
    <div className="h-screen w-full">
      {pdfData && (
        <iframe src={url} className="h-full w-full" title={translateMessage('shell.pdfViewer', 'PDF Viewer')} />
      )}
    </div>
  );
}
