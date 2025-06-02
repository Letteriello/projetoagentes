// ----------------------------------------------------------------------
// Nome do Arquivo: agentServices.ts
// Autor: Cascade AI (assistido por Gabriel Letteriello)
// Data: 2025-06-01
// Descrição: Este módulo fornece serviços relacionados à gestão de agentes,
//            incluindo salvamento, recuperação e atualização de configurações de agentes.
// ----------------------------------------------------------------------

import { SavedAgentConfiguration } from '@/types/agent-configs';
import { firestore } from '@/lib/firebaseClient';
import { collection, doc, setDoc, addDoc, getDoc, getDocs, query, where } from 'firebase/firestore';

/**
 * Salva uma configuração de agente no Firestore.
 * 
 * @param agentConfig - A configuração do agente a ser salva
 * @param userId - ID do usuário (opcional) para associar à configuração do agente
 * @returns Uma Promise que resolve quando a operação é concluída
 * 
 * @remarks
 * Se a configuração tiver um ID existente, atualiza o documento correspondente.
 * Caso contrário, cria um novo documento com um ID gerado automaticamente.
 */
export async function saveAgentConfiguration(agentConfig: SavedAgentConfiguration, userId?: string): Promise<void> {
  try {
    const agentsCollection = collection(firestore, 'agent-configurations');
    
    // Preparando os dados da configuração para salvar no Firestore
    // Aqui separamos o userId do restante da configuração para evitar problemas de tipagem
    const firestoreData = {
      ...agentConfig,
      // Se userId for fornecido, adicionamos como campo do documento
      ...(userId && { userId })
    };
    
    // Se o agente já possui um ID, atualiza o documento existente
    if (agentConfig.id && agentConfig.id.length > 0) {
      const agentDocRef = doc(agentsCollection, agentConfig.id);
      await setDoc(agentDocRef, firestoreData, { merge: true });
    } 
    // Caso contrário, cria um novo documento com ID gerado automaticamente
    else {
      // Verificamos se já existe um agente com o mesmo nome e o mesmo usuário
      // Só executamos esta verificação se tivermos userId disponível
      if (userId) {
        const existingAgentQuery = query(agentsCollection, 
          where("agentName", "==", agentConfig.agentName), 
          where("userId", "==", userId));
        
        const existingAgentSnapshot = await getDocs(existingAgentQuery);
        
        if (!existingAgentSnapshot.empty) {
          // Se existir um agente com o mesmo nome, atualizamos ele
          const existingAgentDoc = existingAgentSnapshot.docs[0];
          const agentDocRef = doc(agentsCollection, existingAgentDoc.id);
          await setDoc(agentDocRef, { ...firestoreData, id: existingAgentDoc.id }, { merge: true });
          return;
        }
      }
      
      // Caso não exista ou não tenhamos userId, criamos um novo documento
      await addDoc(agentsCollection, firestoreData);
    }
  } catch (error) {
    console.error("Erro ao salvar a configuração do agente:", error);
    throw error; // Propaga o erro para ser tratado pelo chamador
  }
}

/**
 * Recupera uma configuração de agente pelo ID.
 * 
 * @param agentId - O ID da configuração do agente
 * @returns Uma Promise que resolve para a configuração do agente ou null se não encontrada
 */
export async function getAgentConfiguration(agentId: string): Promise<SavedAgentConfiguration | null> {
  try {
    const agentDocRef = doc(collection(firestore, 'agent-configurations'), agentId);
    const agentSnapshot = await getDoc(agentDocRef);
    
    if (agentSnapshot.exists()) {
      return agentSnapshot.data() as SavedAgentConfiguration;
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao recuperar a configuração do agente:", error);
    throw error;
  }
}

// Example for saveAgentTemplate
export async function saveAgentTemplate(templateConfig: SavedAgentConfiguration, userId?: string): Promise<string> {
  // TODO: Implement admin-only restriction for saving templates (e.g., check custom claims or a role in user's profile)
  try {
    const templatesCollection = collection(firestore, 'agent-templates');
    const dataToSave = {
      ...templateConfig,
      isTemplate: true,
      userId: userId || null, // Ensure userId is either a string or null
      // Ensure createdAt and updatedAt are properly handled (e.g., server timestamp or ISO string)
      // If templateConfig.id is undefined or empty, addDoc will generate one.
      // If templateConfig.id is provided, it implies an update or specific ID assignment.
    };

    if (!dataToSave.createdAt) {
        dataToSave.createdAt = new Date().toISOString();
    }
    dataToSave.updatedAt = new Date().toISOString();


    let docRef;
    if (templateConfig.id && templateConfig.id.length > 0) {
      docRef = doc(templatesCollection, templateConfig.id);
      await setDoc(docRef, dataToSave, { merge: true });
      return templateConfig.id;
    } else {
      // Remove id if it's empty so Firestore auto-generates it
      const { id, ...dataWithoutId } = dataToSave;
      docRef = await addDoc(templatesCollection, dataWithoutId);
      return docRef.id;
    }
  } catch (error) {
    console.error("Erro ao salvar o template do agente:", error);
    throw error;
  }
}

// Example for getAgentTemplate
export async function getAgentTemplate(templateId: string): Promise<SavedAgentConfiguration | null> {
  try {
    const templateDocRef = doc(collection(firestore, 'agent-templates'), templateId);
    const templateSnapshot = await getDoc(templateDocRef);

    if (templateSnapshot.exists()) {
      return { ...templateSnapshot.data(), id: templateSnapshot.id } as SavedAgentConfiguration;
    }

    return null;
  } catch (error) {
    console.error("Erro ao recuperar o template do agente:", error);
    throw error;
  }
}

// Example for getUserAgentTemplates
export async function getUserAgentTemplates(userId: string): Promise<SavedAgentConfiguration[]> {
  try {
    const templatesQuery = query(
      collection(firestore, 'agent-templates'),
      where("userId", "==", userId)
    );
    const templatesSnapshot = await getDocs(templatesQuery);

    return templatesSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as SavedAgentConfiguration));
  } catch (error) {
    console.error("Erro ao recuperar os templates de agente do usuário:", error);
    throw error;
  }
}

// Example for getCommunityAgentTemplates
export async function getCommunityAgentTemplates(): Promise<SavedAgentConfiguration[]> {
  try {
    const templatesQuery = query(collection(firestore, 'agent-templates'));
    const templatesSnapshot = await getDocs(templatesQuery);

    return templatesSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as SavedAgentConfiguration));
  } catch (error) {
    console.error("Erro ao recuperar os templates de agente da comunidade:", error);
    throw error;
  }
}

/**
 * Recupera todas as configurações de agente de um usuário específico.
 * 
 * @param userId - O ID do usuário
 * @returns Uma Promise que resolve para um array de configurações de agente
 */
export async function getUserAgentConfigurations(userId: string): Promise<SavedAgentConfiguration[]> {
  try {
    const agentsQuery = query(collection(firestore, 'agent-configurations'), where("userId", "==", userId));
    const agentsSnapshot = await getDocs(agentsQuery);
    
    return agentsSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as SavedAgentConfiguration));
  } catch (error) {
    console.error("Erro ao recuperar as configurações de agente do usuário:", error);
    throw error;
  }
}