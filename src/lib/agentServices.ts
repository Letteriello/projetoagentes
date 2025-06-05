  // ----------------------------------------------------------------------
// Nome do Arquivo: agentServices.ts
// Autor: Cascade AI (assistido por Gabriel Letteriello)
// Data: 2025-06-01
// Descrição: Este módulo fornece serviços relacionados à gestão de agentes,
//            incluindo salvamento, recuperação e atualização de configurações de agentes.
// ----------------------------------------------------------------------
/// <reference types="firebase" />

import { SavedAgentConfiguration } from '@/types/unified-agent-types';
import { firestore } from '@/lib/firebaseClient';
// Adicionado importação com types completos
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  DocumentData, 
  QueryDocumentSnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { enhancedLogger } from '@/lib/logger'; // Import the logger

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
    
    // Prepare the data for Firestore
    // ownerId and sharedWith are handled explicitly below based on userId presence and new/existing agent logic.
    const firestoreData: any = { ...agentConfig };

    if (userId) { // Ensure userId is provided
      if (agentConfig.id && agentConfig.id.length > 0) { // Existing agent
        const agentDocRef = doc(agentsCollection, agentConfig.id);
        const agentSnapshot = await getDoc(agentDocRef);
        if (agentSnapshot.exists()) {
          const existingData = agentSnapshot.data();
          if (!existingData.ownerId) { // Backfill ownerId if it doesn't exist
            firestoreData.ownerId = userId;
          } else {
            // Ensure ownerId is not changed from what's in Firestore
            firestoreData.ownerId = existingData.ownerId; 
          }
          // sharedWith will be merged by setDoc unless explicitly changed in firestoreData.
          // For now, we are not modifying sharedWith during a simple save of other details.
          // If firestoreData contains sharedWith (e.g. from a future UI to edit shares), it will be updated.
          // If firestoreData does not contain sharedWith, existing sharedWith in Firestore remains untouched due to merge:true.
        } else {
          // Document doesn't exist, though an ID was provided. Treat as new for ownership.
          // This case should ideally not happen if IDs are managed correctly.
          enhancedLogger.logError(JSON.stringify({
            message: "Agent ID provided but document not found in Firestore. Treating as new for ownership.",
            details: { agentId: agentConfig.id, userId },
            flowName: "agentServices",
          }));
          firestoreData.ownerId = userId;
          firestoreData.sharedWith = []; // Initialize sharedWith for this edge case
        }
        await setDoc(agentDocRef, firestoreData, { merge: true });
      } else { // New agent
        firestoreData.ownerId = userId;
        firestoreData.sharedWith = []; // Initialize sharedWith for new agents

        // Check for existing agent with the same name and user (owner)
        const existingAgentQuery = query(agentsCollection, 
          where("agentName", "==", agentConfig.agentName), 
          where("ownerId", "==", userId)); // Query by ownerId now
        
        const existingAgentSnapshot = await getDocs(existingAgentQuery);
        
        if (!existingAgentSnapshot.empty) {
          // If an agent with the same name and owner exists, update it.
          const existingAgentDoc = existingAgentSnapshot.docs[0];
          firestoreData.id = existingAgentDoc.id; // Get the ID to update the existing one
          const agentDocRef = doc(agentsCollection, existingAgentDoc.id);
          // Merge with existing data, especially if sharedWith or other fields were set by another process
          await setDoc(agentDocRef, firestoreData, { merge: true }); 
        } else {
          // Create new document
          // Remove id from firestoreData if it's null/empty, so Firestore auto-generates it.
          if (!firestoreData.id) {
            delete firestoreData.id;
          }
          const newDocRef = await addDoc(agentsCollection, firestoreData);
          // Update the agentConfig with the new ID if needed by the caller (though this function doesn't return it)
          // agentConfig.id = newDocRef.id; // This would modify the input object, usually not ideal.
        }
      }
    } else {
      // Handle case where userId is not provided
      console.warn("Attempted to save agent configuration without a userId. ownerId and sharedWith will not be set/modified.");
      enhancedLogger.logError(JSON.stringify({
        message: "Attempted to save agent configuration without a userId. ownerId and sharedWith will not be set/modified.",
        details: { agentName: agentConfig.agentName, agentId: agentConfig.id },
        flowName: "agentServices",
      }));
      // Fallback to original logic if no userId, though this is not ideal for new requirements.
      // This will save the agent without ownerId or sharedWith being explicitly managed here.
      // If agentConfig already contains ownerId/sharedWith (e.g. loaded and re-saved), they will persist.
      if (agentConfig.id && agentConfig.id.length > 0) {
        const agentDocRef = doc(agentsCollection, agentConfig.id);
        await setDoc(agentDocRef, firestoreData, { merge: true });
      } else {
        // Remove id from firestoreData if it's null/empty, so Firestore auto-generates it.
        if (!firestoreData.id) {
            delete firestoreData.id;
          }
        await addDoc(agentsCollection, firestoreData);
      }
    }
  } catch (error: any) {
    console.error("Erro ao salvar a configuração do agente:", error);
    enhancedLogger.logError(JSON.stringify({
        message: "Error saving agent configuration to Firestore",
        error: error instanceof Error ? error.message : String(error),
        details: { agentName: agentConfig.agentName, agentId: agentConfig.id, userId },
        flowName: "agentServices", // Generic flow/context name
        agentId: userId || "unknown_user_as_agent", // Use userId if available
    }));
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
  } catch (error: any) {
    console.error("Erro ao recuperar a configuração do agente:", error);
    enhancedLogger.logError(JSON.stringify({
        message: "Error retrieving agent configuration from Firestore",
        error: error instanceof Error ? error.message : String(error),
        details: { agentIdQuery: agentId },
        flowName: "agentServices",
        agentId: "system_operation", // Or pass userId if this operation is user-specific
    }));
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
  } catch (error: any) {
    console.error("Erro ao salvar o template do agente:", error);
    enhancedLogger.logError(JSON.stringify({
        message: "Error saving agent template to Firestore",
        error: error instanceof Error ? error.message : String(error),
        details: { templateName: templateConfig.agentName, templateId: templateConfig.id, userId },
        flowName: "agentServices",
        agentId: userId || "unknown_user_as_agent",
    }));
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
  } catch (error: any) {
    console.error("Erro ao recuperar o template do agente:", error);
    enhancedLogger.logError(JSON.stringify({
        message: "Error retrieving agent template from Firestore",
        error: error instanceof Error ? error.message : String(error),
        details: { templateIdQuery: templateId },
        flowName: "agentServices",
        agentId: "system_operation"
    }));
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
  } catch (error: any) {
    console.error("Erro ao recuperar os templates de agente do usuário:", error);
    enhancedLogger.logError(JSON.stringify({
        message: "Error retrieving user's agent templates from Firestore",
        error: error instanceof Error ? error.message : String(error),
        details: { userIdQuery: userId },
        flowName: "agentServices",
        agentId: userId
    }));
    throw error;
  }
}

// Example for getCommunityAgentTemplates
export async function getCommunityAgentTemplates(): Promise<SavedAgentConfiguration[]> {
  try {
    const templatesQuery = query(collection(firestore, 'agent-templates'));
    const templatesSnapshot = await getDocs(templatesQuery);

    return templatesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      ...doc.data(),
      id: doc.id
    } as SavedAgentConfiguration));
  } catch (error: any) {
    console.error("Erro ao recuperar os templates de agente da comunidade:", error);
    enhancedLogger.logError(JSON.stringify({
        message: "Error retrieving community agent templates from Firestore",
        error: error instanceof Error ? error.message : String(error),
        details: {},
        flowName: "agentServices",
        agentId: "system_operation"
    }));
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
    const agentsQuery = query(collection(firestore, 'agent-configurations'), where("ownerId", "==", userId));
    const agentsSnapshot = await getDocs(agentsQuery);
    
    return agentsSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      ...doc.data(),
      id: doc.id
    } as SavedAgentConfiguration));
  } catch (error: any) {
    console.error("Erro ao recuperar as configurações de agente do usuário:", error);
    enhancedLogger.logError(JSON.stringify({
        message: "Error retrieving user's agent configurations from Firestore",
        error: error instanceof Error ? error.message : String(error),
        details: { userIdQuery: userId },
        flowName: "agentServices",
        agentId: userId
    }));
    throw error;
  }
}