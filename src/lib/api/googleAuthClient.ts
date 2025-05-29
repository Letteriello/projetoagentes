import { useState, useEffect } from 'react';

/**
 * Cliente para API do Google Auth
 * Este módulo fornece funções para interagir com a API do servidor
 * que encapsula as bibliotecas do Google Auth e outras dependências Node.js
 */

/**
 * Verifica se o ambiente atual é GCP
 * @returns Promessa que resolve para true se estiver rodando no GCP
 */
export async function checkGcpEnvironment(): Promise<{ isOnGcp: boolean; environment: string }> {
  try {
    const response = await fetch('/api/googleauth', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro desconhecido na verificação do ambiente GCP');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao verificar ambiente GCP:', error);
    return { isOnGcp: false, environment: 'unknown' };
  }
}

/**
 * Inicializa a autenticação do Google Auth no servidor
 * @param options Opções de configuração para autenticação
 * @returns Promessa que resolve para informações de inicialização
 */
export async function initializeGoogleAuth(options: { 
  scopes?: string[];
  projectId?: string;
}): Promise<{ initialized: boolean; projectId: string; scopes: string[] }> {
  try {
    const response = await fetch('/api/googleauth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro desconhecido na inicialização do Google Auth');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao inicializar Google Auth:', error);
    return { initialized: false, projectId: 'unknown', scopes: [] };
  }
}

/**
 * Hook React para verificar o ambiente GCP
 * @returns Estado de carregamento e resultado da verificação
 */
export function useGcpEnvironment() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<{ isOnGcp: boolean; environment: string } | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const result = await checkGcpEnvironment();
        if (isMounted) {
          setData(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { isLoading, data, error };
}
