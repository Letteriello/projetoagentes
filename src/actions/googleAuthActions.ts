'use server';

/**
 * Módulo de Server Actions para Google Auth
 * 
 * Este arquivo contém ações do servidor que isolam completamente as
 * bibliotecas do Node.js para que não sejam incluídas no bundle do cliente.
 */

// Interfaces para tipagem
interface GoogleAuth {
  GoogleAuth: new (options?: any) => {
    getClient: () => Promise<any>;
    getProjectId: () => Promise<string>;
  };
}

interface GcpMetadata {
  isAvailable: () => Promise<boolean>;
}

// Importações condicionais somente no servidor
let googleAuth: GoogleAuth | null = null;
let gcpMetadata: GcpMetadata | null = null;

try {
  googleAuth = require('google-auth-library');
  gcpMetadata = require('gcp-metadata');
} catch (error) {
  console.error('[Server] Erro ao carregar bibliotecas do Google Auth:', error);
}

/**
 * Verifica se o ambiente atual é GCP
 */
export async function checkGcpEnvironment() {
  try {
    if (!gcpMetadata) {
      throw new Error('Biblioteca gcp-metadata não disponível no servidor');
    }

    const isOnGcp = await gcpMetadata.isAvailable();
    
    return { 
      success: true,
      isOnGcp,
      environment: process.env.NODE_ENV
    };
  } catch (error: any) {
    console.error('[Server] Erro ao verificar ambiente GCP:', error);
    return { 
      success: false,
      error: error.message || 'Erro desconhecido',
      isOnGcp: false, 
      environment: process.env.NODE_ENV
    };
  }
}

/**
 * Inicializa a autenticação do Google Auth no servidor
 */
export async function initializeGoogleAuth(options: { 
  scopes?: string[];
  projectId?: string;
}) {
  try {
    if (!googleAuth) {
      throw new Error('Biblioteca google-auth-library não disponível no servidor');
    }

    const { GoogleAuth } = googleAuth;
    const auth = new GoogleAuth({
      scopes: options.scopes || ['https://www.googleapis.com/auth/cloud-platform'],
      projectId: options.projectId
    });
    
    // Não retornamos o objeto auth diretamente para não serializá-lo
    const authClient = await auth.getClient();
    const projectId = await auth.getProjectId();
    
    return { 
      success: true,
      initialized: true,
      projectId,
      scopes: options.scopes || []
    };
  } catch (error: any) {
    console.error('[Server] Erro ao inicializar Google Auth:', error);
    return { 
      success: false,
      error: error.message || 'Erro desconhecido',
      initialized: false,
      projectId: 'unknown',
      scopes: []
    };
  }
}

/**
 * Executa uma operação com agente usando o Agent Development Kit (Genkit)
 */
export async function executeAgentOperation(agentConfig: any, input: string) {
  try {
    // Este é um placeholder - implementação real depende da sua integração com o Genkit
    return {
      success: true,
      result: `Resposta simulada para: ${input}`,
      agentId: agentConfig.agentId || 'agent-001'
    };
  } catch (error: any) {
    console.error('[Server] Erro ao executar operação com agente:', error);
    return {
      success: false,
      error: error.message,
      result: null
    };
  }
}
