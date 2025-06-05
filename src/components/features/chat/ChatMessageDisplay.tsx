// Componente ChatMessageDisplay: Responsivo através de flexbox e max-width (max-w-[70%]) para o balão da mensagem,
// garantindo que as mensagens não ocupem a largura total em telas maiores e se ajustem bem em telas menores.
// Imagens também usam max-w-full para não excederem o contêiner.
// Importações de bibliotecas e componentes necessários.
import {
  Bot,
  User,
  Paperclip as PaperclipIcon, // Kept for potential future use or as a fallback if needed differently
  Download,
  FileText,
  FileJson,
  // FileBadge, FileCode2, FileType, FileText, FileJson, PaperclipIcon, Download moved to AttachmentDisplay
  Settings2,      // Added for tool calls
  CheckCircle2,   // Added for tool success
  XCircle,        // Added for tool error
  Info,           // Keep for Accordion trigger in verbose mode
} from "lucide-react";
// Image moved to AttachmentDisplay
import { Button } from "@/components/ui/button"; // Keep for Retry button
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
// ReactMarkdown, remarkGfm, rehypeRaw moved to MarkdownRenderer
// CodeBlock is imported from message-parts
import { ChatMessageUI } from "@/types/chat";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChatRunConfig } from "@/types/chat";

// Import new components
import MarkdownRenderer from "./message-parts/MarkdownRenderer";
import AttachmentDisplay from "./message-parts/AttachmentDisplay";
// CodeBlock already imported from ./message-parts/CodeBlock

interface ChatMessageDisplayProps {
  message: ChatMessageUI;
  onRegenerate?: (messageId: string) => void;
  isVerboseMode?: boolean;
}

// BlinkingCursor moved to MarkdownRenderer.tsx
// getAttachmentIcon moved to AttachmentDisplay.tsx

import { Skeleton } from "@/components/ui/skeleton";
import { useTypewriter } from "@/hooks/useTypewriter";

export default function ChatMessageDisplay({
  message,
  isVerboseMode,
}: ChatMessageDisplayProps) {
  const isUser = message.sender === "user";
  const isAgent = message.sender === "agent";

  const displayedMessageText = useTypewriter({
    text: message.text || "",
    isStreaming: !!message.isStreaming,
    isAgent: isAgent,
    speed: 30,
  });

  // const isUploadingAttachment = message.status === 'pending' && (!!message.imageUrl || !!message.fileName); // Removed as unused

  const handleDownload = () => {
    if (message.fileDataUri && message.fileName) {
      const link = document.createElement("a");
      link.href = message.fileDataUri;
      link.download = message.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div
      className={cn(
        "flex items-end gap-2.5 w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 p-1.5 rounded-full bg-card border border-border/50 self-start">
          <Bot className="h-5 w-5 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "p-3 rounded-lg max-w-[70%] shadow-sm", // max-w-[70%] ajuda na responsividade, evitando que o balão ocupe toda a largura.
          isUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-card text-card-foreground border border-border/50 rounded-bl-none",
        )}
      >
        <div className="flex flex-col"> {/* Wrapper for icon + text and details sections */}
          <div className="flex items-start"> {/* Flex container for icon (if any) and text */}
            {/* Icon for Tool Call */}
            {message.toolCall && (
              <Settings2 className="h-4 w-4 mr-2 self-center flex-shrink-0" />
            )}
            {/* Icon for Tool Response */}
            {message.toolResponse && message.toolResponse.status === 'success' && (
              <CheckCircle2 className="h-4 w-4 mr-2 self-center text-green-500 flex-shrink-0" />
            )}
            {message.toolResponse && message.toolResponse.status === 'error' && (
              <XCircle className="h-4 w-4 mr-2 self-center text-red-500 flex-shrink-0" />
            )}
            {/* Use MarkdownRenderer for text content */}
            {message.text && (
              <div className="flex-grow min-w-0">
                <MarkdownRenderer
                  content={displayedMessageText}
                  isStreaming={message.isStreaming}
                  isAgent={isAgent}
                />
              </div>
            )}
          </div>

          {/* Details for Tool Call Input */}
          {message.toolCall && message.toolCall.input && (
            <details className="mt-2 text-xs" open={isVerboseMode}>
              <summary className="cursor-pointer flex items-center gap-1">
                Input:
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {message.toolCall.name || 'Tool'}
                </Badge>
              </summary>
              <pre className="bg-muted p-2 rounded-md overflow-x-auto whitespace-pre-wrap break-all mt-1">
                {JSON.stringify(message.toolCall.input, null, 2)}
              </pre>
            </details>
          )}

          {/* Details for Tool Response Output (Success) */}
          {message.toolResponse && message.toolResponse.status === 'success' && message.toolResponse.output && (
            <details className="mt-2 text-xs" open={isVerboseMode}>
              <summary className="cursor-pointer flex items-center gap-1">
                Output:
                <Badge variant="default" className="text-xs px-1.5 py-0.5 bg-green-600 hover:bg-green-700 text-white">
                  {message.toolResponse.name || 'Tool'}
                </Badge>
              </summary>
              <pre className="bg-muted p-2 rounded-md overflow-x-auto whitespace-pre-wrap break-all mt-1">
                {typeof message.toolResponse.output === 'object' ? JSON.stringify(message.toolResponse.output, null, 2) : String(message.toolResponse.output)}
              </pre>
            </details>
          )}

          {/* Details for Tool Response Error */}
          {message.toolResponse && message.toolResponse.status === 'error' && message.toolResponse.errorDetails && (
            <details className="mt-2 text-xs" open={isVerboseMode}>
              <summary className="cursor-pointer flex items-center gap-1">
                Error:
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                  {message.toolResponse.name || 'Tool'}
                </Badge>
              </summary>
              <pre className="bg-muted p-2 rounded-md overflow-x-auto text-red-600 whitespace-pre-wrap break-all mt-1">
                {`Tool: ${message.toolResponse.name || 'N/A'}
Code: ${message.toolResponse.errorDetails.code || 'N/A'}
Message: ${message.toolResponse.errorDetails.message}${message.toolResponse.errorDetails.details ? `
Details: ${typeof message.toolResponse.errorDetails.details === 'object' ? JSON.stringify(message.toolResponse.errorDetails.details, null, 2) : message.toolResponse.errorDetails.details}` : ''}`}
              </pre>
            </details>
          )}
        </div>

        {/* Use AttachmentDisplay for images and files */}
        {(message.imageUrl || message.fileName) && (
          <AttachmentDisplay message={message} onDownload={handleDownload} />
        )}

        {/* Retrieved Context Display */}
        {message.role === 'assistant' && message.retrievedContext && isVerboseMode && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-xs hover:no-underline py-2">
                  <div className="flex items-center text-muted-foreground">
                    <Info size={14} className="mr-2" />
                    Retrieved Context (Verbose Mode)
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-xs bg-muted/30 p-3 rounded-md">
                  <pre className="whitespace-pre-wrap break-all">
                    {message.retrievedContext}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        {/* Display Applied Run Configurations in Verbose Mode */}
        {isVerboseMode && (message.appliedUserChatConfig || message.appliedTestRunConfig) && (
          <details className="mt-2 text-xs" open>
            <summary className="cursor-pointer italic text-gray-500">Applied Run Configuration</summary>
            {message.appliedUserChatConfig && (
              <>
                <h4 className="font-semibold mt-1 text-muted-foreground">User Chat Config:</h4>
                <pre className="bg-muted p-2 mt-1 rounded-md overflow-x-auto whitespace-pre-wrap break-all text-foreground">
                  {JSON.stringify(message.appliedUserChatConfig, null, 2)}
                </pre>
              </>
            )}
            {message.appliedTestRunConfig && (
              <>
                <h4 className="font-semibold mt-1 text-muted-foreground">Test Run Config:</h4>
                <pre className="bg-muted p-2 mt-1 rounded-md overflow-x-auto whitespace-pre-wrap break-all text-foreground">
                  {JSON.stringify(message.appliedTestRunConfig, null, 2)}
                </pre>
              </>
            )}
          </details>
        )}
      </div>
      {/* Ícone do usuário, exibido à direita se a mensagem for do usuário. */}
      {isUser && (
        <div className="flex-shrink-0 p-1.5 rounded-full bg-card border border-border/50 self-start">
          <User className="h-5 w-5 text-foreground" />
        </div>
      )}
      {/* Error display and retry button */}
      {message.status === "error" && !isUser && onRegenerate && (
        <div className="flex flex-col items-center ml-2 self-center"> {/* Adjusted to be outside the main message bubble for agent errors and vertically centered */}
          <XCircle className="h-5 w-5 text-red-500 mb-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRegenerate(message.id)} // Use the onRegenerate prop from ChatMessageDisplayProps
            className="text-xs px-2 py-1 h-auto" // Adjusted padding and height for a smaller button
          >
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
}
// Fim do componente ChatMessageDisplay.
