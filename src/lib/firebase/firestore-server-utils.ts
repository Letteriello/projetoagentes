'use server';

// Este arquivo só deve ser importado de componentes do servidor
import { firestore } from '@/lib/firebase/firestore';

// Função segura para acessar o Firestore apenas no servidor
export async function getCollection(collectionName: string) {
  try {
    const snapshot = await firestore.collection(collectionName).get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Erro ao acessar coleção ${collectionName}:`, error);
    throw error;
  }
}

// Função para obter um documento específico
export async function getDocument(collectionName: string, docId: string) {
  try {
    const docRef = firestore.collection(collectionName).doc(docId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error(`Erro ao obter documento ${docId} da coleção ${collectionName}:`, error);
    throw error;
  }
}

// Função para criar um documento
export async function createDocument(collectionName: string, data: any) {
  try {
    const docRef = await firestore.collection(collectionName).add(data);
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error(`Erro ao criar documento na coleção ${collectionName}:`, error);
    throw error;
  }
}

// Função para atualizar um documento
export async function updateDocument(collectionName: string, docId: string, data: any) {
  try {
    const docRef = firestore.collection(collectionName).doc(docId);
    await docRef.update(data);
    return { id: docId, ...data };
  } catch (error) {
    console.error(`Erro ao atualizar documento ${docId} na coleção ${collectionName}:`, error);
    throw error;
  }
}

// Função para excluir um documento
export async function deleteDocument(collectionName: string, docId: string) {
  try {
    const docRef = firestore.collection(collectionName).doc(docId);
    await docRef.delete();
    return { success: true, id: docId };
  } catch (error) {
    console.error(`Erro ao excluir documento ${docId} da coleção ${collectionName}:`, error);
    throw error;
  }
}

// Exporta um objeto que pode ser usado para verificar se estamos no servidor
export const isServerEnvironment = true;

/**
 * Checks if a Firestore error is potentially transient and thus retryable.
 * @param error The error object, typically a FirebaseError.
 * @returns True if the error is deemed retryable, false otherwise.
 */
export const isRetryableFirestoreError = (error: any): boolean => {
  if (!error || !error.code) return false; // Firebase errors usually have a 'code' property
  switch (error.code) {
    case 'unavailable':         // The service is currently unavailable. This is a most likely transient condition.
    case 'cancelled':           // The operation was cancelled (typically by the caller). Might be retryable depending on context.
    case 'deadline-exceeded':   // Deadline expired before operation could complete.
    // case 'resource-exhausted': // Quota exhausted - less likely to be fixed by immediate retry, similar to IDB's QuotaExceededError.
    // case 'internal':             // Internal errors. Might be retryable.
    // case 'unknown':              // Unknown error.
      return true;
    default:
      return false;
  }
};
