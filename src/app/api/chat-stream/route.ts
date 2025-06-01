import { NextRequest, NextResponse } from "next/server";

// Importando BasicChatInput para garantir compatibilidade de tipos
import { basicChatFlow, BasicChatInput } from "@/ai/flows/chat-flow";

// Interface estendida para uso interno no endpoint
interface ChatInput extends Partial<BasicChatInput> {
  conversationId?: string;
  messageId?: string;
  agentId?: string;
  [key: string]: any; // Para outras propriedades que possam existir
}

// Simple in-memory rate limiter instead of using @upstash/ratelimit and @vercel/kv
// This avoids TypeScript errors when these packages aren't installed
class SimpleRateLimiter {
  private requests: Record<string, { count: number; resetTime: number }> = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async limit(key: string) {
    const now = Date.now();
    
    if (!this.requests[key] || now > this.requests[key].resetTime) {
      this.requests[key] = {
        count: 1,
        resetTime: now + this.windowMs
      };
      return { 
        success: true, 
        limit: this.maxRequests, 
        remaining: this.maxRequests - 1,
        reset: this.requests[key].resetTime
      };
    }

    if (this.requests[key].count >= this.maxRequests) {
      return { 
        success: false, 
        limit: this.maxRequests, 
        remaining: 0,
        reset: this.requests[key].resetTime
      };
    }

    this.requests[key].count += 1;
    return { 
      success: true, 
      limit: this.maxRequests, 
      remaining: this.maxRequests - this.requests[key].count,
      reset: this.requests[key].resetTime
    };
  }
}

// Initialize simple rate limiter - 5 requests per 10 seconds
const ratelimit = new SimpleRateLimiter(10000, 5);

export async function POST(req: NextRequest) {
  // Extract IP from headers (X-Forwarded-For) or use a default
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';
  
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return new Response("Muitas solicitações. Por favor, tente novamente mais tarde.", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
      },
    });
  }

  try {
    const chatInput = (await req.json()) as ChatInput;

    // A validação foi movida para antes da chamada do basicChatFlow

    // Verificamos se userMessage existe para satisfazer o tipo BasicChatInput
    if (!chatInput.userMessage && chatInput.fileDataUri) {
      // Se temos um arquivo mas não uma mensagem, usamos uma mensagem padrão
      chatInput.userMessage = "Analisar este arquivo";
    } else if (!chatInput.userMessage && !chatInput.fileDataUri) {
      return NextResponse.json(
        { error: "Mensagem do usuário ou arquivo é obrigatório." },
        { status: 400 },
      );
    }
    
    const result = await basicChatFlow(chatInput as BasicChatInput);
    
    // Processamos o resultado para lidar com diferentes formatos de resposta
    if (typeof result === 'string') {
      // Se o resultado for uma string direta
      return new Response(result, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    } 
    // Se o resultado for um objeto com stream ou outras propriedades
    else if (typeof result === 'object') {
      if (result.stream) {
        // Converter o ReadableStream para texto
        let completeText = '';
        try {
          const reader = result.stream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // Assumindo que value é um chunk de texto
            completeText += typeof value === 'string' ? value : new TextDecoder().decode(value);
          }
          return new Response(completeText, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
            },
          });
        } catch (e) {
          console.error('Erro ao ler stream:', e);
          return NextResponse.json({ error: 'Erro ao processar o stream' }, { status: 500 });
        }
      } 
      else if (result.error) {
        // Retornar o erro
        return NextResponse.json({ error: result.error }, { status: 500 });
      } 
      else if (result.outputMessage) {
        // Retornar a mensagem de saída como resposta de texto simples
        return new Response(result.outputMessage, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      }
    }
    
    // Fallback para casos inesperados
    return NextResponse.json({ error: 'Nenhum conteúdo de resposta disponível' }, { status: 500 });

  } catch (error: any) {
    console.error("[API Chat Stream] Erro:", error);
    // Ensure a Response object is returned for errors as well
    return NextResponse.json(
      { error: error.message || "Ocorreu um erro inesperado." },
      { status: 500 },
    );
  }
}
