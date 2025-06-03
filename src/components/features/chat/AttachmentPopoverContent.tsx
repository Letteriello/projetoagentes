// Componente AttachmentPopoverContent
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  X,
  FileText,
  FileType as FileIcon, // Default icon
  FileJson,
  FileBadge, // For CSV/Spreadsheet as per existing code
  FileCode2, // For Markdown or general code files
  // Explicitly adding FileSpreadsheet if FileBadge is not preferred for spreadsheets
  // For now, we'll stick to FileBadge as it's already in use.
  // If a specific PDF icon like FilePdf exists and is preferred, it would be imported here.
  // For now, FileText will be used for PDF as per instructions.
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const isImage = fileType?.startsWith("image/");

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
    // PDF Icon
    if (fileType === "application/pdf") {
      return <FileText className="w-16 h-16 text-muted-foreground/70" />; // Using FileText for PDF as per instruction
    }
    // CSV Icon (using FileBadge as per existing code, could be FileSpreadsheet)
    if (fileType === "text/csv" || fileType === "application/vnd.ms-excel" || fileType?.includes("spreadsheet")) {
      return <FileBadge className="w-16 h-16 text-muted-foreground/70" />;
    }
    // JSON Icon
    if (fileType === "application/json") {
      return <FileJson className="w-16 h-16 text-muted-foreground/70" />;
    }
    // TXT Icon
    if (fileType === "text/plain") {
      return <FileText className="w-16 h-16 text-muted-foreground/70" />;
    }
    // Markdown Icon
    if (fileType === "text/markdown") {
      return <FileCode2 className="w-16 h-16 text-muted-foreground/70" />;
    }
    // Fallback for other text-based or code-like files (as in original logic)
    if (fileType?.startsWith("text/") || fileType?.includes("script") || fileType?.includes("code")) {
      return <FileCode2 className="w-16 h-16 text-muted-foreground/70" />;
    }
    // Default Icon for any other recognized file types
    return <FileIcon className="w-16 h-16 text-muted-foreground/70" />;
  };

  return (
    <div className="p-3 bg-popover text-popover-foreground rounded-md shadow-xl border border-border w-64">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium truncate" title={fileName}>
          {fileName}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemoveAttachment}
          className="h-7 w-7 p-1"
        >
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
