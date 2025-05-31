// Componente ChatMessageDisplay: Responsivo através de flexbox e max-width (max-w-[70%]) para o balão da mensagem,
// garantindo que as mensagens não ocupem a largura total em telas maiores e se ajustem bem em telas menores.
// Imagens também usam max-w-full para não excederem o contêiner.
// Importações de bibliotecas e componentes necessários.
import { Bot, User, Paperclip as PaperclipIcon, Download } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock"; // Componente para realce de sintaxe em blocos de código.
import { ChatMessageUI } from "@/types/chat"; // Tipo compartilhado para mensagens de chat.

// Interface para as props do componente ChatMessageDisplay.
// Define a estrutura esperada para uma mensagem de chat.
interface ChatMessageDisplayProps {
  message: ChatMessageUI; // Objeto da mensagem, incluindo se está sendo transmitida (isStreaming).
}

// Componente para exibir um cursor piscante, usado para indicar que o agente está digitando.
const BlinkingCursor = () => (
  <span className="inline-block w-0.5 h-4 bg-current animate-blink" />
);

// Componente principal para exibir uma única mensagem de chat.
// Responsável por renderizar o conteúdo da mensagem, incluindo texto, imagens e anexos de arquivo.
export default function ChatMessageDisplay({
  message,
}: ChatMessageDisplayProps) {
  const isUser = message.sender === "user"; // Verifica se o remetente é o usuário.
  const isAgent = message.sender === "agent"; // Verifica se o remetente é o agente.

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
          "p-3 rounded-lg max-w-[70%] shadow-sm", // max-w-[70%] ajuda na responsividade, evitando que o balão ocupe toda a largura.
          isUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-card text-card-foreground border border-border/50 rounded-bl-none",
        )}
      >
        {/* Seção para exibir a mensagem de texto usando ReactMarkdown. */}
        {message.text && (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]} // Plugin para suporte a GitHub Flavored Markdown.
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
                return (
                  <p>
                    {children}
                    {/* Adiciona o cursor piscante aqui, verificando message.isStreaming diretamente do objeto message */}
                    {isAgent && message.isStreaming && <BlinkingCursor />}
                  </p>
                );
              },
            }}
          >
            {message.text}
          </ReactMarkdown>
        )}
        {/* Seção para exibir imagens anexadas. */}
        {message.imageUrl && (
          <div className="mt-2">
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
              "mt-2 p-2.5 rounded-md flex items-center gap-2.5 text-sm",
              isUser ? "bg-primary/80" : "bg-muted/50 border border-border/30",
            )}
          >
            <PaperclipIcon
              className={cn(
                "h-4 w-4 flex-shrink-0",
                isUser ? "text-primary-foreground/80" : "text-muted-foreground",
              )}
            />
            <span className="truncate flex-1" title={message.fileName}>
              {message.fileName}
            </span>
            {/* Botão para baixar o arquivo, visível apenas se houver um URI de dados do arquivo. */}
            {message.fileDataUri && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload} // Aciona a função de download ao clicar.
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
      </div>
      {/* Ícone do usuário, exibido à direita se a mensagem for do usuário. */}
      {isUser && (
        <div className="flex-shrink-0 p-1.5 rounded-full bg-card border border-border/50 self-start">
          <User className="h-5 w-5 text-foreground" />
        </div>
      )}
    </div>
  );
}
// Fim do componente ChatMessageDisplay.
