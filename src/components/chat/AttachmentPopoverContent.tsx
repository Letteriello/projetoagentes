// Componente AttachmentPopoverContent
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttachmentPopoverContentProps {
  fileName: string;
  fileDataUri: string;
  fileType?: string; // e.g., 'image/png'
  onRemoveAttachment: () => void;
}

export default function AttachmentPopoverContent({
  fileName,
  fileDataUri,
  fileType,
  onRemoveAttachment,
}: AttachmentPopoverContentProps) {
  const isImage = fileType?.startsWith('image/');

  return (
    <div className="p-3 bg-popover text-popover-foreground rounded-md shadow-xl border border-border w-64">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium truncate" title={fileName}>
          {fileName}
        </span>
        <Button variant="ghost" size="icon" onClick={onRemoveAttachment} className="h-7 w-7 p-1">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="relative w-full h-32 rounded-md overflow-hidden bg-muted/50 flex items-center justify-center">
        {isImage && fileDataUri ? (
          <Image
            src={fileDataUri}
            alt={`Preview of ${fileName}`}
            layout="fill"
            objectFit="contain"
          />
        ) : (
          <FileText className="w-16 h-16 text-muted-foreground/70" />
        )}
      </div>
      {/* <p className="text-xs text-muted-foreground mt-1.5 truncate">
        {fileType ? `Type: ${fileType}` : ''}
      </p> */} 
    </div>
  );
}
