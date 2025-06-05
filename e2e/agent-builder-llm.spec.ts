import { test, expect, Page } from '@playwright/test';

test.describe('Agent Builder - LLM Agent Creation', () => {
  test('should allow creation of a new LLM agent and verify save data', async ({ page }) => {
    let savedAgentData: any = null;
    
    await page.route('**/api/agents', async (route, request) => {
      if (request.method() === 'POST') {
        savedAgentData = request.postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, agentId: 'mock-agent-id-from-network' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/agent-builder');

    await page.getByRole('button', { name: 'Novo Agente (Formulário)' }).click();

    const dialogLocator = page.getByRole('dialog', { name: /Criar Novo Agente IA/i });
    await expect(dialogLocator).toBeVisible();

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
      await dialogLocator.getByLabel('Agent Name').fill('Test LLM Agent');
      await dialogLocator.getByLabel('Description').fill('Description for Test LLM Agent');
      
      await dialogLocator.getByLabel('Agent Type').click();
      await page.getByRole('option', { name: 'Agente LLM (Ex: LlmAgent, para Decisão e Linguagem)' }).click();
    });

    await clickNext(); // To Behavior

    // --- Behavior Tab (Tab 1) ---
    await test.step('Fill Behavior Tab', async () => {
      // NOTE: The following fields (Model, Goal, Tasks) are assumed to be in Behavior tab
      // based on TODO comments in BehaviorTab.tsx. Their exact labels/selectors need verification
      // once implemented in the UI.
      await dialogLocator.getByLabel('Modelo LLM').click(); // ASSUMED LABEL - VERIFY
      await page.getByRole('option', { name: 'gemini-1.5-flash-latest' }).click(); // VERIFY option

      await dialogLocator.getByLabel('Objetivo do Agente').fill('Test goal'); // ASSUMED LABEL - VERIFY
      
      await dialogLocator.getByPlaceholder('Adicione uma tarefa...').fill('Test task 1'); // ASSUMED PLACEHOLDER - VERIFY
      await dialogLocator.getByRole('button', { name: 'Adicionar Tarefa' }).click(); // ASSUMED BUTTON - VERIFY

      // Personality/Tone
      await dialogLocator.getByLabel('Agent Personality/Tone').click(); 
      await page.getByRole('option', { name: 'Criativo e Inspirador' }).click();

      // Temperature Slider
      const temperatureSliderRoot = dialogLocator.locator('#agent-temperature');
      const temperatureThumb = temperatureSliderRoot.locator('[role="slider-thumb"]');
      await expect(temperatureThumb).toBeVisible();
      await temperatureThumb.focus();
      // Default is 0.7, target is 0.8. Step is 0.01. Need 10 steps.
      for (let i = 0; i < 10; i++) {
        await temperatureThumb.press('ArrowRight');
      }
    });
    
    await clickNext(); // To Tools

    // --- Tools Tab (Tab 2) ---
    await test.step('Fill Tools Tab', async () => {
      await dialogLocator.getByLabel('Busca na Web (Google)').check();
    });

    await clickNext();

    // --- Memory & Knowledge Tab (Tab 3) ---
    await test.step('Fill Memory & Knowledge Tab', async () => {
      await dialogLocator.getByLabel('Enable State Persistence').check();
      await dialogLocator.getByLabel('Persistence Type').click(); 
      await page.getByRole('option', { name: 'Session (Browser-based)' }).click();

      await dialogLocator.getByLabel('Enable RAG (Retrieval Augmented Generation)').check();
      await dialogLocator.getByLabel('RAG Service Type').click(); 
      await page.getByRole('option', { name: 'In-Memory Vector Store (Testing)' }).click();
    });

    await clickNext();

    // --- Artifacts Tab (Tab 4) ---
    await test.step('Fill Artifacts Tab', async () => {
      await dialogLocator.getByLabel('Enable Artifact Management').check();
      await dialogLocator.getByLabel('Artifact Storage Type').click(); 
      await page.getByRole('option', { name: 'Memory (In-memory, temporary)' }).click();
    });

    await clickNext();

    // --- A2A Tab (Tab 5) ---
    await test.step('Fill A2A Tab', async () => {
      await dialogLocator.getByLabel('Enable Agent-to-Agent (A2A) Communication Features').check(); // Exact label
    });
    
    await clickNext(); 
    
    // --- Multi-Agent & Advanced Tab (Tab 6) ---
    await test.step('Navigate to Multi-Agent & Advanced Tab', async () => {
      await expect(dialogLocator.getByText('Configurações de Hierarquia e Colaboração Multi-Agente')).toBeVisible();
    });

    await clickNext();

    // --- Advanced (ADK Callbacks) Tab (Tab 7) ---
    await test.step('Fill Advanced (ADK Callbacks) Tab', async () => {
      await dialogLocator.getByLabel('Callback Before Agent').fill('myCustomFlow');
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

    await test.step('Verify Saved Data', async () => {
      await expect.poll(async () => savedAgentData !== null, { timeout: 5000 }).toBeTruthy();
      expect(savedAgentData).not.toBeNull();
      if (!savedAgentData) return;

      expect(savedAgentData.agentName).toBe('Test LLM Agent');
      expect(savedAgentData.agentDescription).toBe('Description for Test LLM Agent');
      expect(savedAgentData.config.type).toBe('llm');
      
      expect(savedAgentData.config.agentModel).toBe('gemini-1.5-flash-latest'); 
      expect(savedAgentData.config.agentGoal).toBe('Test goal');
      expect(savedAgentData.config.agentTasks).toContain('Test task 1');
      expect(savedAgentData.config.agentPersonality).toBe('creative'); 
      expect(savedAgentData.config.agentTemperature).toBe(0.8);

      expect(savedAgentData.tools).toContain('webSearch');
      
      expect(savedAgentData.config.statePersistence?.enabled).toBe(true);
      expect(savedAgentData.config.statePersistence?.type).toBe('session');
      expect(savedAgentData.config.rag?.enabled).toBe(true); // Corrected path from config.knowledge.rag
      expect(savedAgentData.config.rag?.serviceType).toBe('in-memory'); // Corrected path

      expect(savedAgentData.config.artifacts?.enabled).toBe(true);
      expect(savedAgentData.config.artifacts?.storageType).toBe('memory');

      expect(savedAgentData.config.a2a?.enabled).toBe(true);

      expect(savedAgentData.config.adkCallbacks?.beforeAgent).toBe('myCustomFlow');
    });
  });
});
