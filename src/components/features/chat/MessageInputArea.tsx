// Componente MessageInputArea: Responsivo através de flexbox e classes de tamanho/padding.
// O Textarea se ajusta dinamicamente em altura (max-h-36) e os botões mantêm tamanho fixo.
import React, { useRef, useState, useEffect, ChangeEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Paperclip, SendHorizontal, Loader2 as Loader, Search, Sparkles, Code, Database, Globe, Bot } from "lucide-react";
import AttachmentPopoverContent from "./AttachmentPopoverContent";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast"; // Import toast

// Define validation constants
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
  'image/gif', // Example: add more types if needed
  'text/markdown',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface MessageInputAreaProps {
  formRef: React.RefObject<HTMLFormElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>, file?: File | null) => void; // Modified onSubmit
  isPending: boolean;
  // selectedFile, selectedFileName, selectedFileDataUri, onRemoveAttachment, handleFileChange are now internal
  inputValue: string;
  onInputChange: (event: React.ChangeEvent<HTMLTextAreaElement> | string) => void; // Modified onInputChange
}

// Lista de ferramentas disponíveis
const availableTools: Tool[] = [
  {
    id: "web-search",
    name: "Pesquisa na Web",
    icon: <Globe className="h-4 w-4" />,
    description: "Pesquisa na internet para encontrar informações atualizadas"
  },
  {
    id: "code-analysis",
    name: "Análise de Código",
    icon: <Code className="h-4 w-4" />,
    description: "Analisa e explica código fonte em detalhes"
  },
  {
    id: "data-analysis",
    name: "Análise de Dados",
    icon: <Database className="h-4 w-4" />,
    description: "Processa e analisa conjuntos de dados"
  },
  {
    id: "deep-research",
    name: "Pesquisa Profunda",
    icon: <Search className="h-4 w-4" />,
    description: "Realiza pesquisa detalhada sobre um tópico específico"
  },
  {
    id: "creative",
    name: "Modo Criativo",
    icon: <Sparkles className="h-4 w-4" />,
    description: "Gera conteúdo criativo e ideias inovadoras"
  },
  {
    id: "agent",
    name: "Assistente Especializado",
    icon: <Bot className="h-4 w-4" />,
    description: "Aciona um assistente especializado para tarefas específicas"
  },
];

export default function MessageInputArea({
  formRef,
  inputRef,
  fileInputRef,
  onSubmit,
  isPending,
  // selectedFile prop removed
  // selectedFileName prop removed
  // selectedFileDataUri prop removed
  // onRemoveAttachment prop removed
  // handleFileChange prop removed
  inputValue,
  onInputChange,
}: MessageInputAreaProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const MAX_TEXTAREA_ROWS = 6; // Define max rows for textarea

  // Internal state for attachments
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [selectedFileDataUri, setSelectedFileDataUri] = useState<string | null>(null);

  const handleFileChangeInternal = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      setSelectedFileName("");
      setSelectedFileDataUri(null);
      return;
    }

    // Type Validation
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: `Please select a valid file type. Allowed: ${ALLOWED_FILE_TYPES.join(', ')}.`,
        variant: 'destructive',
      });
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
      onRemoveAttachmentInternal(); // Clear any existing valid attachment
      return;
    }

    // Size Validation
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File Too Large',
        description: `Please select a file smaller than ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
        variant: 'destructive',
      });
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
      onRemoveAttachmentInternal(); // Clear any existing valid attachment
      return;
    }

    // If validations pass
    setSelectedFile(file);
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFileDataUri(reader.result as string);
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      toast({
        title: 'Error Reading File',
        description: 'Could not read the selected file.',
        variant: 'destructive',
      });
      onRemoveAttachmentInternal(); // Clear attachment state on error
    };
    reader.readAsDataURL(file);
  };

  const onRemoveAttachmentInternal = () => {
    setSelectedFile(null);
    setSelectedFileName("");
    setSelectedFileDataUri(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  };

  useEffect(() => {
    if (selectedFile) {
      setIsPopoverOpen(true);
    } else {
      setIsPopoverOpen(false);
    }
  }, [selectedFile]);

  const handleFormSubmitInternal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(event, selectedFile);
  };

  const handleTextareaKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Enter" && !event.shiftKey && !isPending) {
      event.preventDefault();
      if (formRef.current) {
        // Instead of requestSubmit, directly call our internal submit handler
        // or ensure the form's onSubmit calls handleFormSubmitInternal
        handleFormSubmitInternal(event as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  };

  const internalHandleChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
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

  // Função para selecionar uma ferramenta
  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    setIsToolsMenuOpen(false);
    
    // Foco no input após selecionar a ferramenta
    if (inputRef.current) {
      inputRef.current.focus();
      // Adiciona o comando da ferramenta no início do input
      const tool = availableTools.find(t => t.id === toolId);
      if (tool) {
        onInputChange({
          target: {
            value: `/${toolId} ${inputValue}`,
          },
        } as React.ChangeEvent<HTMLTextAreaElement>);
      }
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleFormSubmitInternal} // Use internal submit handler
      className="sticky bottom-0 flex items-end gap-2 p-3 border-t bg-background z-10"
    >
      {/* Menu de ferramentas */}
      <Popover open={isToolsMenuOpen} onOpenChange={setIsToolsMenuOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="flex-shrink-0 relative group hover:border-primary/70 transition-colors"
            onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
            disabled={isPending}
            title="Ferramentas"
          >
            <Sparkles className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            {selectedTool && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-background" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          className="w-60 p-0 border shadow-md bg-background"
        >
          <div className="p-2 border-b">
            <h3 className="text-sm font-medium">Ferramentas disponíveis</h3>
          </div>
          <div className="p-1 max-h-[300px] overflow-y-auto">
            {availableTools.map((tool) => (
              <Button
                key={tool.id}
                variant="ghost"
                className="w-full justify-start text-sm h-9 px-2 py-1 mb-1"
                onClick={() => handleToolSelect(tool.id)}
              >
                <div className="mr-2">{tool.icon}</div>
                <div className="flex flex-col items-start">
                  <span>{tool.name}</span>
                  <span className="text-xs text-muted-foreground">{tool.description}</span>
                </div>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Anexo de arquivos */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="flex-shrink-0 relative group hover:border-primary/70 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            title="Anexar arquivo"
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
              fileType={selectedFile?.type || ""}
              onRemoveAttachment={onRemoveAttachmentInternal}
            />
          </PopoverContent>
        )}
      </Popover>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChangeInternal} // Use internal file change handler
        className="hidden"
        accept={ALLOWED_FILE_TYPES.join(",")} // Update accept attribute
        disabled={isPending}
      />

      <div className="relative flex-1">
        <Textarea
          ref={inputRef}
          name="userInput"
          placeholder="Digite sua mensagem ou '/' para comandos..."
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
