import { test, expect, Page } from '@playwright/test';
import type { SavedAgentConfiguration, LLMAgentConfig } from '../src/types/agent-configs'; // Adjust path as needed

const mockEditingAgent: SavedAgentConfiguration = {
  id: "test-edit-agent-id-12345",
  agentName: "Original LLM Agent",
  agentDescription: "Original description of the LLM agent.",
  agentVersion: "1.0.1",
  icon: "cpu",
  templateId: "llm_base_template",
  isTemplate: false,
  isFavorite: true,
  tags: ["llm", "test"],
  createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
  updatedAt: new Date().toISOString(),
  userId: "test-user-id",
  config: {
    type: "llm",
    framework: "genkit",
    agentModel: "gemini-1.5-flash-latest",
    agentGoal: "To be an efficient LLM agent for testing.",
    agentTasks: ["Process user queries", "Provide accurate information"],
    agentPersonality: "professional", 
    agentRestrictions: ["No generating harmful content"],
    agentTemperature: 0.6,
    systemPromptGenerated: "System prompt for Original LLM Agent...",
    safetySettings: [{ category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" }],
    statePersistence: { 
      enabled: true, 
      type: "session", 
      defaultScope: "AGENT", 
      initialStateValues: [{ key: "theme", value: JSON.stringify("dark"), scope: "AGENT", description: "Default theme" }],
      validationRules: []
    },
    rag: { 
      enabled: true, 
      serviceType: "in-memory", 
      knowledgeSources: [{id: "ks1", name: "Test Doc", type: "text_chunk", content: "Test content", status: "processed"}],
      retrievalParameters: { topK: 3, similarityThreshold: 0.7 },
      persistentMemory: { enabled: false }
    },
    artifacts: { 
      enabled: true, 
      storageType: "memory", 
      definitions: [{id: "art1", name: "output.txt", description: "Generated text", mimeType: "text/plain", required: false, accessPermissions: "read_write", versioningEnabled: false}]
    },
    a2a: { 
      enabled: true, 
      communicationChannels: [{id: "chan1", name: "default", direction: "outbound", messageFormat: "json", syncMode: "async"}],
      defaultResponseFormat: "json",
      securityPolicy: "none",
      loggingEnabled: true
    },
    adkCallbacks: { 
      beforeAgent: "customBeforeFlow",
      afterTool: "customAfterToolFlow"
    },
    deploymentConfig: {
      targetPlatform: "cloudRun",
      environmentVariables: [{key: "API_MODE", value: "test"}],
      resourceRequirements: { cpu: "1", memory: "512Mi"}
    }
  } as LLMAgentConfig, // Type assertion
  tools: ["webSearch", "calculator"],
  toolConfigsApplied: {
    "webSearch": { apiKeyVar: "GOOGLE_API_KEY", cseIdVar: "GOOGLE_CSE_ID" }
  },
  toolsDetails: [
    { id: "webSearch", label: "Busca na Web (Google)", iconName: "Search", genkitToolName: "performWebSearch" },
    { id: "calculator", label: "Calculadora", iconName: "Calculator", genkitToolName: "calculator" }
  ],
  internalVersion: 2,
  isLatest: true,
  originalAgentId: "test-edit-agent-id-12345",
};

test.describe('Agent Builder - Edit Existing Agent', () => {
  test('should load existing agent data, allow edits, and verify updated save data', async ({ page }) => {
    let updatedAgentData: any = null;

    await page.route('**/api/agents', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockEditingAgent]), 
        });
      } else {
        await route.continue(); 
      }
    });
    
    await page.route(`**/api/agents/${mockEditingAgent.id}`, async (route, request) => {
      if (request.method() === 'PUT' || request.method() === 'PATCH') { // Typically PUT for full update, PATCH for partial
        updatedAgentData = request.postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, agentId: mockEditingAgent.id }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/agent-builder');

    // Locate the agent card: find a generic card element that contains the specific agent name.
    // This assumes agent names are unique enough for this to work on the visible page.
    // The classes "bg-card shadow-md" are from AgentCard.tsx's root Card component.
    const agentCardLocator = page.locator('div.bg-card.shadow-md', { 
        hasText: mockEditingAgent.agentName 
    }).first();
    
    await expect(agentCardLocator).toBeVisible({ timeout: 10000 });
    // Within that card, find the "Editar" button.
    await agentCardLocator.getByRole('button', { name: /editar/i }).click();

    const dialogLocator = page.getByRole('dialog', { name: /Editar Agente IA/i });
    await expect(dialogLocator).toBeVisible();
    await expect(dialogLocator.getByText(`Modifique as configurações do agente "${mockEditingAgent.agentName}"`)).toBeVisible();

    const navigateToTab = async (tabName: string) => {
      await dialogLocator.getByRole('tab', { name: tabName }).click();
    };
    
    await test.step('Verify General Tab Data', async () => {
      await navigateToTab('General');
      await expect(dialogLocator.getByLabel('Agent Name')).toHaveValue(mockEditingAgent.agentName);
      await expect(dialogLocator.getByLabel('Description')).toHaveValue(mockEditingAgent.agentDescription!);
      await expect(dialogLocator.locator('#config\\.type').locator('xpath=ancestor::button')).toHaveText('Agente LLM (Ex: LlmAgent, para Decisão e Linguagem)');
    });

    await test.step('Verify Behavior Tab Data', async () => {
      await navigateToTab('Behavior');
      if (mockEditingAgent.config.type === 'llm') {
        const llmConfig = mockEditingAgent.config as LLMAgentConfig;
        // LLM Specific fields (Model, Goal, Tasks) - ASSUMED TO BE IN BEHAVIOR TAB
        // Their exact labels/selectors need verification once implemented in BehaviorTab.tsx.
        await expect(dialogLocator.getByLabel('Modelo LLM').locator('xpath=ancestor::button')).toHaveText(llmConfig.agentModel!); // ASSUMED LABEL
        await expect(dialogLocator.getByLabel('Objetivo do Agente')).toHaveValue(llmConfig.agentGoal!); // ASSUMED LABEL
        // For tasks, verification depends on implementation (e.g., if each task is a separate element)
        // For now, we'll check if the first task is present if tasks are in a combined input or list.
        // This part is highly dependent on the eventual UI for tasks.
        // await expect(dialogLocator.getByText(llmConfig.agentTasks![0])).toBeVisible(); // ASSUMED - VERIFY

        await expect(dialogLocator.getByLabel('Agent Personality/Tone').locator('xpath=ancestor::button')).toHaveText('Profissional e Direto');
        
        const temperatureThumb = dialogLocator.locator('#agent-temperature [role="slider-thumb"]');
        await expect(temperatureThumb).toHaveAttribute('aria-valuenow', String(llmConfig.agentTemperature!));
      }
    });

    await test.step('Verify Tools Tab Data', async () => {
      await navigateToTab('Tools');
      for (const toolId of mockEditingAgent.tools!) {
        const toolDetail = mockEditingAgent.toolsDetails?.find(td => td.id === toolId);
        const toolLabel = toolDetail?.label || toolId; // Fallback to ID if label not in details
        await expect(dialogLocator.getByLabel(toolLabel)).toBeChecked();
      }
    });

    await test.step('Verify Memory & Knowledge Tab Data', async () => {
      await navigateToTab('Memory & Knowledge');
      const { statePersistence, rag } = mockEditingAgent.config as LLMAgentConfig;
      await expect(dialogLocator.getByLabel('Enable State Persistence')).toBeChecked({ checked: statePersistence?.enabled });
      if (statePersistence?.enabled) {
        await expect(dialogLocator.getByLabel('Persistence Type').locator('xpath=ancestor::button')).toHaveText('Session (Browser-based)');
      }
      await expect(dialogLocator.getByLabel('Enable RAG (Retrieval Augmented Generation)')).toBeChecked({ checked: rag?.enabled });
      if (rag?.enabled) {
        await expect(dialogLocator.getByLabel('RAG Service Type').locator('xpath=ancestor::button')).toHaveText('In-Memory Vector Store (Testing)');
      }
    });
    
    await test.step('Verify Artifacts Tab Data', async () => {
      await navigateToTab('Artifacts');
      const { artifacts } = mockEditingAgent.config as LLMAgentConfig;
      await expect(dialogLocator.getByLabel('Enable Artifact Management')).toBeChecked({ checked: artifacts?.enabled });
      if (artifacts?.enabled) {
        await expect(dialogLocator.getByLabel('Artifact Storage Type').locator('xpath=ancestor::button')).toHaveText('Memory (In-memory, temporary)');
      }
    });

    await test.step('Verify A2A Tab Data', async () => {
      await navigateToTab('A2A');
      const { a2a } = mockEditingAgent.config as LLMAgentConfig;
      await expect(dialogLocator.getByLabel('Enable Agent-to-Agent (A2A) Communication Features')).toBeChecked({ checked: a2a?.enabled });
    });

    await test.step('Verify Advanced Tab Data', async () => {
      await navigateToTab('Advanced');
      const { adkCallbacks } = mockEditingAgent.config as LLMAgentConfig;
      await expect(dialogLocator.getByLabel('Callback Before Agent')).toHaveValue(adkCallbacks?.beforeAgent || '');
      await expect(dialogLocator.getByLabel('Callback After Tool')).toHaveValue(adkCallbacks?.afterTool || '');
    });

     await test.step('Verify Deploy Tab Data', async () => {
      await navigateToTab('Deploy');
      const { deploymentConfig } = mockEditingAgent.config as LLMAgentConfig;
      await expect(dialogLocator.getByLabel('Plataforma Alvo').locator('xpath=ancestor::button')).toHaveText('Cloud Run');
      // Assuming at least one env var is defined in mock
      if (deploymentConfig?.environmentVariables && deploymentConfig.environmentVariables.length > 0) {
        await expect(dialogLocator.getByPlaceholder('Chave').first()).toHaveValue(deploymentConfig.environmentVariables[0].key);
        await expect(dialogLocator.getByPlaceholder('Valor').first()).toHaveValue(deploymentConfig.environmentVariables[0].value);
      }
    });

    await test.step('Make a small change', async () => {
      await navigateToTab('General');
      await dialogLocator.getByLabel('Description').fill('Updated description after edit.');
    });

    await test.step('Save the edited agent', async () => {
      await dialogLocator.getByRole('button', { name: 'Salvar Agente' }).click();
    });
    
    await test.step('Verify Updated Save Data', async () => {
      await expect.poll(async () => updatedAgentData !== null, { timeout: 5000 }).toBeTruthy();
      expect(updatedAgentData).not.toBeNull();
      if (!updatedAgentData) return;

      expect(updatedAgentData.agentName).toBe(mockEditingAgent.agentName);
      expect(updatedAgentData.agentDescription).toBe('Updated description after edit.');
      expect(updatedAgentData.id).toBe(mockEditingAgent.id); 
      
      expect(updatedAgentData.config.type).toBe(mockEditingAgent.config.type);
      const originalLLMConfig = mockEditingAgent.config as LLMAgentConfig;
      const updatedLLMConfig = updatedAgentData.config as LLMAgentConfig;
      expect(updatedLLMConfig.agentModel).toBe(originalLLMConfig.agentModel);
      expect(updatedAgentData.tools).toEqual(expect.arrayContaining(mockEditingAgent.tools!));
      expect(updatedLLMConfig.adkCallbacks?.beforeAgent).toBe(originalLLMConfig.adkCallbacks?.beforeAgent);
    });
  });
});
