// src/app/api/agents/[agentId]/route.ts
import { NextResponse } from 'next/server';
import { firestoreAdmin } from '@/lib/firebaseAdmin';
import { SavedAgentConfiguration } from '@/types/agent-configs';

const PLACEHOLDER_USER_ID = "defaultUser"; // Substituir por autenticação real

interface Params {
  agentId: string;
}

export async function PUT(request: Request, { params }: { params: Params }) {
  const { agentId } = params;
  try {
    const agentUpdateData = await request.json() as Partial<Omit<SavedAgentConfiguration, 'id' | 'userId' | 'createdAt'>>;

    // Validação básica
    if (!agentUpdateData || Object.keys(agentUpdateData).length === 0) {
        return NextResponse.json({ error: 'Dados de atualização não fornecidos.' }, { status: 400 });
    }

    const agentRef = firestoreAdmin.collection('agents').doc(agentId);
    const docSnap = await agentRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Agente não encontrado.' }, { status: 404 });
    }

    // TODO: Verificar se o agente pertence ao usuário autenticado
    if (docSnap.data()?.userId !== PLACEHOLDER_USER_ID) {
        return NextResponse.json({ error: 'Não autorizado a atualizar este agente.' }, { status: 403 });
    }

    const updatePayload = {
        ...agentUpdateData,
        updatedAt: new Date().toISOString(),
    };

    await agentRef.update(updatePayload);
    const updatedDoc = await agentRef.get();
    const updatedAgent = { id: updatedDoc.id, ...updatedDoc.data() } as SavedAgentConfiguration;

    return NextResponse.json(updatedAgent, { status: 200 });
  } catch (error) {
    console.error(`Error updating agent ${agentId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: `Falha ao atualizar agente ${agentId}.`, details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  const { agentId } = params;
  try {
    const agentRef = firestoreAdmin.collection('agents').doc(agentId);
    const docSnap = await agentRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Agente não encontrado.' }, { status: 404 });
    }

    // TODO: Verificar se o agente pertence ao usuário autenticado
     if (docSnap.data()?.userId !== PLACEHOLDER_USER_ID) {
        return NextResponse.json({ error: 'Não autorizado a deletar este agente.' }, { status: 403 });
    }

    await agentRef.delete();
    return NextResponse.json({ message: `Agente ${agentId} deletado com sucesso.` }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting agent ${agentId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: `Falha ao deletar agente ${agentId}.`, details: errorMessage }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Params }) {
  const { agentId } = params;
  try {
    const agentRef = firestoreAdmin.collection('agents').doc(agentId);
    const docSnap = await agentRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Agente não encontrado.' }, { status: 404 });
    }

    const agentData = { id: docSnap.id, ...docSnap.data() } as SavedAgentConfiguration;

    // TODO: Verificar se o agente pertence ao usuário autenticado
    if (agentData.userId !== PLACEHOLDER_USER_ID) {
        return NextResponse.json({ error: 'Não autorizado a visualizar este agente.' }, { status: 403 });
    }

    return NextResponse.json(agentData, { status: 200 });
  } catch (error) {
    console.error(`Error fetching agent ${agentId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: `Falha ao buscar agente ${agentId}.`, details: errorMessage }, { status: 500 });
  }
}
