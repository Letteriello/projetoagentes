/**
 * Tipos para o protocolo Agent-to-Agent (A2A) do Google ADK
 */

export interface CommunicationChannel {
    id: string;
    name: string;
    direction: 'inbound' | 'outbound' | 'bidirectional';
    targetAgentId?: string;
    messageFormat: 'json' | 'text' | 'binary';
    schema?: string; // Opcional: schema JSON para validação de mensagens
    syncMode: 'sync' | 'async';
    timeout?: number; // Em ms, para comunicação síncrona
    retryPolicy?: {
        maxRetries: number;
        delayMs: number; // Changed from retryInterval to delayMs
    };
}

export interface A2AConfig {
    enabled: boolean;
    communicationChannels: CommunicationChannel[];
    defaultResponseFormat: 'json' | 'text';
    loggingEnabled: boolean;
    maxMessageSize?: number; // Em bytes
}