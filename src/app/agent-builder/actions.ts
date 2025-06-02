// src/app/agent-builder/actions.ts
"use server";

import { agentCreatorChatFlow } from "@/ai/flows/agent-creator-flow";
import { SavedAgentConfiguration } from "@/types/agent-configs";
// Removed incorrect import for runFlow as we'll use the flow directly
import { runFlow } from '@genkit-ai/flow';
import { agentNameDescriptionSuggesterFlow, AgentNameDescriptionSuggesterInputSchema, AgentNameDescriptionSuggesterOutputSchema } from '@/ai/flows/agentNameDescriptionSuggesterFlow';
import { z } from 'zod';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy, // Added orderBy
  limit // Added limit
} from "firebase/firestore";
import { firestore } from "@/lib/firebaseClient";

interface CreatorChatActionInput {
  userNaturalLanguageInput: string;
  currentAgentConfigJson?: string;
  chatHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

// Schema for the new action's input, reusing the flow's Zod schema
const SuggestActionInputSchema = AgentNameDescriptionSuggesterInputSchema;

interface SuggestionResult {
  success: boolean;
  suggestedName?: string;
  suggestedDescription?: string;
  error?: string;
}

export async function suggestAgentNameAndDescriptionAction(
  input: z.infer<typeof SuggestActionInputSchema>
): Promise<SuggestionResult> {
  try {
    const result = await runFlow(agentNameDescriptionSuggesterFlow, input);
    return {
      success: true,
      suggestedName: result.suggestedName,
      suggestedDescription: result.suggestedDescription,
    };
  } catch (e: any) {
    console.error('Error in suggestAgentNameAndDescriptionAction:', e);
    if (e instanceof z.ZodError) {
      return {
        success: false,
        error: `Input validation failed: ${e.errors.map(err => `${err.path.join('.')} - ${err.message}`).join(', ')}`,
      };
    }
    return {
      success: false,
      error: e.message || 'Failed to get suggestions from AI.',
    };
  }
}

// Firestore collection reference
const agentsCollection = collection(firestore, "agents");

// CRUD actions for agent configurations

export async function createAgent(
  agentConfigData: Omit<SavedAgentConfiguration, "id" | "createdAt" | "updatedAt" | "internalVersion" | "isLatest" | "originalAgentId">,
  userId: string
): Promise<SavedAgentConfiguration | { error: string }> {
  try {
    const newAgentDoc = await addDoc(agentsCollection, {
      ...agentConfigData,
      userId,
      internalVersion: 1,
      isLatest: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await updateDoc(newAgentDoc.ref, { originalAgentId: newAgentDoc.id });
    const agentSnapshot = await getDoc(newAgentDoc);
    const agentData = agentSnapshot.data();
    return {
      id: agentSnapshot.id,
      ...agentData,
    } as SavedAgentConfiguration;
  } catch (e: any) {
    console.error("Error creating agent:", e);
    return { error: e.message || "Failed to create agent." };
  }
}

/* // Commenting out the old updateAgent function
export async function updateAgent(
  agentId: string,
  agentConfigUpdate: Partial<Omit<SavedAgentConfiguration, "id" | "createdAt" | "updatedAt" | "userId">>
): Promise<SavedAgentConfiguration | { error: string }> {
  try {
    const agentRef = doc(firestore, "agents", agentId);
    // TODO: Add check to ensure user owns the agent before updating
    await updateDoc(agentRef, {
      ...agentConfigUpdate,
      updatedAt: serverTimestamp(),
    });
    const updatedAgentSnapshot = await getDoc(agentRef);
    const updatedAgentData = updatedAgentSnapshot.data();
    return {
      id: updatedAgentSnapshot.id,
      ...updatedAgentData,
    } as SavedAgentConfiguration;
  } catch (e: any) {
    console.error("Error updating agent:", e);
    return { error: e.message || "Failed to update agent." };
  }
}
*/

export async function updateAgent(
  agentId: string, // This is the ID of the current version to be updated (which becomes the base for the new version)
  agentConfigUpdate: Partial<Omit<SavedAgentConfiguration, "id" | "createdAt" | "updatedAt" | "userId" | "internalVersion" | "isLatest" | "originalAgentId">>
): Promise<SavedAgentConfiguration | { error: string; status?: number }> {
  try {
    const currentVersionRef = doc(firestore, "agents", agentId);
    const currentVersionSnapshot = await getDoc(currentVersionRef);

    if (!currentVersionSnapshot.exists()) {
      return { error: "Agent version to update not found.", status: 404 };
    }

    const currentVersionData = currentVersionSnapshot.data() as SavedAgentConfiguration; // Cast for easier access
    const userId = currentVersionData.userId;
    // Fallback for originalAgentId for older documents that might not have it.
    const originalAgentId = currentVersionData.originalAgentId || agentId;

    if (!userId) {
        // This case should ideally not happen if agents are created correctly.
        return { error: "User ID not found on the agent version. Cannot update.", status: 400 };
    }
    // TODO: Add check to ensure the `userId` from `currentVersionData` matches the currently authenticated user.

    // Step 4c & 4d: Find current "latest" version(s) for this originalAgentId and set isLatest to false
    const latestQuery = query(
      agentsCollection,
      where("originalAgentId", "==", originalAgentId),
      where("isLatest", "==", true)
    );
    const latestSnapshot = await getDocs(latestQuery);

    const updatePromises: Promise<void>[] = [];
    latestSnapshot.forEach((docSnapshot) => {
      updatePromises.push(
        updateDoc(docSnapshot.ref, {
          isLatest: false,
          updatedAt: serverTimestamp(),
        })
      );
    });
    await Promise.all(updatePromises);

    // Step 4e & 4f: Determine the new internalVersion
    const internalVersionQuery = query(
      agentsCollection,
      where("originalAgentId", "==", originalAgentId),
      orderBy("internalVersion", "desc"),
      limit(1)
    );
    const internalVersionSnapshot = await getDocs(internalVersionQuery);
    let newInternalVersion = 1;
    if (!internalVersionSnapshot.empty) {
      const highestVersionDocData = internalVersionSnapshot.docs[0].data();
      newInternalVersion = (highestVersionDocData.internalVersion || 0) + 1;
    }

    // Step 4g: Prepare data for the new agent version document
    const newAgentVersionData = {
      ...currentVersionData,
      ...agentConfigUpdate,
      config: { ...currentVersionData.config, ...agentConfigUpdate.config },
      toolConfigsApplied: { ...currentVersionData.toolConfigsApplied, ...agentConfigUpdate.toolConfigsApplied },
      userId,
      originalAgentId,
      internalVersion: newInternalVersion,
      isLatest: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    delete newAgentVersionData.id;


    const newAgentVersionDocRef = await addDoc(agentsCollection, newAgentVersionData);
    const newAgentVersionSnapshot = await getDoc(newAgentVersionDocRef);

    return {
      id: newAgentVersionSnapshot.id,
      ...(newAgentVersionSnapshot.data() as Omit<SavedAgentConfiguration, "id">),
    } as SavedAgentConfiguration;

  } catch (e: any) {
    console.error("Error updating agent (creating new version):", e);
    return { error: e.message || "Failed to update agent by creating a new version." };
  }
}


export async function deleteAgent(
  agentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const agentRef = doc(firestore, "agents", agentId);
    await deleteDoc(agentRef);
    return { success: true };
  } catch (e: any) {
    console.error("Error deleting agent:", e);
    return { success: false, error: e.message || "Failed to delete agent." };
  }
}

export async function listAgents(
  userId: string
): Promise<SavedAgentConfiguration[] | { error: string }> {
  try {
    // This query will fetch all agent versions for the user.
    // UI/client might want to additionally filter for isLatest === true for a default view.
    const q = query(
        agentsCollection,
        where("userId", "==", userId),
        orderBy("originalAgentId"), // Group versions of the same agent together
        orderBy("internalVersion", "desc") // List newest versions first within each group
    );
    const querySnapshot = await getDocs(q);
    const agents: SavedAgentConfiguration[] = [];
    querySnapshot.forEach((doc) => {
      agents.push({ id: doc.id, ...doc.data() } as SavedAgentConfiguration);
    });
    return agents;
  } catch (e: any) {
    console.error("Error listing agents:", e);
    return { error: e.message || "Failed to list agents." };
  }
}

export async function getAgentById(
  agentId: string,
  userId: string
): Promise<SavedAgentConfiguration | { error: string; status?: number }> {
  try {
    const agentRef = doc(firestore, "agents", agentId);
    const agentSnapshot = await getDoc(agentRef);

    if (!agentSnapshot.exists()) {
      return { error: "Agent not found.", status: 404 };
    }

    const agentData = agentSnapshot.data() as SavedAgentConfiguration;

    if (agentData.userId !== userId) {
      return { error: "Forbidden. User does not own this agent.", status: 403 };
    }

    return {
      id: agentSnapshot.id,
      ...agentData,
    } as SavedAgentConfiguration;
  } catch (e: any) {
    console.error("Error getting agent by ID:", e);
    return { error: e.message || "Failed to get agent.", status: 500 };
  }
}

export async function getAgentHistory(
  originalAgentId: string,
  userId: string
): Promise<SavedAgentConfiguration[] | { error: string }> {
  try {
    const q = query(
      agentsCollection,
      where("originalAgentId", "==", originalAgentId),
      where("userId", "==", userId), // Ensure user owns these versions
      orderBy("internalVersion", "desc") // Newest version first
    );

    const querySnapshot = await getDocs(q);
    const history: SavedAgentConfiguration[] = [];
    querySnapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() } as SavedAgentConfiguration);
    });

    return history;
  } catch (e: any) {
    console.error("Error getting agent history:", e);
    return { error: e.message || "Failed to get agent history." };
  }
}

export async function restoreAgentVersion(
  agentIdToRestore: string,
  userId: string
): Promise<SavedAgentConfiguration | { error: string; status?: number }> {
  try {
    const agentToRestoreRef = doc(firestore, "agents", agentIdToRestore);
    const agentToRestoreSnapshot = await getDoc(agentToRestoreRef);

    if (!agentToRestoreSnapshot.exists()) {
      return { error: "Version to restore not found.", status: 404 };
    }

    const agentToRestoreData = agentToRestoreSnapshot.data() as SavedAgentConfiguration;

    if (agentToRestoreData.userId !== userId) {
      return { error: "Forbidden. User does not own this agent version.", status: 403 };
    }

    const originalAgentId = agentToRestoreData.originalAgentId;
    if (!originalAgentId) {
      // This should not happen for properly versioned agents
      return { error: "Cannot restore: originalAgentId missing from the version to restore.", status: 500 };
    }

    // Find current "latest" version(s) for this originalAgentId and set isLatest to false
    const latestQuery = query(
      agentsCollection,
      where("originalAgentId", "==", originalAgentId),
      where("isLatest", "==", true)
    );
    const latestSnapshot = await getDocs(latestQuery);

    const updatePromises: Promise<void>[] = [];
    latestSnapshot.forEach((docSnapshot) => {
      updatePromises.push(
        updateDoc(docSnapshot.ref, {
          isLatest: false,
          updatedAt: serverTimestamp(),
        })
      );
    });
    await Promise.all(updatePromises);

    // Determine the new internalVersion
    const internalVersionQuery = query(
      agentsCollection,
      where("originalAgentId", "==", originalAgentId),
      orderBy("internalVersion", "desc"),
      limit(1)
    );
    const internalVersionSnapshot = await getDocs(internalVersionQuery);
    let newInternalVersion = 1;
    if (!internalVersionSnapshot.empty) {
      const highestVersionDocData = internalVersionSnapshot.docs[0].data();
      newInternalVersion = (highestVersionDocData.internalVersion || 0) + 1;
    }

    // Prepare data for the new "restored" version document
    const newRestoredVersionData = {
      ...agentToRestoreData,
      internalVersion: newInternalVersion,
      isLatest: true,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };
    delete newRestoredVersionData.id;

    const newDocRef = await addDoc(agentsCollection, newRestoredVersionData);
    const newDocSnapshot = await getDoc(newDocRef);

    return {
      id: newDocSnapshot.id,
      ...(newDocSnapshot.data() as Omit<SavedAgentConfiguration, "id">),
    } as SavedAgentConfiguration;

  } catch (e: any) {
    console.error("Error restoring agent version:", e);
    return { error: e.message || "Failed to restore agent version.", status: 500 };
  }
}


// Added for LLM Behavior Suggestions
import {
  llmBehaviorSuggesterFlow,
  LlmBehaviorSuggesterInputSchema
} from '@/ai/flows/llmBehaviorSuggesterFlow';

interface BehaviorSuggestionResult {
  success: boolean;
  suggestions?: string[];
  error?: string;
}

export async function suggestLlmBehaviorAction(
  input: z.infer<typeof LlmBehaviorSuggesterInputSchema>
): Promise<BehaviorSuggestionResult> {
  try {
    const result = await runFlow(llmBehaviorSuggesterFlow, input);
    return {
      success: true,
      suggestions: result.suggestions,
    };
  } catch (e: any) {
    console.error('Error in suggestLlmBehaviorAction:', e);
    let errorMessage = 'Failed to get behavior suggestions from AI.';
    if (e instanceof z.ZodError) {
      errorMessage = 'Data validation error: ' + e.errors.map(err => `${err.path.join('.')} - ${err.message}`).join(', ');
    } else if (e.message) {
      errorMessage = e.message;
    }
    return {
      success: false,
      error: errorMessage,
    };
  }
}

interface CreatorChatActionResult {
  updatedAgentConfigJson?: string;
  assistantResponse?: string;
  error?: string;
}

export async function invokeAgentCreatorChatFlow(
  input: CreatorChatActionInput
): Promise<CreatorChatActionResult> {
  try {
    const flowResult = await agentCreatorChatFlow({
      userNaturalLanguageInput: input.userNaturalLanguageInput,
      currentAgentConfigJson: input.currentAgentConfigJson,
      chatHistory: input.chatHistory,
    });

    return {
      updatedAgentConfigJson: flowResult.updatedAgentConfigJson,
      assistantResponse: flowResult.assistantResponse,
    };
  } catch (e: any) {
    console.error("Error invoking agentCreatorChatFlow:", e);
    return {
      error: e.message || "Failed to run agent creator flow.",
    };
  }
}
