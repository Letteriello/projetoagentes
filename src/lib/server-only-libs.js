'use server';

/**
 * Este arquivo contém importações e funções para bibliotecas que só devem ser usadas no servidor.
 * As importações não serão incluídas no bundle do cliente graças ao 'use server' diretiva.
 */

// Exportações condicionais para bibliotecas do lado do servidor
let googleAuth;
let gcpMetadata;
let httpsProxyAgent;

// Somente executar no servidor
if (typeof window === 'undefined') {
  try {
    // Importações dinâmicas do lado do servidor
    googleAuth = require('google-auth-library');
    gcpMetadata = require('gcp-metadata');
    httpsProxyAgent = require('https-proxy-agent');
    
    // Adicione outras bibliotecas que causam problemas no cliente
  } catch (error) {
    console.error('Erro ao importar bibliotecas do servidor:', error);
    // Fornece objetos vazios para evitar erros
    googleAuth = {};
    gcpMetadata = {};
    httpsProxyAgent = {};
  }
} else {
  // No cliente, fornecemos objetos mock vazios
  googleAuth = {};
  gcpMetadata = {};
  httpsProxyAgent = {};
}

/**
 * Funções auxiliares para autenticação Google
 * Todas as funções relacionadas a autenticação devem ser executadas apenas no servidor
 */
export async function getGoogleAuth() {
  if (typeof window !== 'undefined') {
    throw new Error('Esta função só pode ser chamada no servidor');
  }
  
  // Implementar lógica de autenticação aqui
  return googleAuth;
}

// Exporte as bibliotecas e funções auxiliares
export { 
  googleAuth,
  gcpMetadata, 
  httpsProxyAgent
};
