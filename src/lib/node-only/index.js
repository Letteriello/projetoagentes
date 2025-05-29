'use server';

/**
 * Este arquivo contém wrappers para bibliotecas que dependem de APIs do Node.js
 * e só devem ser usadas em componentes do servidor.
 * 
 * A diretiva 'use server' garante que este código só será executado no servidor.
 */

// Variáveis para armazenar as bibliotecas
let googleAuth;
let gcpMetadata;
let httpsProxyAgent;
let gToken;

// Verificação de ambiente servidor
const isServer = typeof window === 'undefined';

// Inicialização condicional das bibliotecas
if (isServer) {
  try {
    // Importar dinamicamente as bibliotecas no servidor
    const GoogleAuth = require('google-auth-library');
    const GcpMetadata = require('gcp-metadata');
    const HttpsProxyAgent = require('https-proxy-agent');
    const GToken = require('gtoken');
    
    // Atribuir às variáveis
    googleAuth = GoogleAuth;
    gcpMetadata = GcpMetadata;
    httpsProxyAgent = HttpsProxyAgent;
    gToken = GToken;
    
    console.log('Bibliotecas do Node.js carregadas com sucesso no servidor');
  } catch (error) {
    console.error('Erro ao carregar bibliotecas do Node.js no servidor:', error);
    // Fornecer objetos vazios em caso de erro
    googleAuth = {};
    gcpMetadata = {};
    httpsProxyAgent = {};
    gToken = {};
  }
} else {
  // No cliente, fornecer objetos mock vazios
  googleAuth = {};
  gcpMetadata = {};
  httpsProxyAgent = {};
  gToken = {};
  console.warn('Tentativa de usar bibliotecas do Node.js no cliente');
}

/**
 * Funções de utilidade que encapsulam as bibliotecas
 */

/**
 * Obtém uma instância do Google Auth
 * @returns {Promise<any>} Uma instância do Google Auth
 */
export async function getGoogleAuth() {
  if (!isServer) {
    throw new Error('getGoogleAuth() só pode ser chamado no servidor');
  }
  return googleAuth;
}

/**
 * Verifica se o código está sendo executado em uma instância do GCP
 * @returns {Promise<boolean>} True se for uma instância GCP
 */
export async function isRunningOnGCP() {
  if (!isServer) {
    throw new Error('isRunningOnGCP() só pode ser chamado no servidor');
  }
  try {
    return await gcpMetadata.isAvailable();
  } catch (error) {
    return false;
  }
}

/**
 * Cria um proxy HTTPS para requisições
 * @param {Object} options - Opções do proxy
 * @returns {Object} Agente de proxy HTTPS
 */
export function createHttpsProxyAgent(options) {
  if (!isServer) {
    throw new Error('createHttpsProxyAgent() só pode ser chamado no servidor');
  }
  return new httpsProxyAgent.HttpsProxyAgent(options);
}

/**
 * Funções específicas para o Agent Development Kit (ADK)
 */
export async function initializeAgentClient(config) {
  if (!isServer) {
    throw new Error('initializeAgentClient() só pode ser chamado no servidor');
  }
  
  try {
    const { GoogleAuth } = googleAuth;
    const auth = new GoogleAuth();
    const client = await auth.getClient();
    
    // Aqui você pode inicializar o cliente ADK ou outras bibliotecas de agentes
    return {
      auth: client,
      config: config,
      initialized: true
    };
  } catch (error) {
    console.error('Erro ao inicializar cliente de agente:', error);
    return {
      initialized: false,
      error: error.message
    };
  }
}

// Exportar as bibliotecas (para uso em componentes do servidor)
export {
  googleAuth,
  gcpMetadata,
  httpsProxyAgent,
  gToken
};
