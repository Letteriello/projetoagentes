// Componente AttachmentPopoverContent
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X, FileText, FileType as FileIcon, FileJson, FileBadge, FileCode2 } from 'lucide-react'; 
import { cn } from '@/lib/utils';

interface AttachmentPopoverContentProps {
  fileName: string;
  fileDataUri: string | null; 
  fileType?: string; 
  onRemoveAttachment: () => void;
}

export default function AttachmentPopoverContent({
  fileName,
  fileDataUri,
  fileType,
  onRemoveAttachment,
}: AttachmentPopoverContentProps) {
  const isImage = fileType?.startsWith('image/');

  const renderFilePreview = () => {
    if (isImage && fileDataUri) {
      return (
        <Image
          src={fileDataUri}
          alt={`Preview of ${fileName}`}
          layout="fill"
          objectFit="contain"
        />
      );
    }
    if (fileType === 'application/pdf') {
      return <FileIcon className="w-16 h-16 text-muted-foreground/70" />; 
    }
    if (fileType === 'text/plain') {
      return <FileText className="w-16 h-16 text-muted-foreground/70" />;
    }
    if (fileType === 'application/json') {
      return <FileJson className="w-16 h-16 text-muted-foreground/70" />;
    }
    if (fileType?.includes('csv') || fileType?.includes('excel') || fileType?.includes('spreadsheet')) {
        return <FileBadge className="w-16 h-16 text-muted-foreground/70" />; 
    }
    if (fileType?.startsWith('text/') || fileType?.includes('script') || fileType?.includes('code')) {
        return <FileCode2 className="w-16 h-16 text-muted-foreground/70" />;
    }
    return <FileIcon className="w-16 h-16 text-muted-foreground/70" />; 
  };

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
        {renderFilePreview()}
      </div>
      {/* <p className="text-xs text-muted-foreground mt-1.5 truncate">
        {fileType ? `Type: ${fileType}` : ''}
      </p> */}
    </div>
  );
}
