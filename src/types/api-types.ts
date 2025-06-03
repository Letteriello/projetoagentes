import { SavedAgentConfiguration } from "./agent-configs-fixed";

/**
 * Tipo padrão para respostas da API
 * @template T Tipo do dado retornado em caso de sucesso
 */
export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  data?: T;
  timestamp: string;
  suggestions?: string[];
}

/**
 * Tipo para respostas paginadas
 * @template T Tipo dos itens da lista
 */
export interface PaginatedApiResponse<T = any> extends ApiResponse<{
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}> {
  page: number;
  pageSize: number;
  total: number;
}

export interface AiConfigurationResponse {
  suggestions?: string[];
  updatedConfig?: Partial<SavedAgentConfiguration>;
}
