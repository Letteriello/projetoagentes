import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { genkitSessionService, Event, Session } from '@/services/GenkitSessionService';

export interface UseGenkitSessionOptions {
  initialSessionId?: string;
  onEvent?: (event: Event) => void;
  onError?: (error: Error) => void;
}

interface StreamingMessage {
  id: string;
  content: string;
  role: 'user' | 'model' | 'system' | 'tool';
  isPartial: boolean;
  timestamp: number;
}

export function useGenkitSession(options: UseGenkitSessionOptions = {}) {
  const [sessionId] = useState<string>(options.initialSessionId || uuidv4());
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [sessionState, setSessionState] = useState<Record<string, any>>({});
  const [error, setError] = useState<Error | null>(null);
  
  // Referências para evitar problemas de closure
  const messagesRef = useRef<StreamingMessage[]>(messages);
  const sessionStateRef = useRef<Record<string, any>>(sessionState);
  
  // Atualizar refs quando os estados mudam
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);
  
  /**
   * Processa um evento do Genkit e atualiza o estado do componente
   */
  const processEvent = useCallback((event: Event) => {
    // Notificar callback externo independente do tipo de evento
    if (options.onEvent) {
      options.onEvent(event);
    }
    
    // Processar eventos de ferramenta
    if (event.type === 'toolStart') {
      // Evento de início de execução de ferramenta
      const toolData = event.data || {};
      const toolMessage: StreamingMessage = {
        id: `tool-${toolData.name}-${Date.now()}`,
        content: `⚙️ Executando ferramenta: ${toolData.name || 'desconhecida'}`,
        role: 'tool',
        isPartial: true,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, toolMessage]);
      return;
    }
    
    if (event.type === 'toolComplete') {
      // Evento de conclusão de ferramenta
      const toolData = event.data || {};
      const toolResult = typeof toolData.result === 'object' 
        ? JSON.stringify(toolData.result, null, 2) 
        : String(toolData.result || '');
      
      // Atualizar a última mensagem da ferramenta, se for correspondente
      setMessages(prev => {
        const lastToolMessage = prev.findLast(m => 
          m.role === 'tool' && m.content.includes(`Executando ferramenta: ${toolData.name}`)
        );
        
        if (lastToolMessage) {
          return prev.map(m => 
            m.id === lastToolMessage.id 
              ? {
                ...m,
                content: `✅ Ferramenta ${toolData.name} concluída.\n\n**Resultado:**\n\`\`\`json\n${toolResult}\n\`\`\``,
                isPartial: false
              }
              : m
          );
        }
        
        // Se não encontrarmos a mensagem correspondente, adicionar nova mensagem
        return [...prev, {
          id: `tool-result-${toolData.name}-${Date.now()}`,
          content: `✅ Resultado da ferramenta ${toolData.name}:\n\`\`\`json\n${toolResult}\n\`\`\``,
          role: 'tool',
          isPartial: false,
          timestamp: Date.now()
        }];
      });
      
      return;
    }
    
    if (event.type === 'toolError') {
      // Evento de erro na execução da ferramenta
      const toolData = event.data || {};
      const errorMsg = toolData.error || 'Erro desconhecido';
      
      // Atualizar mensagem de ferramenta correspondente ou criar nova
      setMessages(prev => {
        const lastToolMessage = prev.findLast(m => 
          m.role === 'tool' && m.content.includes(`Executando ferramenta: ${toolData.name}`)
        );
        
        if (lastToolMessage) {
          return prev.map(m => 
            m.id === lastToolMessage.id 
              ? {
                ...m,
                content: `⚠️ Erro na ferramenta ${toolData.name}: ${errorMsg}`,
                isPartial: false
              }
              : m
          );
        }
        
        return [...prev, {
          id: `tool-error-${Date.now()}`,
          content: `⚠️ Erro na ferramenta ${toolData.name}: ${errorMsg}`,
          role: 'system',
          isPartial: false,
          timestamp: Date.now()
        }];
      });
      
      return;
    }
    
    // Ignorar eventos sem conteúdo para mensagens normais
    if (!event.content) return;
    
    // Extrair texto das partes do conteúdo para mensagens normais
    const text = event.content.parts
      .filter(part => part.text)
      .map(part => part.text)
      .join('');
    
    // Criar mensagem para a UI
    const role = event.content.role;
    
    // Verificar se é continuação de uma mensagem parcial anterior do mesmo tipo
    const lastMessage = messagesRef.current[messagesRef.current.length - 1];
    
    if (event.partial && lastMessage && lastMessage.isPartial && lastMessage.role === role) {
      // Atualizar mensagem parcial existente
      setMessages(messages => messages.map((msg, index) => {
        if (index === messages.length - 1) {
          return { 
            ...msg, 
            content: msg.content + text,
            timestamp: Date.now()
          };
        }
        return msg;
      }));
    } else {
      // Adicionar nova mensagem
      const newMessage: StreamingMessage = {
        id: uuidv4(),
        content: text,
        role,
        isPartial: !!event.partial,
        timestamp: Date.now()
      };
      
      setMessages(messages => [...messages, newMessage]);
    }
    
    // Processar ações do evento (como state_delta)
    if (event.actions) {
      for (const action of event.actions) {
        // Atualizar estado da sessão a partir de ações state_delta
        if (action.type === 'state_delta' && action.changes) {
          setSessionState(prevState => ({
            ...prevState,
            ...action.changes
          }));
        }
      }
    }
    
    // Finalizar mensagem se não for parcial
    if (!event.partial && lastMessage && lastMessage.isPartial) {
      setMessages(messages => messages.map((msg, index) => {
        if (index === messages.length - 1) {
          return { 
            ...msg, 
            isPartial: false
          };
        }
        return msg;
      }));
    }
  }, [options]);
  
  /**
   * Envia uma mensagem para o modelo e processa a resposta
   */
  const sendMessage = useCallback(async (
    input: string, 
    options: {
      modelId?: string;
      systemPrompt?: string;
      tools?: any[];
      temperature?: number;
      fileDataUri?: string;
    } = {}
  ) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Adicionar mensagem do usuário
      const userMessage: StreamingMessage = {
        id: uuidv4(),
        content: input,
        role: 'user',
        isPartial: false,
        timestamp: Date.now()
      };
      
      setMessages(messages => [...messages, userMessage]);
      
      // Verificar ferramentas configuradas
      const configuredTools = options.tools || [];
      if (configuredTools.length > 0) {
        console.log(`[Genkit] Configurando ${configuredTools.length} ferramentas:`, 
          configuredTools.map(t => t.name));
        
        // Atualizar estado com ferramentas disponíveis
        setSessionState(state => ({
          ...state,
          availableTools: configuredTools.map(tool => ({
            name: tool.name,
            description: tool.description
          }))
        }));
      }
      
      // Usar o método aprimorado com callback para processamento de eventos em tempo real
      await genkitSessionService.processUserInputWithCallback({
        sessionId,
        input,
        options,
        onEvent: (event) => {
          // Processar cada evento conforme é recebido
          processEvent(event);
        }
      });
      
      // Obter o estado atualizado da sessão após processamento completo
      const updatedState = genkitSessionService.getSessionState(sessionId);
      if (updatedState) {
        setSessionState(state => ({
          ...state,
          ...updatedState
        }));
      }
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      if (options.onError) {
        options.onError(error);
      }
      
      // Adicionar mensagem de erro
      const errorMessage: StreamingMessage = {
        id: uuidv4(),
        content: `Erro: ${error.message}`,
        role: 'system',
        isPartial: false,
        timestamp: Date.now()
      };
      
      setMessages(messages => [...messages, errorMessage]);
      
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, processEvent]);
  
  /**
   * Limpa as mensagens do chat
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  /**
   * Cria uma nova sessão
   */
  const createNewSession = useCallback(async () => {
    const session = await genkitSessionService.getOrCreateSession(uuidv4());
    setMessages([]);
    setSessionState({});
    return session;
  }, []);
  
  return {
    sessionId,
    messages,
    isProcessing,
    sessionState,
    error,
    sendMessage,
    clearMessages,
    createNewSession
  };
}