// Componente MessageInputArea: Responsivo através de flexbox e classes de tamanho/padding.
// O Textarea se ajusta dinamicamente em altura (max-h-36) e os botões mantêm tamanho fixo.
import React, { useRef, useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Paperclip, SendHorizontal, Loader2 as Loader } from "lucide-react";
import AttachmentPopoverContent from "./AttachmentPopoverContent";
import { cn } from "@/lib/utils";

interface MessageInputAreaProps {
  formRef: React.RefObject<HTMLFormElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  selectedFile: File | null;
  selectedFileName: string;
  selectedFileDataUri: string | null;
  onRemoveAttachment: () => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  inputValue: string;
  onInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function MessageInputArea({
  formRef,
  inputRef,
  fileInputRef,
  onSubmit,
  isPending,
  selectedFile,
  selectedFileName,
  selectedFileDataUri,
  onRemoveAttachment,
  handleFileChange,
  inputValue,
  onInputChange,
}: MessageInputAreaProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const MAX_TEXTAREA_ROWS = 6; // Define max rows for textarea

  useEffect(() => {
    if (selectedFile) {
      setIsPopoverOpen(true);
    } else {
      setIsPopoverOpen(false);
    }
  }, [selectedFile]);

  const handleTextareaKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Enter" && !event.shiftKey && !isPending) {
      event.preventDefault();
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    }
  };

  const internalHandleChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    // Call the parent's handler to update inputValue
    onInputChange(event);

    // Dynamic height adjustment
    const textarea = event.target;
    textarea.rows = 1; // Reset rows to 1 to correctly calculate scrollHeight
    // Ensure line-height is properly computed. If it's 'normal', this might need a default.
    const computedStyle = getComputedStyle(textarea);
    let lineHeight = parseInt(computedStyle.lineHeight, 10);
    if (isNaN(lineHeight) && computedStyle.lineHeight === 'normal') {
      // Estimate line height if "normal" - this is an approximation
      // A more robust solution might involve a hidden div or ensuring CSS sets a specific line-height
      const fontSize = parseInt(computedStyle.fontSize, 10);
      lineHeight = Math.floor(fontSize * 1.2); // Common approximation for "normal"
    }


    const scrollHeight = textarea.scrollHeight;
    const newRows = Math.min(
      MAX_TEXTAREA_ROWS,
      Math.max(1, Math.floor(scrollHeight / lineHeight)),
    );
    textarea.rows = newRows;

    if (newRows >= MAX_TEXTAREA_ROWS) {
      textarea.style.overflowY = "auto";
    } else {
      textarea.style.overflowY = "hidden";
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="sticky bottom-0 flex items-end gap-2 p-3 border-t bg-background z-10"
    >
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="flex-shrink-0 relative group hover:border-primary/70 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
          >
            <Paperclip className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            {selectedFile && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-background" />
            )}
          </Button>
        </PopoverTrigger>
        {selectedFile && (
          <PopoverContent
            side="top"
            align="start"
            className="w-auto p-0 border-none shadow-none bg-transparent mb-1"
          >
            <AttachmentPopoverContent
              fileName={selectedFileName}
              fileDataUri={selectedFileDataUri}
              fileType={selectedFile.type}
              onRemoveAttachment={onRemoveAttachment}
            />
          </PopoverContent>
        )}
      </Popover>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,application/pdf,.txt,.csv,.json,.xml,.md,text/plain"
        disabled={isPending}
      />

      <div className="relative flex-1">
        <Textarea
          ref={inputRef}
          name="userInput"
          placeholder="Digite sua mensagem ou '/ ' para comandos..."
          rows={1}
          value={inputValue}
          onChange={internalHandleChange}
          onKeyDown={handleTextareaKeyDown}
          disabled={isPending}
          className="min-h-[44px] pr-12 resize-none overflow-y-hidden custom-scrollbar py-2.5 leading-tight"
        />
        {/* Character count or other indicators can go here if needed */}
      </div>

      <Button
        type="submit"
        size="icon"
        disabled={isPending || (!inputValue.trim() && !selectedFile)}
        className="flex-shrink-0 group transition-all duration-300 ease-out transform active:scale-95"
      >
        {isPending ? (
          <Loader className="h-5 w-5 animate-spin" />
        ) : (
          <SendHorizontal className="h-5 w-5 text-primary-foreground group-hover:text-primary-foreground/90 transition-colors" />
        )}
        <span className="sr-only">Enviar</span>
      </Button>
    </form>
  );
}
