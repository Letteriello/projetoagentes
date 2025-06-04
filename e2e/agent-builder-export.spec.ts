import { test, expect, Page } from '@playwright/test';
import type { SavedAgentConfiguration, LLMAgentConfig } from '../src/types/agent-configs'; // Adjust path as needed
import * as fs from 'fs'; // For reading the downloaded file
import * as path from 'path'; // For handling file paths if needed, though download.path() is absolute

const mockEditingAgent: SavedAgentConfiguration = {
  id: "export-test-agent-id-78901",
  agentName: "Export Test LLM Agent",
  agentDescription: "Description for agent to be exported.",
  agentVersion: "2.0.0",
  icon: "cpu",
  templateId: "llm_export_template",
  isTemplate: false,
  isFavorite: false,
  tags: ["export", "test"],
  createdAt: "2023-03-01T10:00:00.000Z",
  updatedAt: "2023-03-01T11:00:00.000Z", // Specific updatedAt for comparison
  userId: "export-user-id",
  config: {
    type: "llm",
    framework: "genkit",
    agentModel: "gemini-1.5-pro-latest",
    agentGoal: "To be successfully exported.",
    agentTasks: ["Task A for export", "Task B for export"],
    agentPersonality: "analytical",
    agentRestrictions: ["Export restrictions apply"],
    agentTemperature: 0.45,
    systemPromptGenerated: "System prompt for Export Test LLM Agent.",
    safetySettings: [{ category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_LOW_AND_ABOVE" }],
    statePersistence: { 
      enabled: true, 
      type: "database", 
      defaultScope: "GLOBAL", 
      initialStateValues: [{ key: "export_state", value: JSON.stringify({canExport: true}), scope: "GLOBAL", description: "Export state" }],
      validationRules: []
    },
    rag: { 
      enabled: false, // Different from import/edit mocks
      serviceType: "in-memory", 
      knowledgeSources: [],
      retrievalParameters: {},
      persistentMemory: { enabled: false }
    },
    artifacts: { 
      enabled: true, 
      storageType: "cloud", 
      cloudStorageBucket: "my-export-bucket",
      definitions: [{id: "art_exp", name: "exported_doc.pdf", description: "Document from export", mimeType: "application/pdf", required: false, accessPermissions: "read_write", versioningEnabled: false}]
    },
    a2a: { 
      enabled: false, // Different
      communicationChannels: [],
      defaultResponseFormat: "json",
      securityPolicy: "none",
      loggingEnabled: false
    },
    adkCallbacks: { 
      afterAgent: "customAfterAgentExportFlow"
    },
    deploymentConfig: {
      targetPlatform: "vertexAI",
      environmentVariables: [{key: "EXPORT_FLAG", value: "active"}],
      resourceRequirements: { cpu: "0.5", memory: "256Mi"}
    }
  } as LLMAgentConfig,
  tools: ["calculator"],
  toolConfigsApplied: {},
  toolsDetails: [
    { id: "calculator", label: "Calculadora", iconName: "Calculator", genkitToolName: "calculator" }
  ],
  internalVersion: 1,
  isLatest: true,
  originalAgentId: "export-test-agent-id-78901",
};

test.describe('Agent Builder - Export Agent Configuration', () => {
  test('should export the agent configuration as a JSON file', async ({ page }) => {
    // 1. Intercept the initial GET request to load agents and inject mockEditingAgent
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

    // Navigate to the agent builder page
    await page.goto('/agent-builder');

    // Find and click the "Edit" button for the mockEditingAgent
    const agentCardLocator = page.locator('div.bg-card.shadow-md', { 
        hasText: mockEditingAgent.agentName 
    }).first();
    await expect(agentCardLocator).toBeVisible({ timeout: 10000 });
    await agentCardLocator.getByRole('button', { name: /editar/i }).click();

    // Wait for the dialog to be visible and in edit mode
    const dialogLocator = page.getByRole('dialog', { name: /Editar Agente IA/i });
    await expect(dialogLocator).toBeVisible();
    await expect(dialogLocator.getByText(`Modifique as configurações do agente "${mockEditingAgent.agentName}"`)).toBeVisible();

    // 2. Trigger Export and 3. Capture Downloaded File
    const [ download ] = await Promise.all([
      page.waitForEvent('download'), // Wait for the download event
      dialogLocator.getByRole('button', { name: 'Exportar Configuração' }).click() // Click the export button
    ]);

    // 4. Verify Downloaded File Content
    const expectedFilename = `${mockEditingAgent.agentName}-config.json`;
    expect(download.suggestedFilename()).toBe(expectedFilename);

    const downloadedFilePath = await download.path();
    if (!downloadedFilePath) {
      throw new Error("Download path is null or undefined.");
    }

    const fileContentBuffer = fs.readFileSync(downloadedFilePath);
    const exportedJson = JSON.parse(fileContentBuffer.toString());

    // 5. Data Verification
    // Perform a deep comparison.
    // Note: The export function in AgentBuilderDialog calls `methods.getValues()`.
    // This means it exports the current state of the form.
    // If the form correctly loads `mockEditingAgent`, then `exportedJson` should match `mockEditingAgent`.
    // We might need to exclude fields that are dynamically added/modified by the frontend but not part of the core config,
    // or fields that are intentionally changed during export (though not apparent from current handleExport).
    // For now, a direct deep equal is the goal.
    
    // Dates in JSON are strings. If mockEditingAgent has Date objects, they need to be stringified for comparison,
    // or parse exported date strings back to Date objects if comparing against original Date objects.
    // mockEditingAgent already uses ISO strings for createdAt and updatedAt, so it should be fine.

    // RHF's getValues() might return empty objects for some non-enabled nested configs, 
    // while mockEditingAgent might have them as undefined or with `enabled:false`.
    // Let's prepare a version of mockEditingAgent that reflects what RHF getValues() would return
    // if some optional nested objects are not fully populated due to `enabled: false`.
    // However, the `createDefaultSavedAgentConfiguration` initializes these.
    // The most straightforward is to expect exportedJson to match mockEditingAgent.

    expect(exportedJson.id).toBe(mockEditingAgent.id);
    expect(exportedJson.agentName).toBe(mockEditingAgent.agentName);
    expect(exportedJson.agentDescription).toBe(mockEditingAgent.agentDescription);
    expect(exportedJson.agentVersion).toBe(mockEditingAgent.agentVersion);
    expect(exportedJson.config.type).toBe(mockEditingAgent.config.type);
    expect(exportedJson.config.framework).toBe(mockEditingAgent.config.framework);
    
    // LLM specific from mock
    const exportedLLMConfig = exportedJson.config as LLMAgentConfig;
    const mockLLMConfig = mockEditingAgent.config as LLMAgentConfig;
    expect(exportedLLMConfig.agentModel).toBe(mockLLMConfig.agentModel);
    expect(exportedLLMConfig.agentGoal).toBe(mockLLMConfig.agentGoal);
    expect(exportedLLMConfig.agentTasks).toEqual(mockLLMConfig.agentTasks);
    expect(exportedLLMConfig.agentPersonality).toBe(mockLLMConfig.agentPersonality);
    expect(exportedLLMConfig.agentTemperature).toBe(mockLLMConfig.agentTemperature);

    expect(exportedJson.tools).toEqual(mockEditingAgent.tools);

    // Compare a few nested structures. For a full check, a deep recursive comparison would be best.
    expect(exportedLLMConfig.statePersistence).toEqual(mockLLMConfig.statePersistence);
    // RAG was disabled in this mock, so its specific fields might be default or absent if not careful with getValues() behavior
     if (mockLLMConfig.rag?.enabled) {
      expect(exportedLLMConfig.rag).toEqual(mockLLMConfig.rag);
    } else {
      // If RAG is disabled, its sub-fields might not be present or might be default values from form initialization
      // For this mock, rag.enabled is false. The default init creates rag object.
      expect(exportedLLMConfig.rag?.enabled).toBe(false);
    }

    expect(exportedLLMConfig.artifacts).toEqual(mockLLMConfig.artifacts);
    
    if (mockLLMConfig.a2a?.enabled) {
        expect(exportedLLMConfig.a2a).toEqual(mockLLMConfig.a2a);
    } else {
        expect(exportedLLMConfig.a2a?.enabled).toBe(false);
    }
    
    expect(exportedLLMConfig.adkCallbacks).toEqual(mockLLMConfig.adkCallbacks);
    expect(exportedLLMConfig.deploymentConfig).toEqual(mockLLMConfig.deploymentConfig);

    // A full deep equal is generally good if the export is a pure dump of the form state
    // which was initialized by mockEditingAgent.
    // Using toEqual for the whole object after checking a few key parts.
    // Minor differences in how RHF getValues() returns vs raw mock object might need normalization if this fails.
    // (e.g. undefined vs missing properties, or empty arrays vs undefined)
    // For now, let's assume they are structurally identical.
    expect(exportedJson).toEqual(mockEditingAgent);

  });
});
