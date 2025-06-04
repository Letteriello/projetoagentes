import { test, expect, Page } from '@playwright/test';

// Mock data for AI Configuration Assistant response
// IMPORTANT: Tool IDs ('googleSearch', 'customApi') must match tool IDs
// available in the AgentBuilderDialog's 'availableTools' prop for the test to work.
// These IDs are typically simple strings like "googleSearch", "calculator", etc.
const mockAiSuggestions = {
  suggestedPersonality: 'Friendly and inquisitive',
  suggestedRestrictions: ['Must not discuss politics', 'Should encourage creative thinking'],
  suggestedModel: 'gemini-1.5-pro-latest', // This might be applied to a model selector if one exists
  suggestedTemperature: 0.8, // This might be applied to a temperature slider/input
  suggestedTools: [
    {
      id: 'googleSearch', // Assumed ID for a Google Search tool
      name: 'Google Search', // Name might be used to find the tool row if ID is not directly on the row
      description: 'Performs Google searches.',
      // iconName: 'search', // iconName is for display, not typically for selection
      // genkitToolName: 'googleSearchTool', // genkitToolName is internal
      suggestedConfigData: {
        // These keys (apiKeyName, customSearchEngineId) must match the actual configFields
        // used by the 'googleSearch' tool in its definition.
        apiKeyName: 'MOCK_GOOGLE_CSE_API_KEY_NAME',
        customSearchEngineId: 'MOCK_CSE_ID_12345'
      }
    },
    {
      id: 'customAPI', // Assumed ID for a Custom API tool
      name: 'Custom API Service',
      description: 'Connects to a custom API.',
      suggestedConfigData: {
        // These keys must match actual configFields for the 'customAPI' tool
        endpointUrl: 'https://api.example.com/v1/mock-chat',
        specification: { type: 'openapi', version: '3.0.1', description: 'Mocked User API' }
      }
    }
  ],
  suggestedTasks: ['Brainstorm new ideas for a story', 'Help draft an outline for the story'],
  // Other fields from AiConfigurationAssistantOutputSchema can be added if needed for more assertions.
};

test.describe('AI Configuration Assistant Integration', () => {
  let page: Page;

  // Using test.beforeEach instead of beforeAll if page needs to be fresh for each test
  // For a single test in this describe block, beforeAll is fine. If more tests are added,
  // consider beforeEach for better isolation.
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    // Navigate to the page where the Agent Builder can be triggered.
    // Assuming the app starts at a page where a "create agent" button is available,
    // or directly on an agent management page.
    // Replace with actual base URL or specific path if necessary.
    await page.goto('/');
    // Example: await page.goto('/agent-management');
  });

  test('should fetch AI suggestions and apply them to the Agent Builder form', async () => {
    // 1. Mock the AI Configuration Assistant flow API endpoint
    // This intercepts calls to the specified API endpoint and returns our mock response.
    await page.route('**/api/flows/aiConfigurationAssistantFlow', async (route) => {
      console.log(`Intercepted call to ${route.request().url()}`);
      // Ensure the request body is what you might expect (optional, for debugging)
      // const body = route.request().postDataJSON();
      // console.log('Request body:', body);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAiSuggestions),
      });
    });

    // 2. Open the Agent Builder Dialog
    // Assuming a button with this data-testid exists to open the dialog for a new agent.
    await page.click('button[data-testid="create-new-agent-button"]');

    // Wait for the dialog to be visible and check for its title.
    // Using a generic role selector for the dialog itself.
    const dialogLocator = page.locator('div[role="dialog"]');
    await expect(dialogLocator).toBeVisible({ timeout: 10000 }); // Increased timeout for dialog appearance
    // Check for a heading that indicates the dialog is for creating/editing an agent.
    await expect(dialogLocator.getByRole('heading', { name: /Criar Novo Agente IA|Editar Agente IA/i })).toBeVisible();


    // 3. Input Agent Goal and Tasks to enable suggestion button
    // These selectors are placeholders and need to match the actual implementation.
    // Assuming 'config.agentGoal' and 'config.agentTasks' are the RHF field names.
    // The actual data-testid might be more specific, e.g., tied to the input element itself.
    await page.fill('textarea[name="config.agentGoal"]', 'Create a fantasy novel plot.');
    // For tasks, assuming a simple textarea for input, then perhaps a button to add them.
    // This part is highly dependent on the UI for adding tasks.
    // For this test, we'll assume the first task input is sufficient for the AI suggestion.
    // If tasks are added via a dynamic list, interaction would be more complex.
    // Let's assume there's a field for tasks, and we're setting one task.
    // If the 'get-ai-suggestions-button' becomes enabled only after tasks are *committed*
    // (e.g., by pressing Enter or an "Add Task" button), that interaction needs to be added here.
    // For simplicity, assuming filling the input is enough for the test's purpose.
    await page.fill('textarea[name="config.agentTasks.0"]', 'Generate character backstories'); // Simplified if tasks are an array of strings

    // 4. Trigger AI Suggestions
    // This button might be on a specific tab (e.g., "Behavior") or a general button.
    // First, navigate to the "Behavior" tab where the AI suggestions button is expected.
    await page.click('button[role="tab"][value="behavior"]'); // Assumes tab value is 'behavior'
    // Click the button to fetch AI suggestions.
    await page.click('button[data-testid="get-ai-suggestions-button"]');

    // After clicking, a loading state might appear. Then, suggestions should be applied.
    // We need to wait for the application of suggestions.
    // One way is to wait for an expected value to appear.

    // 5. Verify UI Updates with AI Suggestions

    // Check personality (assuming a textarea for personality)
    // The name attribute should match the React Hook Form registered name.
    await expect(page.locator('textarea[name="config.agentPersonality"]'))
      .toHaveValue(mockAiSuggestions.suggestedPersonality, { timeout: 10000 }); // Increased timeout for value to update

    // Check restrictions
    // Assuming restrictions are displayed in a way that each can be located, e.g., as individual items.
    // This selector needs to be specific to how restrictions are rendered.
    // If they are tags within a container:
    const restrictionsContainer = page.locator('[data-testid="agent-restrictions-container"]'); // Placeholder
    for (const restriction of mockAiSuggestions.suggestedRestrictions) {
      await expect(restrictionsContainer.getByText(restriction)).toBeVisible();
    }

    // Check suggested tasks (if they are directly applied to the tasks input/list)
    // This depends heavily on the UI. If tasks are a list, you'd iterate.
    // If they replace the content of the first task input (less likely for multiple tasks):
    // await expect(page.locator('textarea[name="config.agentTasks.0"]'))
    //   .toHaveValue(mockAiSuggestions.suggestedTasks[0]);
    // For now, we'll skip direct assertion of applied tasks if the UI is complex,
    // but we will check them in the system prompt later.

    // Check tools tab for selected tools and their configurations
    await page.click('button[role="tab"][value="tools"]');

    // Verify Google Search tool is selected and configured
    // Assuming each tool in the list has a data-testid like 'tool-row-<toolId>'
    const googleSearchToolRow = page.locator('[data-testid="tool-row-googleSearch"]');
    await expect(googleSearchToolRow.locator('input[type="checkbox"]')).toBeChecked({ timeout: 5000 });

    // Click the configure button for the Google Search tool to open its configuration.
    // This selector needs to be specific to the configure button within the tool's row.
    await googleSearchToolRow.locator('button[aria-label*="Configure Google Search"]').click(); // Assuming an aria-label

    // Verify the configuration fields for Google Search. Selectors must match actual implementation.
    // e.g., name="toolConfigsApplied.googleSearch.apiKeyName"
    await expect(page.locator('input[name="toolConfigsApplied.googleSearch.apiKeyName"]'))
      .toHaveValue(mockAiSuggestions.suggestedTools[0].suggestedConfigData.apiKeyName);
    await expect(page.locator('input[name="toolConfigsApplied.googleSearch.customSearchEngineId"]'))
      .toHaveValue(mockAiSuggestions.suggestedTools[0].suggestedConfigData.customSearchEngineId);
    // If configuration is in a modal, a close action might be needed here.
    // await page.getByRole('button', { name: 'Close' }).click(); // Example: if it's a modal with a close button

    // Verify Custom API tool is selected and configured
    const customApiToolRow = page.locator('[data-testid="tool-row-customAPI"]'); // Using ID from mock
    await expect(customApiToolRow.locator('input[type="checkbox"]')).toBeChecked();
    await customApiToolRow.locator('button[aria-label*="Configure Custom API Service"]').click(); // Assuming an aria-label

    await expect(page.locator('input[name="toolConfigsApplied.customAPI.endpointUrl"]'))
      .toHaveValue(mockAiSuggestions.suggestedTools[1].suggestedConfigData.endpointUrl);
    // For JSON editor (specification), checking visibility or a part of its content might be feasible.
    // Direct value check on complex editors is tricky.
    // This assumes the JSON editor for the 'specification' field is associated with this name.
    const specFieldLocator = page.locator('[data-testid="json-editor-toolConfigsApplied.customAPI.specification"]'); // Placeholder
    await expect(specFieldLocator).toBeVisible();
    // Optionally, check if it contains some part of the JSON string if possible and reliable.
    // await expect(specFieldLocator).toContainText('Mocked User API');


    // 6. Verify System Prompt Update
    // Navigate to the "Review" tab (or wherever the system prompt preview is shown).
    await page.click('button[role="tab"][value="review"]');
    // Assuming the system prompt is displayed in a textarea with data-testid="system-prompt-preview"
    const systemPromptPreview = page.locator('textarea[data-testid="system-prompt-preview"]');
    await expect(systemPromptPreview).toBeVisible();

    // Check for presence of applied suggestions in the system prompt.
    await expect(systemPromptPreview).toHaveValue(new RegExp(mockAiSuggestions.suggestedPersonality.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))); // Escape special regex chars
    await expect(systemPromptPreview).toHaveValue(new RegExp(mockAiSuggestions.suggestedTasks[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    await expect(systemPromptPreview).toHaveValue(new RegExp(mockAiSuggestions.suggestedRestrictions[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

    // 7. (Optional) Test Save action
    // This would require mocking the save API endpoint or checking a callback.
    // For now, this part is out of scope of this specific test's primary goal.
    // await page.click('button[type="submit"]:has-text("Salvar Agente")');
    // Assert that the save function/API was called with data incorporating AI suggestions.
  });

  test.afterAll(async () => {
    await page.close();
  });
});
