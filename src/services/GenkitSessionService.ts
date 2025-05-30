import { v4 as uuidv4 } from 'uuid';
import { ai } from '@/ai/genkit';

// Tipos que simulam a estrutura do Genkit/ADK
export interface Session {
  id: string;
  state: Record<string, any>;
  history: Event[];
}

export interface EventAction {
  type: 'state_delta' | 'artifact_delta' | 'requested_auth_configs' | 'transfer_to_agent' | 'escalate' | 'is_final_response';
  changes?: Record<string, any>;
  authConfigs?: Array<any>;
  targetAgent?: string;
  artifacts?: Array<any>;
}

export interface Part {
  text?: string;
  function_call?: {
    name: string;
    arguments: Record<string, any>;
  };
  function_response?: {
    name: string;
    response: any;
  };
  executable_code?: {
    code: string;
    language: string;
  };
  code_execution_result?: {
    result: string;
  };
  inline_data?: {
    data: string;
    type: string;
  };
  file_data?: {
    name: string;
    data: string;
    type: string;
  };
}

export interface Content {
  parts: Part[];
  role: 'user' | 'model' | 'system' | 'tool';
}

export interface Event {
  content?: Content;
  actions?: EventAction[];
  partial?: boolean;
  turn_complete?: boolean;
}

/**
 * Serviço para gerenciar sessões Genkit e processamento de eventos
 */
export class GenkitSessionService {
  private sessions = new Map<string, Session>();
  
  /**
   * Cria uma nova sessão ou retorna uma existente
   */
  async getOrCreateSession(sessionId?: string): Promise<Session> {
    const id = sessionId || uuidv4();
    
    if (!this.sessions.has(id)) {
      const newSession: Session = {
        id,
        state: {},
        history: []
      };
      this.sessions.set(id, newSession);
    }
    
    return this.sessions.get(id)!;
  }
  
  /**
   * Processa a entrada do usuário e retorna um stream de eventos
   */
  async *processUserInput(
    sessionId: string, 
    input: string, 
    options: {
      modelId?: string;
      systemPrompt?: string;
      tools?: any[];
      temperature?: number;
      fileDataUri?: string;
    } = {}
  ): AsyncGenerator<Event> {
    // Obter ou criar sessão
    const session = await this.getOrCreateSession(sessionId);
    
    // Construir a mensagem do usuário
    const userMessageContent: Part[] = [{ text: input }];
    
    // Adicionar arquivo de mídia se fornecido
    if (options.fileDataUri) {
      const [header, base64Data] = options.fileDataUri.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1];
      if (mimeType && base64Data) {
        userMessageContent.push({ 
          inline_data: {
            data: options.fileDataUri,
            type: mimeType
          }
        });
      }
    }
    
    // Construir o histórico para o modelo
    const modelHistory = [];
    
    // Adicionar prompt de sistema se existir
    if (options.systemPrompt) {
      modelHistory.push({
        role: 'system',
        content: [{ text: options.systemPrompt }]
      });
    }
    
    // Adicionar mensagens anteriores do histórico
    if (session.history.length > 0) {
      // Converter eventos anteriores em formato adequado para o modelo
      for (const event of session.history) {
        if (event.content) {
          modelHistory.push({
            role: event.content.role,
            content: event.content.parts
          });
        }
      }
    }
    
    // Adicionar a mensagem atual do usuário
    modelHistory.push({
      role: 'user',
      content: userMessageContent
    });
    
    // Evento da mensagem do usuário para armazenar no histórico da sessão
    const userEvent: Event = {
      content: {
        parts: userMessageContent.map(part => part),
        role: 'user'
      }
    };
    
    // Adicionar evento do usuário ao histórico da sessão
    session.history.push(userEvent);
    
    try {
      // Configurar opções do modelo
      const modelConfig = {
        temperature: options.temperature || 0.7
      };
      
      console.log('Gerando conteúdo com modelo:', 
        options.modelId || 'default', 
        'config:', modelConfig,
        'tools:', options.tools ? options.tools.map(t => t.name) : 'none'
      );
      
      // Chamar o modelo com streaming
      const response = await ai.generate({
        model: options.modelId || 'googleai/gemini-1.5-flash-latest',
        messages: modelHistory,
        tools: options.tools || [],
        config: modelConfig,
        stream: true
      });
      
      if (response.stream) {
        const reader = response.stream.getReader();
        
        // Acumulador para construir a resposta completa
        let accumulatedText = '';
        let isFirstChunk = true;
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            // Construir um evento parcial
            const chunkText = value?.text || '';
            accumulatedText += chunkText;
            
            const partialEvent: Event = {
              content: {
                parts: [{ text: chunkText }],
                role: 'model'
              },
              partial: !done,
              actions: []
            };
            
            // Adicionar ação de state_delta no primeiro chunk para refletir a interação
            if (isFirstChunk) {
              isFirstChunk = false;
              
              partialEvent.actions = [
                {
                  type: 'state_delta',
                  changes: { 
                    lastUserMessage: input,
                    lastInteractionTime: new Date().toISOString(),
                    messageCount: (session.state.messageCount || 0) + 1
                  }
                }
              ];
              
              // Aplicar as mudanças ao estado da sessão
              session.state = {
                ...session.state,
                lastUserMessage: input,
                lastInteractionTime: new Date().toISOString(),
                messageCount: (session.state.messageCount || 0) + 1
              };
            }
            
            // Yield do evento parcial
            yield partialEvent;
          }
        } catch (e) {
          console.error('Erro durante o streaming:', e);
          
          // Yield um evento de erro
          yield {
            content: {
              parts: [{ text: `Erro: ${e instanceof Error ? e.message : String(e)}` }],
              role: 'model'
            },
            actions: []
          };
        } finally {
          reader.releaseLock();
          
          // Evento final com a resposta completa
          const finalEvent: Event = {
            content: {
              parts: [{ text: accumulatedText }],
              role: 'model'
            },
            turn_complete: true,
            actions: [
              {
                type: 'is_final_response'
              }
            ]
          };
          
          // Adicionar evento final ao histórico da sessão
          session.history.push(finalEvent);
          
          yield finalEvent;
        }
      } else {
        // Fallback para resposta não-streaming
        const modelEvent: Event = {
          content: {
            parts: [{ text: response.text || 'Sem resposta do modelo.' }],
            role: 'model'
          },
          turn_complete: true,
          actions: [
            {
              type: 'state_delta',
              changes: { 
                lastUserMessage: input,
                lastInteractionTime: new Date().toISOString(),
                messageCount: (session.state.messageCount || 0) + 1
              }
            },
            {
              type: 'is_final_response'
            }
          ]
        };
        
        // Aplicar as mudanças ao estado da sessão
        session.state = {
          ...session.state,
          lastUserMessage: input,
          lastInteractionTime: new Date().toISOString(),
          messageCount: (session.state.messageCount || 0) + 1
        };
        
        // Adicionar evento ao histórico da sessão
        session.history.push(modelEvent);
        
        // Yield do evento completo
        yield modelEvent;
      }
    } catch (e) {
      console.error("Erro ao processar entrada do usuário:", e);
      
      // Yield um evento de erro
      const errorEvent: Event = {
        content: {
          parts: [{ text: `Erro: ${e instanceof Error ? e.message : String(e)}` }],
          role: 'model'
        },
        turn_complete: true,
        actions: [
          {
            type: 'is_final_response'
          }
        ]
      };
      
      // Adicionar evento de erro ao histórico da sessão
      session.history.push(errorEvent);
      
      yield errorEvent;
    }
  }
  
  /**
   * Processa ações de eventos e atualiza o estado da sessão
   */
  processEventActions(sessionId: string, event: Event): void {
    const session = this.sessions.get(sessionId);
    if (!session || !event.actions || event.partial) return;
    
    for (const action of event.actions) {
      // Processar state_delta
      if (action.type === 'state_delta' && action.changes) {
        session.state = {
          ...session.state,
          ...action.changes
        };
      }
      
      // Aqui adicionaríamos lógica para processar outros tipos de ações
      // como artifact_delta, requested_auth_configs, etc.
    }
  }
  
  /**
   * Retorna o estado atual da sessão
   */
  getSessionState(sessionId: string): Record<string, any> | null {
    const session = this.sessions.get(sessionId);
    return session ? session.state : null;
  }
  
  /**
   * Retorna o histórico de eventos da sessão
   */
  getSessionHistory(sessionId: string): Event[] | null {
    const session = this.sessions.get(sessionId);
    return session ? session.history : null;
  }
}

// Singleton para uso em toda a aplicação
export const genkitSessionService = new GenkitSessionService();  /**
   * Processa eventos gerados durante a interação com o modelo
   * Ideal para processamento síncrono de eventos com callback
   */
  async processUserInputWithCallback({
    sessionId, 
    input,
    options = {},
    onEvent
  }: {
    sessionId: string;
    input: string;
    options?: {
      modelId?: string;
      systemPrompt?: string;
      tools?: any[];
      temperature?: number;
      fileDataUri?: string;
    };
    onEvent: (event: Event) => void;
  }): Promise<void> {
    try {
      // Se existirem ferramentas configuradas, registre-as no estado da sessão
      if (options.tools && options.tools.length > 0) {
        const session = await this.getOrCreateSession(sessionId);
        
        // Atualizar estado com ferramentas disponíveis
        this.updateSessionState(sessionId, {
          availableTools: options.tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            enabled: true
          }))
        });
        
        // Notificar sobre registro de ferramentas
        onEvent({
          type: 'toolsRegistered',
          content: {
            parts: [{ text: `${options.tools.length} ferramentas registradas` }],
            role: 'system'
          },
          actions: [
            {
              type: 'state_delta',
              changes: {
                toolsRegistered: true,
                toolCount: options.tools.length
              }
            }
          ]
        } as any);
      }

      // Criar stream de eventos
      const eventStream = this.processUserInput(sessionId, input, options);
      
      // Processar cada evento do stream
      for await (const event of eventStream) {
        // Detectar chamadas de função (ferramentas)
        if (event.content?.parts?.some(part => part.function_call)) {
          const functionPart = event.content.parts.find(part => part.function_call);
          
          if (functionPart?.function_call) {
            // Extrair detalhes da chamada de função
            const { name, arguments: args } = functionPart.function_call;
            
            // Encontrar a ferramenta correspondente
            const tool = options.tools?.find(t => t.name === name);
            
            if (tool) {
              // Evento de início da ferramenta
              onEvent({
                type: 'toolStart',
                content: {
                  parts: [{ text: `Iniciando ferramenta: ${name}` }],
                  role: 'tool'
                },
                data: {
                  name,
                  args,
                  timestamp: Date.now()
                }
              } as any);
              
              try {
                // Executar a ferramenta
                const result = await tool.handler(args);
                
                // Evento de conclusão da ferramenta
                onEvent({
                  type: 'toolComplete',
                  content: {
                    parts: [
                      { 
                        function_response: {
                          name,
                          response: result
                        }
                      }
                    ],
                    role: 'tool'
                  },
                  data: {
                    name,
                    result,
                    timestamp: Date.now()
                  }
                } as any);
                
                // Atualizar estado com resultado da ferramenta
                this.updateSessionState(sessionId, {
                  [`toolResult_${name}`]: {
                    timestamp: Date.now(),
                    result
                  }
                });
                
              } catch (error) {
                // Evento de erro da ferramenta
                onEvent({
                  type: 'toolError',
                  content: {
                    parts: [{ text: `Erro ao executar ferramenta ${name}: ${error instanceof Error ? error.message : String(error)}` }],
                    role: 'system'
                  },
                  data: {
                    name,
                    error: error instanceof Error ? error.message : String(error),
                    timestamp: Date.now()
                  }
                } as any);
              }
            }
          }
        }
        
        // Propagar o evento para o callback
        onEvent(event);
      }
      
    } catch (error) {
      console.error("Erro no processamento de entrada com callback:", error);
      
      // Notificar erro
      onEvent({
        type: 'error',
        content: {
          parts: [{ text: `Erro: ${error instanceof Error ? error.message : String(error)}` }],
          role: 'system'
        }
      } as any);
      
      throw error;
    }
  }
  
  /**
   * Atualiza o estado de uma sessão
   */
  updateSessionState(sessionId: string, updates: Record<string, any>): void {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Sessão não encontrada: ${sessionId}`);
    }
    
    session.state = {
      ...session.state,
      ...updates,
      lastUpdated: Date.now()
    };
  }
  
  /**
   * Obtém o estado atual da sessão
   */
  getSessionState(sessionId: string): Record<string, any> | null {
    const session = this.sessions.get(sessionId);
    return session ? session.state : null;
  }
  
  /**
   * Registra um evento personalizado na sessão
   */
  logSessionEvent(
    sessionId: string, 
    eventType: string, 
    data: any, 
    onEvent?: (event: Event) => void
  ): void {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Sessão não encontrada: ${sessionId}`);
    }
    
    const event: Event = {
      type: eventType,
      data,
      timestamp: Date.now()
    } as any;
    
    // Adicionar ao histórico apenas se for um tipo de evento que deve ser persistido
    if (['user', 'model', 'tool', 'system'].includes(eventType)) {
      session.history.push(event);
    }
    
    // Notificar através do callback se fornecido
    if (onEvent) {
      onEvent(event);
    }
  }
}