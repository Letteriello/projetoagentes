"use client";

import React, {
  useState,
  useRef,
  KeyboardEvent,
  ChangeEvent,
  FormEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, PaperclipIcon, X, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

interface StreamingInputAreaProps {
  onSubmit: (message: string, fileDataUri?: string) => void;
  isProcessing?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function StreamingInputArea({
  onSubmit,
  isProcessing = false,
  disabled = false,
  placeholder = "Digite sua mensagem...",
  className,
}: StreamingInputAreaProps) {
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_TEXTAREA_ROWS = 6; // Define max rows for textarea

  // Manipula mudanças no campo de entrada
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // Dynamic height adjustment
    const textarea = e.target;
    textarea.rows = 1; // Reset rows to 1 to correctly calculate scrollHeight
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10);
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

  // Manipula envio do formulário
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() && !fileDataUri) return;

    onSubmit(inputValue, fileDataUri || undefined);
    setInputValue("");
    setSelectedFile(null);
    setFileDataUri(null);
  };

  // Manipula tecla Enter para envio
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Manipula seleção de arquivo
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verifica se é um tipo de arquivo suportado
    if (!file.type.match(/^(image\/|application\/pdf|text\/)/)) {
      alert(
        "Tipo de arquivo não suportado. Por favor, selecione uma imagem, PDF ou arquivo de texto.",
      );
      return;
    }

    // Configura limite de tamanho (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert("O arquivo é muito grande. O tamanho máximo é 10MB.");
      return;
    }

    setSelectedFile(file);

    // Cria uma URL de dados para o arquivo
    const reader = new FileReader();
    reader.onload = () => {
      setFileDataUri(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove o arquivo selecionado
  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFileDataUri(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "border-t bg-background p-4 flex flex-col gap-2",
        className,
      )}
    >
      {/* Prévia de arquivo anexado */}
      {selectedFile && fileDataUri && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted">
          <div className="flex-1 flex items-center gap-2 text-sm truncate">
            {fileDataUri.startsWith("data:image/") ? (
              <img
                src={fileDataUri}
                alt="Preview"
                className="h-8 w-8 object-cover rounded"
              />
            ) : (
              <div className="h-8 w-8 flex items-center justify-center bg-primary/10 rounded">
                <PaperclipIcon className="h-4 w-4 text-primary" />
              </div>
            )}
            <span className="truncate">{selectedFile.name}</span>
            <span className="text-xs text-muted-foreground">
              ({Math.round(selectedFile.size / 1024)} KB)
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={removeSelectedFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Área de entrada */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing || disabled}
        >
          <PaperclipIcon className="h-5 w-5" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,text/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isProcessing || disabled}
          />
        </Button>

        <Textarea
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isProcessing || disabled}
          rows={1}
          className="flex-1 resize-none overflow-y-hidden"
        />

        <Button
          type="submit"
          disabled={
            (!inputValue.trim() && !fileDataUri) || isProcessing || disabled
          }
        >
          {isProcessing ? (
            <Spinner className="h-5 w-5" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </form>
  );
}
