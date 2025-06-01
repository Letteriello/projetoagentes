// src/app/api/agents/route.ts
import { NextResponse } from 'next/server';
import { firestoreAdmin } from '@/lib/firebaseAdmin';
import { SavedAgentConfiguration, AgentConfig } from '@/types/agent-configs'; // Usar os tipos unificados

const PLACEHOLDER_USER_ID = "defaultUser"; // Substituir por autenticação real

export async function POST(request: Request) {
  try {
    const agentData = await request.json() as Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>;

    if (!agentData.agentName || !agentData.config) {
      return NextResponse.json({ error: 'Nome do agente e configuração são obrigatórios.' }, { status: 400 });
    }

    const newAgent: Omit<SavedAgentConfiguration, 'id'> = {
      ...agentData,
      userId: PLACEHOLDER_USER_ID, // Associar ao usuário (placeholder)
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await firestoreAdmin.collection('agents').add(newAgent);
    const savedAgent = { ...newAgent, id: docRef.id };

    return NextResponse.json(savedAgent, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: 'Falha ao criar agente.', details: errorMessage }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // TODO: Implementar filtro por usuário quando a autenticação estiver pronta
    const snapshot = await firestoreAdmin.collection('agents')
                                     .where('userId', '==', PLACEHOLDER_USER_ID) // Filtrar por userId
                                     .orderBy('updatedAt', 'desc')
                                     .get();
    if (snapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }
    const agents: SavedAgentConfiguration[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        // Mapear todos os campos de SavedAgentConfiguration
        agentName: data.agentName,
        agentDescription: data.agentDescription,
        agentVersion: data.agentVersion,
        icon: data.icon,
        templateId: data.templateId,
        isFavorite: data.isFavorite,
        tags: data.tags,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        userId: data.userId,
        config: data.config as AgentConfig, // Fazer type assertion aqui
        tools: data.tools,
        toolConfigsApplied: data.toolConfigsApplied,
        toolsDetails: data.toolsDetails,
      } as SavedAgentConfiguration;
    });
    return NextResponse.json(agents, { status: 200 });
  } catch (error) {
    console.error('Error fetching agents:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: 'Falha ao buscar agentes.', details: errorMessage }, { status: 500 });
  }
}
