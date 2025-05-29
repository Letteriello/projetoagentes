import { NextResponse } from 'next/server';

// Importações condicionais somente no servidor
let googleAuth;
let gcpMetadata;

// Verificação de ambiente servidor
if (typeof window === 'undefined') {
  try {
    googleAuth = require('google-auth-library');
    gcpMetadata = require('gcp-metadata');
  } catch (error) {
    console.error('Erro ao carregar bibliotecas do Google Auth:', error);
  }
}

/**
 * API para verificar autenticação no GCP
 */
export async function GET() {
  try {
    if (!gcpMetadata) {
      return NextResponse.json({ 
        error: 'Bibliotecas do servidor não disponíveis' 
      }, { status: 500 });
    }

    const isOnGcp = await gcpMetadata.isAvailable();
    
    return NextResponse.json({ 
      isOnGcp,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Erro na API de Google Auth:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * API para inicializar um cliente de autenticação
 */
export async function POST(request: Request) {
  try {
    if (!googleAuth) {
      return NextResponse.json({ 
        error: 'Bibliotecas do servidor não disponíveis' 
      }, { status: 500 });
    }

    const body = await request.json();
    const { GoogleAuth } = googleAuth;
    
    // Iniciamos a autenticação mas não retornamos o cliente diretamente
    // apenas status e informações públicas
    const auth = new GoogleAuth();
    
    return NextResponse.json({ 
      initialized: true,
      scopes: body.scopes || [],
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'unknown'
    });
  } catch (error) {
    console.error('Erro na API de inicialização do Google Auth:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
