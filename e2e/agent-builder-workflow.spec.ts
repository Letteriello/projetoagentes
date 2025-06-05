import { test, expect, Page } from '@playwright/test';

test.describe('Agent Builder - Workflow Agent Creation', () => {
  test('should allow creation of a new Workflow agent and verify save data', async ({ page }) => {
    let savedAgentData: any = null;
    
    // Intercept the API call for saving the agent
    await page.route('**/api/agents', async (route, request) => {
      if (request.method() === 'POST') {
        savedAgentData = request.postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, agentId: 'mock-workflow-agent-id' }),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to the agent builder page
    await page.goto('/agent-builder');

    // 1. Open the AgentBuilderDialog for a new agent
    await page.getByRole('button', { name: 'Novo Agente (Formulário)' }).click();

    // Wait for the dialog to be visible
    const dialogLocator = page.getByRole('dialog', { name: /Criar Novo Agente IA/i });
    await expect(dialogLocator).toBeVisible();

    // Helper to click "Próximo"
    const clickNext = async () => {
      await dialogLocator.getByRole('button', { name: 'Próximo' }).click();
    };
     const clickReviewAndSave = async () => {
      const reviewButton = dialogLocator.getByRole('button', { name: 'Revisar' });
      if (await reviewButton.isVisible()) {
        await reviewButton.click();
      }
      await dialogLocator.getByRole('button', { name: 'Salvar Agente' }).click();
    };

    // --- General Tab (Tab 0) ---
    await test.step('Fill General Tab', async () => {
      await dialogLocator.getByLabel('Agent Name').fill('Test Workflow Agent');
      await dialogLocator.getByLabel('Description').fill('Description for Test Workflow Agent');
      
      await dialogLocator.getByLabel('Agent Type').click();
      await page.getByRole('option', { name: 'Agente de Fluxo de Trabalho (Ex: SequentialAgent, ParallelAgent)' }).click();
    });

    await clickNext(); // To Behavior

    // --- Behavior Tab (Tab 1) ---
    await test.step('Fill Behavior Tab for Workflow', async () => {
      // NOTE: The BehaviorTab.tsx currently only shows UI for LLM agents.
      // The following workflow-specific fields are not yet implemented in that tab.
      // These steps are commented out until the UI is available.

      // await dialogLocator.getByLabel('Tipo Detalhado de Fluxo').click(); // ASSUMED LABEL - VERIFY
      // await page.getByRole('option', { name: 'Sequencial (passos executados em ordem)' }).click(); // ASSUMED OPTION - VERIFY for "sequential"

      // await dialogLocator.getByLabel('Descrição do Fluxo').fill('This is a test sequential workflow.'); // ASSUMED LABEL - VERIFY
      
      // As a placeholder for navigation, ensure the tab content (even if it's just the message) is visible
      await expect(dialogLocator.getByText('Behavior settings are applicable to LLM-based agents.')).toBeVisible();
    });
    
    await clickNext(); // To Tools

    // --- Tools Tab (Tab 2) ---
    await test.step('Fill Tools Tab for Workflow', async () => {
      await dialogLocator.getByLabel('Calculadora').check(); 
      await dialogLocator.getByLabel('Busca na Web (Google)').check(); 
    });

    await clickNext(); // To Memory & Knowledge

    // --- Memory & Knowledge Tab (Tab 3) ---
    await test.step('Fill Memory & Knowledge Tab', async () => {
      await dialogLocator.getByLabel('Enable State Persistence').check();
      await dialogLocator.getByLabel('Persistence Type').click(); 
      await page.getByRole('option', { name: 'Memory (Short-term, Server-side)' }).click();
    });

    await clickNext(); // To Artifacts

    // --- Artifacts Tab (Tab 4) ---
    await test.step('Navigate to Artifacts Tab', async () => {
      await expect(dialogLocator.getByText('Enable Artifact Management')).toBeVisible();
    });

    await clickNext(); // To A2A

    // --- A2A Tab (Tab 5) ---
    await test.step('Navigate to A2A Tab', async () => {
      await expect(dialogLocator.getByText('Enable Agent-to-Agent (A2A) Communication Features')).toBeVisible();
    });
    
    await clickNext(); 
    
    // --- Multi-Agent & Advanced Tab (Tab 6) ---
    await test.step('Navigate to Multi-Agent & Advanced Tab', async () => {
      await expect(dialogLocator.getByText('Configurações de Hierarquia e Colaboração Multi-Agente')).toBeVisible();
    });

    await clickNext();

    // --- Advanced (ADK Callbacks) Tab (Tab 7) ---
    await test.step('Fill Advanced (ADK Callbacks) Tab', async () => {
      await dialogLocator.getByLabel('Callback After Tool').fill('myWorkflowStepLogger');
    });

    await clickNext(); 

    // --- Deploy Tab (Tab 8) ---
    await test.step('Navigate to Deploy Tab', async () => {
      await expect(dialogLocator.getByText('Configurações de Deploy')).toBeVisible();
    });
    
    // --- Review Tab (Tab 9) & Save ---
    await test.step('Navigate to Review Tab and Save', async () => {
      await clickReviewAndSave();
    });

    // 13. Verify the intercepted save data
    await test.step('Verify Saved Data for Workflow Agent', async () => {
      await expect.poll(async () => savedAgentData !== null, { timeout: 5000 }).toBeTruthy();
      expect(savedAgentData).not.toBeNull();
      if (!savedAgentData) return; 

      expect(savedAgentData.agentName).toBe('Test Workflow Agent');
      expect(savedAgentData.agentDescription).toBe('Description for Test Workflow Agent');
      expect(savedAgentData.config.type).toBe('workflow');
      
      // Workflow specific fields from config (based on WorkflowAgentConfig)
      // The UI for these fields is not yet implemented in BehaviorTab.tsx for workflow type.
      // So, these fields would likely be undefined or default in the saved data.
      // expect(savedAgentData.config.detailedWorkflowType).toBe('sequential'); // VERIFY actual saved value if UI was present
      // expect(savedAgentData.config.workflowDescription).toBe('This is a test sequential workflow.'); // VERIFY if UI was present

      // Check if these keys exist, they might be undefined if not set by any UI
      expect(savedAgentData.config).toHaveProperty('detailedWorkflowType'); // It will be undefined or default from schema
      expect(savedAgentData.config).toHaveProperty('workflowDescription'); // It will be undefined or default from schema


      expect(savedAgentData.tools).toEqual(expect.arrayContaining(['calculator', 'webSearch']));
      expect(savedAgentData.tools.length).toBe(2);

      expect(savedAgentData.config.statePersistence?.enabled).toBe(true);
      expect(savedAgentData.config.statePersistence?.type).toBe('memory');

      expect(savedAgentData.config.adkCallbacks?.afterTool).toBe('myWorkflowStepLogger');
    });
  });
});
