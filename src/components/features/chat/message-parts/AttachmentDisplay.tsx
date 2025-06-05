import React from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Download,
  FileText,
  FileJson,
  FileBadge,
  FileCode2,
  FileType as FileIcon,
} from "lucide-react";
import type { ChatMessageUI } from "@/types/chat"; // For message structure

interface AttachmentDisplayProps {
  message: Pick<ChatMessageUI, 'imageUrl' | 'fileName' | 'fileDataUri' | 'fileType' | 'sender'>;
  onDownload?: () => void; // Optional if download is handled internally or not always present
}

// Helper function to get the appropriate attachment icon (moved from ChatMessageDisplay)
const getAttachmentIcon = (fileType?: string, fileName?: string): React.FC<React.SVGProps<SVGSVGElement>> => {
  if (fileType) {
    if (fileType === "application/pdf") return FileText;
    if (fileType === "application/msword" || fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return FileText;
    if (fileType === "application/json") return FileJson;
    if (
      fileType === "text/javascript" ||
      fileType === "text/x-python" ||
      fileType === "application/xml" ||
      fileType === "text/css" ||
      fileType === "text/html" ||
      fileType === "text/markdown"
    ) return FileCode2;
    if (fileType === "text/csv" || fileType === "application/vnd.ms-excel" || fileType.includes("spreadsheet")) return FileBadge;
    if (fileType === "text/plain") return FileText;
    if (fileType.startsWith("text/") || fileType.includes("script") || fileType.includes("code")) return FileCode2;
  }
  if (fileName) {
    const lowerFileName = fileName.toLowerCase();
    if (lowerFileName.endsWith(".pdf")) return FileText;
    if (lowerFileName.endsWith(".doc") || lowerFileName.endsWith(".docx")) return FileText;
    if (lowerFileName.endsWith(".json")) return FileJson;
    if (
      lowerFileName.endsWith(".js") ||
      lowerFileName.endsWith(".py") ||
      lowerFileName.endsWith(".xml") ||
      lowerFileName.endsWith(".css") ||
      lowerFileName.endsWith(".html") ||
      lowerFileName.endsWith(".md")
    ) return FileCode2;
    if (lowerFileName.endsWith(".csv")) return FileBadge;
    if (lowerFileName.endsWith(".txt")) return FileText;
  }
  return FileIcon;
};

const AttachmentDisplay: React.FC<AttachmentDisplayProps> = ({ message, onDownload }) => {
  const isUser = message.sender === "user";

  if (message.imageUrl) {
    return (
      <div className="mt-2">
        <Image
          src={message.imageUrl}
          alt={message.fileName || "Imagem anexada"}
          width={300}
          height={200}
          className="rounded-md object-cover max-w-full h-auto"
        />
      </div>
    );
  }

  if (message.fileName) {
    return (
      <div
        className={cn(
          "mt-2 p-2.5 rounded-md flex items-center gap-2.5 text-sm",
          isUser ? "bg-primary/80" : "bg-muted/50 border border-border/30",
        )}
      >
        {React.createElement(getAttachmentIcon(message.fileType, message.fileName), {
          className: cn(
            "h-5 w-5 flex-shrink-0",
            isUser ? "text-primary-foreground/80" : "text-muted-foreground",
          ),
        })}
        <span className="truncate flex-1" title={message.fileName}>
          {message.fileName}
        </span>
        {message.fileDataUri && onDownload && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDownload}
            className={cn(
              "h-6 w-6 p-0",
              isUser
                ? "text-primary-foreground/80 hover:text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            title={`Download ${message.fileName}`}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return null; // No attachment to display
};

export default AttachmentDisplay;
