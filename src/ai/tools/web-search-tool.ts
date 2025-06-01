import { Tool } from '@genkit-ai/sdk';
import axios from 'axios'; // Re-introducing axios

/**
 * Define a interface para os resultados de pesquisa na web
 */
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Define a interface para a configuração da ferramenta de pesquisa na web
 */
export interface WebSearchToolConfig {
  apiKey?: string;
  apiUrl?: string;
}

/**
 * Cria uma ferramenta de pesquisa na web configurável.
 * @param config - Configuração para a ferramenta de pesquisa na web.
 * @returns Uma instância da ferramenta de pesquisa na web.
 */
export function createPerformWebSearchTool(config: WebSearchToolConfig): Tool {
  return {
    name: "perform_web_search",
    description: "Permite buscar informações atualizadas na web para responder perguntas sobre eventos recentes, dados ou fatos que podem não estar no conhecimento do modelo.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "A consulta de pesquisa a ser executada",
        },
        num_results: {
          type: "number",
          description: "Número de resultados a serem retornados (máximo 10)",
          default: 5,
        }
      },
      required: ["query"],
    },
    handler: async ({ query, num_results = 5 }) => {
      try {
        const searchApiUrl = config.apiUrl || 'https://api.duckduckgo.com/'; // Default URL if not provided
        const searchApiKey = config.apiKey;

        console.log(`Executando pesquisa web para: "${query}" com apiUrl: ${searchApiUrl}`);
        
        if (!searchApiKey) {
          console.log("API key não fornecida na configuração - retornando resultados simulados");

          const simulatedResults: SearchResult[] = Array.from({ length: Math.min(num_results, 10) }, (_, i) => ({
            title: `Resultado simulado ${i + 1} para "${query}" (sem API key)`,
            url: `https://example.com/simulated-search?q=${encodeURIComponent(query)}&index=${i}`,
            snippet: `Este é um resultado de exemplo ${i + 1} porque a API key não foi fornecida. Usando apiUrl: ${config.apiUrl || 'default URL'}.`
          }));

          return {
            results: simulatedResults,
            message: "Resultados simulados. Forneça 'apiKey' na configuração da ferramenta para resultados reais."
          };
        }

        // Implementação real com API - este é o bloco que seria usado em produção
        // Para fins de exemplo, ele está comentado, mas a estrutura está aqui.
        /*
        console.log(`Realizando chamada de API para ${searchApiUrl} com API Key: ${searchApiKey.substring(0,5)}...`);
        const response = await axios.get(searchApiUrl, {
          params: {
            q: query, // ou o nome do parâmetro que a API espera, ex: 'query', 'search_query'
            // apiKey: searchApiKey, // algumas APIs esperam a chave como parâmetro
            num: Math.min(num_results, 10), // ou o nome do parâmetro para número de resultados
            format: 'json', // ou o formato esperado
            // ... outros parâmetros específicos da API
          },
          headers: {
            // 'Authorization': `Bearer ${searchApiKey}`, // outras APIs esperam no header
            // 'X-Api-Key': searchApiKey, // ou um header customizado
          }
        });
        
        // Adapte o mapeamento abaixo de acordo com a estrutura REAL da sua API de pesquisa
        // O exemplo abaixo é genérico
        const responseData = response.data;
        let searchResults: SearchResult[] = [];

        // Exemplo: se a API retorna um array em `results` ou `items`
        if (responseData.results && Array.isArray(responseData.results)) {
          searchResults = responseData.results.map((item: any) => ({
            title: item.title || 'Sem título',
            url: item.url || item.link || '',
            snippet: item.snippet || item.description || '',
          })).slice(0, Math.min(num_results, 10));
        } else if (responseData.items && Array.isArray(responseData.items)) {
           searchResults = responseData.items.map((item: any) => ({
            title: item.title || 'Sem título',
            url: item.link || item.url || '',
            snippet: item.snippet || item.description || '',
          })).slice(0, Math.min(num_results, 10));
        }
        // Adicione mais `else if` conforme necessário para a estrutura da sua API

        return {
          results: searchResults,
          message: `Encontrados ${searchResults.length} resultados para "${query}"`
        };
        */

        // Se a implementação real da API (bloco comentado acima) não for usada,
        // continuamos retornando resultados simulados detalhados quando a API key é fornecida.
        // Isto ajuda a confirmar que o fluxo com API key está sendo atingido.
        const simulatedResultsWithApiKey: SearchResult[] = Array.from({ length: Math.min(num_results, 10) }, (_, i) => ({
            title: `Resultado REAL (simulado) ${i + 1} para: ${query}`,
            url: `${config.apiUrl || 'https://api.example.com'}/search?q=${encodeURIComponent(query)}&key=${config.apiKey}&index=${i}`,
            snippet: `Este é um resultado simulado ${i+1} para "${query}" como se viesse de uma API real, usando a API Key.`
        }));

        return {
          results: simulatedResultsWithApiKey,
          message: "Pesquisa web concluída com sucesso (simulado com API Key)"
        };

      } catch (error) {
        console.error("Erro na ferramenta de pesquisa web:", error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

        if (axios.isAxiosError(error)) {
          console.error("Detalhes do erro Axios:", error.response?.data);
          return {
            error: `Falha ao realizar a pesquisa (Erro Axios): ${errorMessage} (status: ${error.response?.status})`,
            results: []
          };
        }
        return {
          error: `Falha ao realizar a pesquisa: ${errorMessage}`,
          results: []
        };
      }
    },
  };
}

// As exportações principais são a função de fábrica e as interfaces.
// Os usuários desta ferramenta precisarão chamar createPerformWebSearchTool(config)
// para obter uma instância da ferramenta.
