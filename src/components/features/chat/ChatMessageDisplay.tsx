// Componente ChatMessageDisplay: Responsivo através de flexbox e max-width (max-w-[70%]) para o balão da mensagem,
// garantindo que as mensagens não ocupem a largura total em telas maiores e se ajustem bem em telas menores.
// Imagens também usam max-w-full para não excederem o contêiner.
// Importações de bibliotecas e componentes necessários.
import {
  Bot,
  User,
  Download,
  FileText,
  FileJson,
  FileBadge, // Using FileBadge for CSV/Spreadsheet as per previous subtask consistency
  FileCode2,
  FileType as FileIcon, // Default file icon
  Settings2,      // Added for tool calls
  CheckCircle2,   // Added for tool success
  XCircle,        // Added for tool error
  AlertTriangle,  // Added for error messages
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Added import for Badge
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from 'rehype-raw';
import { CodeBlock } from "./CodeBlock"; // Componente para realce de sintaxe em blocos de código.
import { ChatMessageUI } from "@/types/chat"; // Tipo compartilhado para mensagens de chat.
import { useToast } from "@/hooks/use-toast"; // Added import for toast
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Added import for Accordion

// Interface para as props do componente ChatMessageDisplay.
// Define a estrutura esperada para uma mensagem de chat.
interface ChatMessageDisplayProps {
  message: ChatMessageUI; // Objeto da mensagem, que inclui appliedUserChatConfig and appliedTestRunConfig.
  onRegenerate?: (messageId: string) => void; // Função para tentar novamente o envio da mensagem.
  isVerboseMode?: boolean; // Added isVerboseMode prop
  // appliedUserChatConfig and appliedTestRunConfig are now part of message prop
}

// Componente para exibir um cursor piscante, usado para indicar que o agente está digitando.
const BlinkingCursor = () => (
  <span className="inline-block w-0.5 h-4 bg-current animate-blink" />
);

// Componente principal para exibir uma única mensagem de chat.
// Responsável por renderizar o conteúdo da mensagem, incluindo texto, imagens e anexos de arquivo.

import { Skeleton } from "@/components/ui/skeleton"; // Added import for Skeleton
import { useTypewriter } from "@/hooks/useTypewriter"; // Import the useTypewriter hook

// Helper function to get the appropriate attachment icon
const getAttachmentIcon = (fileType?: string, fileName?: string): React.FC<React.SVGProps<SVGSVGElement>> => {
  // Check by fileType first
  if (fileType) {
    // PDF
    if (fileType === "application/pdf") return FileText;
    // DOC/DOCX
    if (fileType === "application/msword" || fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return FileText;
    // JSON
    if (fileType === "application/json") return FileJson;
    // Code files
    if (
      fileType === "text/javascript" ||
      fileType === "text/x-python" ||
      fileType === "application/xml" ||
      fileType === "text/css" ||
      fileType === "text/html" ||
      fileType === "text/markdown"
    ) return FileCode2;
    // CSV/Spreadsheet
    if (fileType === "text/csv" || fileType === "application/vnd.ms-excel" || fileType.includes("spreadsheet")) return FileBadge;
    // Plain text
    if (fileType === "text/plain") return FileText;
    // Generic text/code catch-all
    if (fileType.startsWith("text/") || fileType.includes("script") || fileType.includes("code")) return FileCode2;
  }

  // Fallback based on extension if fileType is generic, missing, or not specific enough
  if (fileName) {
    const lowerFileName = fileName.toLowerCase();
    // PDF
    if (lowerFileName.endsWith(".pdf")) return FileText;
    // DOC/DOCX
    if (lowerFileName.endsWith(".doc") || lowerFileName.endsWith(".docx")) return FileText;
    // JSON
    if (lowerFileName.endsWith(".json")) return FileJson;
    // Code files
    if (
      lowerFileName.endsWith(".js") ||
      lowerFileName.endsWith(".py") ||
      lowerFileName.endsWith(".xml") ||
      lowerFileName.endsWith(".css") ||
      lowerFileName.endsWith(".html") ||
      lowerFileName.endsWith(".md")
    ) return FileCode2;
    // CSV
    if (lowerFileName.endsWith(".csv")) return FileBadge;
    // Plain text
    if (lowerFileName.endsWith(".txt")) return FileText;
  }

  return FileIcon; // Default icon
};

export default function ChatMessageDisplay({
  message,
  isVerboseMode, // Destructure isVerboseMode
}: ChatMessageDisplayProps) {
  const isUser = message.sender === "user"; // Verifica se o remetente é o usuário.
  const isAgent = message.sender === "agent"; // Verifica se o remetente é o agente.
  const { toast } = useToast(); // Initialize toast

  // Use the typewriter hook for agent's streaming messages
  const displayedMessageText = useTypewriter({
    text: message.text || "", // Ensure text is not undefined
    isStreaming: !!message.isStreaming, // Ensure isStreaming is boolean
    isAgent: isAgent,
    speed: 30, // Optional: adjust speed
  });

  const isUploadingAttachment = message.status === 'pending' && (!!message.imageUrl || !!message.fileName);

  // Função para lidar com o download de arquivos anexados.
  // Cria um link temporário e simula um clique para iniciar o download.
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
          "p-3 rounded-lg max-w-[70%] shadow-sm", // Base
          isUser
            ? "bg-primary text-primary-foreground rounded-br-none" // User style
            : "bg-card text-card-foreground border border-border/50 rounded-bl-none", // Agent/default style
          message.sender === 'system' && !message.isError && "message-bubble-system", // System specific, not error
          message.isError && "message-bubble-error" // Error specific, overrides others if conflicting props
        )}
      >
        <div className="flex flex-col"> {/* Wrapper for icon + text and details sections */}
          <div className="flex items-start"> {/* Flex container for icon (if any) and text */}
            {/* Icon for General Error */}
            {message.isError && !message.toolResponse && ( // Show general error icon if not a tool error (tool errors have their own XCircle)
              <AlertTriangle className="h-4 w-4 mr-2 self-center text-red-700 dark:text-red-300 flex-shrink-0" />
            )}
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
            {/* Seção para exibir a mensagem de texto usando ReactMarkdown. */}
            {message.text && (
              <div className="flex-grow min-w-0"> {/* Ensure text content can shrink and wrap */}
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]} // Plugin para suporte a GitHub Flavored Markdown.
                  rehypePlugins={[rehypeRaw]} // Added rehypeRaw
                  className="prose prose-sm dark:prose-invert max-w-none break-words prose-p:my-1 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2"
                  components={{
                    // Componente customizado para renderizar blocos de código com realce de sintaxe.
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <CodeBlock
                          language={match[1]}
                          value={String(children).replace(/\n$/, "")}
                          {...props}
                        />
                      ) : (
                        <code className={cn(className, "text-sm")} {...props}>
                          {children}
                        </code>
                      );
                    },
                    // Componente customizado para renderizar parágrafos.
                    // Adiciona o cursor piscante se a mensagem for do agente e estiver sendo transmitida.
                    p: ({ children }) => {
                      // The BlinkingCursor should only appear at the very end of the streaming message.
                      // We check if the displayed text is still shorter than the full text.
                      const showCursor = isAgent && message.isStreaming && displayedMessageText.length < (message.text || "").length;
                      return (
                        <p>
                          {children}
                          {showCursor && <BlinkingCursor />}
                        </p>
                      );
                    },
                  }}
                >
                  {displayedMessageText}
                </ReactMarkdown>
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

        {/* Seção para exibir imagens anexadas. */}
        {message.imageUrl && (
          <div className="mt-2"> {/* This mt-2 might need adjustment if details are present */}
            {/*
              IMPORTANT for Next.js Image optimization:
              If message.imageUrl can be an external URL, its hostname must be configured
              in next.config.js under images.domains or images.remotePatterns.
              e.g., images: { remotePatterns: [{ protocol: 'https', hostname: 'example.com' }] }
            */}
            <Image
              src={message.imageUrl}
              alt={message.fileName || "Imagem anexada"} // Texto alternativo para a imagem.
              width={300} // Largura da imagem.
              height={200} // Altura da imagem.
              className="rounded-md object-cover max-w-full h-auto" // Classes de estilo para a imagem. max-w-full e h-auto são importantes para responsividade.
            />
          </div>
        )}
        {/* Seção para exibir anexos de arquivo (que não são imagens). */}
        {message.fileName && !message.imageUrl && (
          <div
            className={cn(
              "mt-2 p-2.5 rounded-md flex items-center gap-2.5 text-sm", // This mt-2 might need adjustment
              isUser ? "bg-primary/80" : "bg-muted/50 border border-border/30",
            )}
          >
            {React.createElement(getAttachmentIcon(message.fileType, message.fileName), {
              className: cn(
                "h-5 w-5 flex-shrink-0", // Slightly larger icon for better visibility
                isUser ? "text-primary-foreground/80" : "text-muted-foreground",
              ),
            })}
            <span className="truncate flex-1" title={message.fileName}>
              {message.fileName}
            </span>
            {/* Botão para baixar o arquivo, visível apenas se houver um URI de dados do arquivo. */}
            {message.fileDataUri && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload} // Aciona o função de download ao clicar.
                className={cn(
                  "h-6 w-6 p-0", // Classes de estilo para o botão.
                  isUser
                    ? "text-primary-foreground/80 hover:text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Download className="h-4 w-4" /> {/* Ícone de download. */}
              </Button>
            )}
          </div>
        )}

        {/* Retrieved Context Display */}
        {message.role === 'assistant' && message.retrievedContext && isVerboseMode && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-xs hover:no-underline py-2">
                  <div className="flex items-center text-muted-foreground">
                    Retrieved Context
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

        {/* Quick Actions for Agent Messages */}
        {!isUser && message.text && ( // Also check if message.text is not empty
          <div className="mt-2 flex gap-2">
            <Button
              variant="outline"
              size="sm" // Using sm as xs might not be standard, with custom class for smaller size
              className="h-auto px-2 py-1 text-xs"
              onClick={() => {
                navigator.clipboard.writeText(message.text);
                toast({
                  title: "Resposta Copiada!",
                  description: "O conteúdo da mensagem foi copiado para a área de transferência.",
                });
              }}
            >
              Copiar Resposta
            </Button>
            <Button
              variant="outline"
              size="sm" // Using sm as xs might not be standard, with custom class for smaller size
              className="h-auto px-2 py-1 text-xs"
              onClick={() => console.log(`Gerar Nova Resposta clicked for message ID: ${message.id}`)}
            >
              Gerar Nova Resposta
            </Button>
            <Button
              variant="outline"
              size="sm" // Using sm as xs might not be standard, with custom class for smaller size
              className="h-auto px-2 py-1 text-xs"
              onClick={() => console.log(`Transferir para Humano clicked for message ID: ${message.id}`)}
            >
              Transferir para Humano
            </Button>
          </div>
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
