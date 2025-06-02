import { test, expect, Page } from '@playwright/test';
import type { SavedAgentConfiguration, LLMAgentConfig } from '../src/types/agent-configs'; // Adjust path

const sampleJsonConfig: SavedAgentConfiguration = {
  id: "imported-agent-id-67890", // This ID might be overridden by the application upon import/save
  agentName: "Imported LLM Agent",
  agentDescription: "Description for Imported Agent from JSON.",
  agentVersion: "1.1.0",
  icon: "Brain", // Assuming 'Brain' maps to an icon component like Cpu
  templateId: "llm_from_json_template",
  isTemplate: false,
  isFavorite: false, // Different from edit mock
  tags: ["imported", "llm_test"],
  createdAt: "2023-02-01T00:00:00.000Z", // Specific date for import
  updatedAt: "2023-02-02T00:00:00.000Z", // Specific date for import
  userId: "import-user-id",
  config: {
    type: "llm",
    framework: "genkit",
    agentModel: "gemini-1.0-pro", // Different model
    agentGoal: "To demonstrate successful import functionality.",
    agentTasks: ["Parse imported JSON", "Populate form fields"],
    agentPersonality: "analytical", // 'Analítico e Detalhista'
    agentRestrictions: ["Must adhere to import schema"],
    agentTemperature: 0.5,
    systemPromptGenerated: "System prompt generated for imported agent.",
    safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }],
    statePersistence: { 
      enabled: true, 
      type: "database", // Different type
      defaultScope: "GLOBAL", 
      initialStateValues: [{ key: "imported_state", value: JSON.stringify({imported: true}), scope: "GLOBAL", description: "Imported state value" }],
      validationRules: []
    },
    rag: { 
      enabled: true, 
      serviceType: "vertex_ai_rag", // Different type
      knowledgeSources: [{id: "ks_import", name: "Imported Doc", type: "url", path: "http://example.com/doc.pdf", status: "pending"}],
      retrievalParameters: { topK: 5, similarityThreshold: 0.6 },
      persistentMemory: { enabled: true, storagePath: "/vectors/imported" }
    },
    artifacts: { 
      enabled: true, 
      storageType: "filesystem", // Different type
      localStoragePath: "/tmp/imported_artifacts",
      definitions: [{id: "art_imp", name: "imported_artifact.json", description: "Data from import", mimeType: "application/json", required: true, accessPermissions: "read", versioningEnabled: true}]
    },
    a2a: { 
      enabled: true, 
      communicationChannels: [{id: "chan_imp", name: "imported_notifications", direction: "inbound", messageFormat: "text", syncMode: "sync"}],
      defaultResponseFormat: "text",
      securityPolicy: "jwt",
      loggingEnabled: false
    },
    adkCallbacks: { 
      beforeAgent: "importedBeforeAgentFlow",
      afterModel: "importedAfterModelFlow"
    },
    deploymentConfig: {
      targetPlatform: "gke",
      environmentVariables: [{key: "IMPORT_MODE", value: "true"}],
      resourceRequirements: { cpu: "2", memory: "1Gi"}
    }
  } as LLMAgentConfig, // Type assertion
  tools: ["calculator"], // Different tool
  toolConfigsApplied: {
    "calculator": { /* no specific config for calculator in this example */ }
  },
  toolsDetails: [ // This field is usually populated by the backend or UI logic based on `tools`
    { id: "calculator", label: "Calculadora", iconName: "Calculator", genkitToolName: "calculator" }
  ],
  internalVersion: 1,
  isLatest: true,
  originalAgentId: "imported-agent-id-67890",
};

// Function to get display name for tab values
const getTabDisplayName = (tabValue: string): string => {
  return tabValue.charAt(0).toUpperCase() + tabValue.slice(1).replace(/_/g, " ");
};

test.describe('Agent Builder - Import Agent Configuration', () => {
  test('should import config, populate fields, and save correctly', async ({ page }) => {
    let savedAgentData: any = null;

    // Intercept the POST request for saving the new agent from import
    await page.route('**/api/agents', async (route, request) => {
      if (request.method() === 'POST') {
        savedAgentData = request.postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, agentId: savedAgentData.id || "new-imported-agent-id" }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/agent-builder');
    await page.getByRole('button', { name: 'Novo Agente (Formulário)' }).click();
    const dialogLocator = page.getByRole('dialog', { name: /Criar Novo Agente IA/i });
    await expect(dialogLocator).toBeVisible();

    // 3. Simulate File Input
    const fileContent = Buffer.from(JSON.stringify(sampleJsonConfig));
    const fileInputLocator = dialogLocator.locator('input[type="file"]');
    await expect(fileInputLocator).toBeHidden(); // As per style={{ display: "none" }}

    // Playwright needs the input to be visible to set files.
    // Temporarily make it visible, set files, then it can go back to being hidden.
    // This is a common workaround for hidden file inputs.
    await fileInputLocator.evaluate(element => element.style.display = 'block'); 
    await fileInputLocator.setInputFiles({
      name: 'import-config.json',
      mimeType: 'application/json',
      buffer: fileContent,
    });
    // No need to hide it again, as the import handler should have processed it.

    // Add a short delay or wait for a specific field to be populated to ensure import processing is done
    await expect(dialogLocator.getByLabel('Agent Name')).toHaveValue(sampleJsonConfig.agentName, { timeout: 5000 });


    // 4. Verify Data Loading across tabs
    const llmConfig = sampleJsonConfig.config as LLMAgentConfig;

    await test.step('Verify General Tab Data after Import', async () => {
      // Active by default after import (usually)
      await expect(dialogLocator.getByLabel('Agent Name')).toHaveValue(sampleJsonConfig.agentName);
      await expect(dialogLocator.getByLabel('Description')).toHaveValue(sampleJsonConfig.agentDescription!);
      await expect(dialogLocator.locator('#config\\.type').locator('xpath=ancestor::button')).toHaveText('Agente LLM (Ex: LlmAgent, para Decisão e Linguagem)');
    });

    await test.step('Verify Behavior Tab Data after Import', async () => {
      await dialogLocator.getByRole('tab', { name: getTabDisplayName('behavior') }).click();
        // LLM Specific fields (Model, Goal, Tasks) - ASSUMED TO BE IN BEHAVIOR TAB
        // Their exact labels/selectors need verification once implemented in BehaviorTab.tsx.
        await expect(dialogLocator.getByLabel('Modelo LLM').locator('xpath=ancestor::button')).toHaveText(llmConfig.agentModel!); // ASSUMED LABEL
        await expect(dialogLocator.getByLabel('Objetivo do Agente')).toHaveValue(llmConfig.agentGoal!); // ASSUMED LABEL
        // Task verification depends on UI implementation (e.g., if tasks are listed)
        // For now, check if the first task is visible or part of a text area if combined.
        // This is a placeholder:
        // await expect(dialogLocator.getByText(llmConfig.agentTasks![0])).toBeVisible();


      await expect(dialogLocator.getByLabel('Agent Personality/Tone').locator('xpath=ancestor::button')).toHaveText('Analítico e Detalhista'); // analytical
      const temperatureThumb = dialogLocator.locator('#agent-temperature [role="slider-thumb"]');
      await expect(temperatureThumb).toHaveAttribute('aria-valuenow', String(llmConfig.agentTemperature!));
    });

    await test.step('Verify Tools Tab Data after Import', async () => {
      await dialogLocator.getByRole('tab', { name: getTabDisplayName('tools') }).click();
      for (const toolId of sampleJsonConfig.tools!) {
        const toolDetail = sampleJsonConfig.toolsDetails?.find(td => td.id === toolId);
        await expect(dialogLocator.getByLabel(toolDetail!.label)).toBeChecked();
      }
    });
    
    await test.step('Verify Memory & Knowledge Tab Data after Import', async () => {
      await dialogLocator.getByRole('tab', { name: getTabDisplayName('memory_knowledge') }).click();
      const { statePersistence, rag } = llmConfig;
      await expect(dialogLocator.getByLabel('Enable State Persistence')).toBeChecked({ checked: statePersistence?.enabled });
      if (statePersistence?.enabled) {
        await expect(dialogLocator.getByLabel('Persistence Type').locator('xpath=ancestor::button')).toHaveText('Database (Long-term)');
      }
      await expect(dialogLocator.getByLabel('Enable RAG (Retrieval Augmented Generation)')).toBeChecked({ checked: rag?.enabled });
      if (rag?.enabled) {
        await expect(dialogLocator.getByLabel('RAG Service Type').locator('xpath=ancestor::button')).toHaveText('Vertex AI RAG API');
      }
    });

    await test.step('Verify Artifacts Tab Data after Import', async () => {
      await dialogLocator.getByRole('tab', { name: getTabDisplayName('artifacts') }).click();
      const { artifacts } = llmConfig;
      await expect(dialogLocator.getByLabel('Enable Artifact Management')).toBeChecked({ checked: artifacts?.enabled });
      if (artifacts?.enabled) {
        await expect(dialogLocator.getByLabel('Artifact Storage Type').locator('xpath=ancestor::button')).toHaveText('Local Filesystem');
      }
    });

    await test.step('Verify A2A Tab Data after Import', async () => {
      await dialogLocator.getByRole('tab', { name: getTabDisplayName('a2a') }).click();
      const { a2a } = llmConfig;
      await expect(dialogLocator.getByLabel('Enable Agent-to-Agent (A2A) Communication Features')).toBeChecked({ checked: a2a?.enabled });
    });
    
    await test.step('Verify Advanced Tab Data after Import', async () => {
      await dialogLocator.getByRole('tab', { name: getTabDisplayName('advanced') }).click();
      const { adkCallbacks } = llmConfig;
      await expect(dialogLocator.getByLabel('Callback Before Agent')).toHaveValue(adkCallbacks?.beforeAgent || '');
      await expect(dialogLocator.getByLabel('Callback After Model')).toHaveValue(adkCallbacks?.afterModel || '');
    });

    await test.step('Verify Deploy Tab Data after Import', async () => {
      await dialogLocator.getByRole('tab', { name: getTabDisplayName('deploy') }).click();
      const { deploymentConfig } = llmConfig;
      await expect(dialogLocator.getByLabel('Plataforma Alvo').locator('xpath=ancestor::button')).toHaveText('Google Kubernetes Engine (GKE)');
      if (deploymentConfig?.environmentVariables && deploymentConfig.environmentVariables.length > 0) {
        await expect(dialogLocator.getByPlaceholder('Chave').first()).toHaveValue(deploymentConfig.environmentVariables[0].key);
        await expect(dialogLocator.getByPlaceholder('Valor').first()).toHaveValue(deploymentConfig.environmentVariables[0].value);
      }
    });

    // 5. Save the Imported Agent
    await test.step('Save the imported agent configuration', async () => {
      // Navigate to Review tab (wizard mode)
      const reviewButton = dialogLocator.getByRole('button', { name: 'Revisar' });
      // Need to click through "Próximo" until "Revisar" is available or directly click review tab if enabled
      // For simplicity, assuming direct click to Review tab is possible after import populates things
      // Or that import places user on first tab and they need to 'Next' through
      // The dialog is in wizard mode (new agent)
      
      // Click "Next" until on Review tab
      for (const tab of tabOrder) {
        if (tab === 'review') break;
        const nextBtn = dialogLocator.getByRole('button', { name: 'Próximo' });
        if (await nextBtn.isVisible()){
            await nextBtn.click();
        } else { // Should be on the step before Review, where button is "Revisar"
            const reviewBtn = dialogLocator.getByRole('button', { name: 'Revisar' });
            if(await reviewBtn.isVisible()) {
                await reviewBtn.click();
            }
            break;
        }
      }
      await expect(dialogLocator.getByRole('tab', {name: getTabDisplayName('review'), selected: true})).toBeVisible();
      await dialogLocator.getByRole('button', { name: 'Salvar Agente' }).click();
    });

    // 6. Verify onSave Data
    await test.step('Verify Saved Data matches imported data', async () => {
      await expect.poll(async () => savedAgentData !== null, { timeout: 5000 }).toBeTruthy();
      expect(savedAgentData).not.toBeNull();
      if (!savedAgentData) return;

      // ID might be regenerated. Timestamps likely updated.
      expect(savedAgentData.agentName).toBe(sampleJsonConfig.agentName);
      expect(savedAgentData.agentDescription).toBe(sampleJsonConfig.agentDescription);
      expect(savedAgentData.agentVersion).toBe(sampleJsonConfig.agentVersion);
      // expect(savedAgentData.icon).toBe(sampleJsonConfig.icon); // Icon mapping might differ

      expect(savedAgentData.config.type).toBe(sampleJsonConfig.config.type);
      const savedLLMConfig = savedAgentData.config as LLMAgentConfig;
      const originalLLMConfig = sampleJsonConfig.config as LLMAgentConfig;

      expect(savedLLMConfig.agentModel).toBe(originalLLMConfig.agentModel);
      expect(savedLLMConfig.agentGoal).toBe(originalLLMConfig.agentGoal);
      expect(savedLLMConfig.agentTasks).toEqual(originalLLMConfig.agentTasks);
      expect(savedLLMConfig.agentPersonality).toBe(originalLLMConfig.agentPersonality);
      expect(savedLLMConfig.agentTemperature).toBe(originalLLMConfig.agentTemperature);
      
      expect(savedAgentData.tools).toEqual(expect.arrayContaining(sampleJsonConfig.tools!));
      
      expect(savedLLMConfig.statePersistence?.enabled).toBe(originalLLMConfig.statePersistence?.enabled);
      expect(savedLLMConfig.statePersistence?.type).toBe(originalLLMConfig.statePersistence?.type);
      
      expect(savedLLMConfig.rag?.enabled).toBe(originalLLMConfig.rag?.enabled);
      expect(savedLLMConfig.rag?.serviceType).toBe(originalLLMConfig.rag?.serviceType);

      expect(savedLLMConfig.artifacts?.enabled).toBe(originalLLMConfig.artifacts?.enabled);
      expect(savedLLMConfig.artifacts?.storageType).toBe(originalLLMConfig.artifacts?.storageType);
      
      expect(savedLLMConfig.a2a?.enabled).toBe(originalLLMConfig.a2a?.enabled);
      expect(savedLLMConfig.adkCallbacks?.beforeAgent).toBe(originalLLMConfig.adkCallbacks?.beforeAgent);
      expect(savedLLMConfig.deploymentConfig?.targetPlatform).toBe(originalLLMConfig.deploymentConfig?.targetPlatform);

      // Check if ID is new (typical for import then save as new)
      // This depends on application logic. If it's meant to overwrite by ID, this check would be different.
      // For a "create new agent from import", a new ID is expected.
      // The current POST to /api/agents suggests it's creating a new agent.
      expect(savedAgentData.id).not.toBe(sampleJsonConfig.id); 
    });
  });
});
