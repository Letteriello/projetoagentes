import { test, expect, Page } from '@playwright/test';

// Helper to get display name for tab values, assuming it's defined elsewhere or here
const getTabDisplayName = (tabValue: string): string => {
  return tabValue.charAt(0).toUpperCase() + tabValue.slice(1).replace(/_/g, " ");
};

test.describe('Agent Builder - Field Validation Errors', () => {
  let page: Page;
  let dialogLocator: any;
  let saveNetworkCallMade: boolean;

  test.beforeEach(async ({ page: newPage, baseURL }) => {
    page = newPage; // Use the page fixture from the test
    saveNetworkCallMade = false;

    await page.route('**/api/agents', async (route, request) => {
      if (request.method() === 'POST') {
        saveNetworkCallMade = true;
        // In a real error test, we don't want the call to succeed if it's made.
        // But for checking *if* it's made, just flagging is enough.
        // For stricter test, could make it route.abort() if saveNetworkCallMade should be false.
        await route.fulfill({ status: 500, body: 'Save should have been blocked by validation' });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${baseURL}/agent-builder`);
    await page.getByRole('button', { name: 'Novo Agente (Formulário)' }).click();
    dialogLocator = page.getByRole('dialog', { name: /Criar Novo Agente IA/i });
    await expect(dialogLocator).toBeVisible();
  });

  test('Scenario 1: Attempt to Save with Empty General Tab (and default LLM type)', async () => {
    await dialogLocator.getByRole('tab', { name: getTabDisplayName('review') }).click();
    await dialogLocator.getByRole('button', { name: 'Salvar Agente' }).click();

    // Check for error messages. Selectors might need refinement based on actual UI.
    // Assuming errors are displayed as text near labels or inputs.
    // Zod messages from schema:
    // agentName: "Agent name is required."
    // agentDescription: "Agent description is required."
    // For LLM (default type):
    // agentGoal: "Agent goal is required."
    // agentTasks: "At least one agent task is required." (or "Task cannot be empty." if array is present but item is empty)
    // agentModel: "Agent model is required."

    // It's possible RHF focuses the first invalid tab. Let's check if General tab is active.
    await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName('general'), selected: true })).toBeVisible({timeout: 5000});

    // Verify errors in General Tab
    await expect(dialogLocator.getByText("Agent name is required.")).toBeVisible();
    await expect(dialogLocator.getByText("Agent description is required.")).toBeVisible();
    
    // Since default type is LLM, and LLM fields (Model, Goal, Tasks) are assumed to be in Behavior tab
    // The validation should still trigger for the overall schema.
    // The UI might navigate to the Behavior tab if errors are there.
    // For this test, let's assume the user is forced back to the first tab with errors (General).
    // If Model, Goal, Tasks errors are shown on General tab, or if a summary is shown, adjust.
    // If UI auto-navigates to Behavior tab for its errors:
    // await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName('behavior'), selected: true })).toBeVisible();
    
    // For now, check if the save call was NOT made
    expect(saveNetworkCallMade, "Save API call was made when form validation should have failed").toBe(false);
  });
  
  test('Scenario 1.1: Verify LLM field errors when saving empty form from Review', async () => {
    await dialogLocator.getByRole('tab', { name: getTabDisplayName('review') }).click();
    await dialogLocator.getByRole('button', { name: 'Salvar Agente' }).click();

    // After clicking save, RHF might take user to the first tab with errors.
    // LLM fields (Model, Goal, Tasks) are assumed in Behavior tab.
    // If validation is smart, it might take us there.
    // For now, let's assume we need to manually navigate to Behavior tab to see these specific errors
    // OR that the errors prevent tab switching away from the first invalid tab (General).
    // If the form auto-navigates to the tab with the first error:
    // Test if it navigates to General for name/desc, then if fixed, would it go to Behavior for LLM fields?
    // This specific test focuses on what happens if you hit save from Review with a totally empty form.

    // Let's check for the general errors first (on general tab)
    await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName('general'), selected: true })).toBeVisible({timeout: 5000});
    await expect(dialogLocator.getByText("Agent name is required.")).toBeVisible();

    // Then, assuming these LLM field errors are tied to fields in the Behavior tab.
    // We need to navigate to Behavior tab to see the field-specific errors IF they aren't summarized.
    // This part of the test might need adjustment based on where LLM fields are implemented.
    // For now, we'll assume the schema validation runs and we can check for error messages
    // that should appear somewhere if those fields are required.
    // These texts are from the Zod schema.
    await expect(dialogLocator.getByText("Agent model is required.")).toBeVisible(); // This might be near a Model Select
    await expect(dialogLocator.getByText("Agent goal is required.")).toBeVisible(); // This might be near Goal Input
    await expect(dialogLocator.getByText("At least one agent task is required.")).toBeVisible(); // This might be near Tasks Input/Area

    expect(saveNetworkCallMade, "Save API call was made with empty LLM fields").toBe(false);
  });


  test('Scenario 2: Fill Agent Name only, attempt to save', async () => {
    await dialogLocator.getByRole('tab', { name: getTabDisplayName('general') }).click();
    await dialogLocator.getByLabel('Agent Name').fill('Test Agent With Name Only');
    
    await dialogLocator.getByRole('tab', { name: getTabDisplayName('review') }).click();
    await dialogLocator.getByRole('button', { name: 'Salvar Agente' }).click();

    await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName('general'), selected: true })).toBeVisible({timeout: 5000});
    await expect(dialogLocator.getByText("Agent description is required.")).toBeVisible();
    // LLM fields errors (model, goal, tasks) should also be visible as in Scenario 1.1
    await expect(dialogLocator.getByText("Agent model is required.")).toBeVisible();
    await expect(dialogLocator.getByText("Agent goal is required.")).toBeVisible();
    await expect(dialogLocator.getByText("At least one agent task is required.")).toBeVisible();

    expect(saveNetworkCallMade, "Save API call was made with missing description and LLM fields").toBe(false);
  });

  test('Scenario 3: LLM type, Name & Desc filled, LLM fields empty, attempt to save', async () => {
    await dialogLocator.getByRole('tab', { name: getTabDisplayName('general') }).click();
    // Agent Type is LLM by default via createDefaultSavedAgentConfiguration
    // await dialogLocator.getByLabel('Agent Type').click(); // Not needed if already LLM
    // await page.getByRole('option', { name: 'Agente LLM (Ex: LlmAgent, para Decisão e Linguagem)' }).click();
    
    await dialogLocator.getByLabel('Agent Name').fill('LLM Agent With General Info');
    await dialogLocator.getByLabel('Description').fill('This LLM agent has a name and description.');

    // LLM fields (Model, Goal, Tasks) are in Behavior tab and are currently empty.
    // Navigate to Review and attempt to save.
    await dialogLocator.getByRole('tab', { name: getTabDisplayName('review') }).click();
    await dialogLocator.getByRole('button', { name: 'Salvar Agente' }).click();

    // Expect to be navigated to the Behavior tab (or the first tab with errors for LLM fields)
    // This assumes Model, Goal, Tasks are in Behavior tab.
    await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName('behavior'), selected: true })).toBeVisible({timeout: 5000});
    
    await expect(dialogLocator.getByText("Agent model is required.")).toBeVisible();
    await expect(dialogLocator.getByText("Agent goal is required.")).toBeVisible();
    await expect(dialogLocator.getByText("At least one agent task is required.")).toBeVisible();
    
    expect(saveNetworkCallMade, "Save API call was made with empty LLM specific fields").toBe(false);
  });

  test('Scenario 4: Invalid Agent Temperature (LLM Agent)', async () => {
    await dialogLocator.getByRole('tab', { name: getTabDisplayName('general') }).click();
    await dialogLocator.getByLabel('Agent Name').fill('Temp Test Agent');
    await dialogLocator.getByLabel('Description').fill('Testing invalid temperature.');
    // Agent Type is LLM by default.

    // Fill required LLM fields (Model, Goal, Tasks) - assumed in Behavior tab
    // These are placeholders as their UI isn't fully confirmed in BehaviorTab.tsx
    await dialogLocator.getByRole('tab', { name: getTabDisplayName('behavior') }).click();
    await dialogLocator.getByLabel('Modelo LLM').click(); // ASSUMED LABEL
    await page.getByRole('option', { name: 'gemini-1.5-flash-latest' }).click(); // Default model
    await dialogLocator.getByLabel('Objetivo do Agente').fill('Test temperature validation.'); // ASSUMED LABEL
    await dialogLocator.getByPlaceholder('Adicione uma tarefa...').fill('Valid task.'); // ASSUMED PLACEHOLDER
    await dialogLocator.getByRole('button', { name: 'Adicionar Tarefa' }).click(); // ASSUMED BUTTON

    // Attempt to set invalid temperature "abc"
    // The slider doesn't take text. We'll try to set RHF value directly if possible,
    // or check if trying to save without touching slider (if it has no valid default for RHF) causes error.
    // For now, let's assume direct interaction with an input field for temperature if it existed.
    // Since it's a slider, we test the Zod schema by trying to submit a value that violates it.
    // We will attempt to set the RHF value for temperature to something invalid using page.evaluate
    // This tests if the Zod schema catches it on submit, not necessarily a direct UI input error for "abc" into the slider.
    
    // First, try with a number out of max range (Zod schema: max(2), slider UI is 0-1)
    // We need to change the value in react-hook-form's state for this test.
    await page.evaluate(() => {
      // @ts-ignore // Accessing form instance, assuming it's available globally for test or via context
      window.triggerRHFSetValue('config.agentTemperature', 5); // Value > 2
    });

    await dialogLocator.getByRole('tab', { name: getTabDisplayName('review') }).click();
    await dialogLocator.getByRole('button', { name: 'Salvar Agente' }).click();
    
    // Expect navigation back to Behavior tab where temperature field is
    await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName('behavior'), selected: true })).toBeVisible({timeout: 5000});
    await expect(dialogLocator.getByText("Number must be less than or equal to 2")).toBeVisible();
    expect(saveNetworkCallMade, "Save API call was made with temperature > 2").toBe(false);
    saveNetworkCallMade = false; // Reset flag

    // Try with non-numeric - this is harder to simulate for a slider RHF field directly
    // Zod's `z.number()` would show "Expected number, received nan" if a non-number is forced and submitted.
    // However, the slider component itself likely prevents non-numeric values from being set via UI.
    // This part of the test is more about schema robustness if invalid data could reach it.
    // We'll skip trying to force "abc" into the slider via UI for now as it's not a realistic user path for that component.
  });

  test('Scenario 5: Invalid Max Message Size (A2A Communication)', async () => {
    // Fill general tab
    await dialogLocator.getByRole('tab', { name: getTabDisplayName('general') }).click();
    await dialogLocator.getByLabel('Agent Name').fill('A2A Error Test Agent');
    await dialogLocator.getByLabel('Description').fill('Testing A2A max message size errors.');

    // Navigate to A2A tab and enable A2A
    await dialogLocator.getByRole('tab', { name: getTabDisplayName('a2a') }).click();
    await dialogLocator.getByLabel('Enable Agent-to-Agent (A2A) Communication Features').check();

    const maxMessageSizeInput = dialogLocator.locator('#config\\.a2a\\.maxMessageSize'); // From A2AConfig.tsx

    // Test with non-numeric string
    await maxMessageSizeInput.fill("abc");
    await dialogLocator.getByRole('tab', { name: getTabDisplayName('review') }).click();
    await dialogLocator.getByRole('button', { name: 'Salvar Agente' }).click();
    await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName('a2a'), selected: true })).toBeVisible({timeout: 5000});
    await expect(dialogLocator.getByText("Expected number, received nan")).toBeVisible(); // Zod's default for .number()
    expect(saveNetworkCallMade, "Save API call made with non-numeric maxMessageSize").toBe(false);
    saveNetworkCallMade = false;

    // Test with zero (violates .positive())
    await maxMessageSizeInput.fill("0");
    await dialogLocator.getByRole('tab', { name: getTabDisplayName('review') }).click();
    await dialogLocator.getByRole('button', { name: 'Salvar Agente' }).click();
    await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName('a2a'), selected: true })).toBeVisible({timeout: 5000});
    await expect(dialogLocator.getByText("Number must be greater than 0")).toBeVisible();
    expect(saveNetworkCallMade, "Save API call made with zero maxMessageSize").toBe(false);
    saveNetworkCallMade = false;

    // Test with negative number (violates .positive())
    await maxMessageSizeInput.fill("-100");
    await dialogLocator.getByRole('tab', { name: getTabDisplayName('review') }).click();
    await dialogLocator.getByRole('button', { name: 'Salvar Agente' }).click();
    await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName('a2a'), selected: true })).toBeVisible({timeout: 5000});
    await expect(dialogLocator.getByText("Number must be greater than 0")).toBeVisible(); // Same message for negative
    expect(saveNetworkCallMade, "Save API call made with negative maxMessageSize").toBe(false);
  });

});
