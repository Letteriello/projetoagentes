import { test, expect, Page } from '@playwright/test';
import type { SavedAgentConfiguration, LLMAgentConfig } from '../src/types/agent-configs'; // Adjust path

const mockAgentForEditing: SavedAgentConfiguration = {
  id: "nav-test-agent-id-001",
  agentName: "Navigation Test Agent",
  agentDescription: "Agent for testing navigation.",
  agentVersion: "1.0.0",
  config: { type: "llm", framework: "genkit" } as LLMAgentConfig, // Minimal config
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: "test-user",
  tools: [],
  toolsDetails: [],
  toolConfigsApplied: {},
  templateId: '',
  isTemplate: false,
  isFavorite: false,
  tags: [],
  icon: '',
  internalVersion: 1,
  isLatest: true,
  originalAgentId: "nav-test-agent-id-001",
};

const tabOrder = ['general', 'behavior', 'tools', 'memory_knowledge', 'artifacts', 'a2a', 'multi_agent_advanced', 'advanced', 'deploy', 'review'];

// Function to generate display names as done in AgentBuilderDialog
const getTabDisplayName = (tabValue: string): string => {
  return tabValue.charAt(0).toUpperCase() + tabValue.slice(1).replace(/_/g, " ");
};

test.describe('Agent Builder Dialog Navigation', () => {
  
  test.describe.serial('Part 1: Wizard Mode (New Agent)', () => { // .serial to run tests in this suite sequentially
    let page: Page;
    let dialogLocator: any;

    // Use beforeEach to get a fresh page and dialog for each test in this serial suite
    test.beforeEach(async ({ browser, baseURL }) => {
      // If using a single browser instance and reusing page, be careful with state.
      // For true isolation, each test should get a new page from `test` fixture.
      // However, for sequential wizard steps, we might want to persist the page.
      // Let's create a new page for each test to ensure clean state for verification steps.
      page = await browser.newPage(); // This line might need to be `({ page })` in test signature if not using browser fixture directly
      await page.goto(`${baseURL}/agent-builder`); // Assuming baseURL is configured in playwright.config.ts
      await page.getByRole('button', { name: 'Novo Agente (Formulário)' }).click();
      dialogLocator = page.getByRole('dialog', { name: /Criar Novo Agente IA/i });
      await expect(dialogLocator).toBeVisible();
    });

    test.afterEach(async () => {
      await page.close();
    });

    test('should initialize with "General" tab active and only "General" & "Review" enabled', async () => {
      await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName('general'), selected: true })).toBeVisible();
      
      for (const tabValue of tabOrder) {
        const tabButton = dialogLocator.getByRole('tab', { name: getTabDisplayName(tabValue) });
        if (tabValue === 'general' || tabValue === 'review') {
          await expect(tabButton).toBeEnabled();
        } else {
          await expect(tabButton).toBeDisabled();
        }
      }
    });

    test('wizard: "Next" button progression and tab enabling', async () => {
      for (let i = 0; i < tabOrder.length - 1; i++) {
        const currentTabValue = tabOrder[i];
        const nextTabValue = tabOrder[i+1];
        
        await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName(currentTabValue), selected: true })).toBeVisible();
        
        const nextButton = dialogLocator.getByRole('button', { name: 'Próximo' });
        const reviewButton = dialogLocator.getByRole('button', { name: 'Revisar' });

        if (await nextButton.isVisible()) {
            await nextButton.click();
        } else if (await reviewButton.isVisible()) {
            await reviewButton.click(); // This should be the last step before review
        } else {
            throw new Error(`Neither 'Próximo' nor 'Revisar' button found on tab ${currentTabValue}`);
        }
        
        await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName(nextTabValue), selected: true })).toBeVisible();
        // Check active content panel by its association with the selected tab trigger
        const activeTabTriggerId = await dialogLocator.getByRole('tab', { name: getTabDisplayName(nextTabValue), selected: true }).getAttribute('id');
        await expect(dialogLocator.locator(`[role="tabpanel"][data-state="active"][aria-labelledby="${activeTabTriggerId}"]`)).toBeVisible();

        for (const tabValue of tabOrder) {
          const tabButton = dialogLocator.getByRole('tab', { name: getTabDisplayName(tabValue) });
          if (tabOrder.indexOf(tabValue) <= i + 1 || tabValue === 'review') {
            await expect(tabButton).toBeEnabled();
          } else {
            await expect(tabButton).toBeDisabled();
          }
        }
      }
    });
    
    test('wizard: on "Review" tab, all tabs should be enabled and clickable, then direct navigation works', async () => {
      // Navigate to Review tab
      for (let i = 0; i < tabOrder.indexOf('review'); i++) {
        const nextButton = dialogLocator.getByRole('button', { name: 'Próximo' });
         if (await nextButton.isVisible()) {
            await nextButton.click();
        } else {
            // This case implies we might have hit the "Revisar" button earlier than expected if loop is too long
            // or if the button name changes before the last step.
            const reviewButton = dialogLocator.getByRole('button', { name: 'Revisar' });
            if (await reviewButton.isVisible()) {
                await reviewButton.click();
                break; 
            }
        }
      }
      await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName('review'), selected: true })).toBeVisible();

      for (const tabValue of tabOrder) {
        await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName(tabValue) })).toBeEnabled();
      }

      // Click a previous tab directly
      await dialogLocator.getByRole('tab', { name: getTabDisplayName('tools') }).click();
      await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName('tools'), selected: true })).toBeVisible();
      const activeTabTriggerId = await dialogLocator.getByRole('tab', { name: getTabDisplayName('tools'), selected: true }).getAttribute('id');
      await expect(dialogLocator.locator(`[role="tabpanel"][data-state="active"][aria-labelledby="${activeTabTriggerId}"]`)).toBeVisible();
    });

    test('wizard: "Previous" button should navigate correctly after reaching Review and going back', async () => {
      // Navigate to Review tab first
      for (let i = 0; i < tabOrder.indexOf('review'); i++) {
         const nextButton = dialogLocator.getByRole('button', { name: 'Próximo' });
         if (await nextButton.isVisible()) {
            await nextButton.click();
        } else {
            const reviewButton = dialogLocator.getByRole('button', { name: 'Revisar' });
            if (await reviewButton.isVisible()) {
                await reviewButton.click();
                break; 
            }
        }
      }
      await dialogLocator.getByRole('tab', { name: getTabDisplayName('review'), selected: true }).click(); // Ensure review is selected

      // Go back to "Tools" directly
      await dialogLocator.getByRole('tab', { name: getTabDisplayName('tools') }).click();
      await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName('tools'), selected: true })).toBeVisible();
      
      await dialogLocator.getByRole('button', { name: 'Anterior' }).click();
      await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName('behavior'), selected: true })).toBeVisible();
      let activeTabTriggerId = await dialogLocator.getByRole('tab', { name: getTabDisplayName('behavior'), selected: true }).getAttribute('id');
      await expect(dialogLocator.locator(`[role="tabpanel"][data-state="active"][aria-labelledby="${activeTabTriggerId}"]`)).toBeVisible();

      await dialogLocator.getByRole('button', { name: 'Anterior' }).click();
      await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName('general'), selected: true })).toBeVisible();
      activeTabTriggerId = await dialogLocator.getByRole('tab', { name: getTabDisplayName('general'), selected: true }).getAttribute('id');
      await expect(dialogLocator.locator(`[role="tabpanel"][data-state="active"][aria-labelledby="${activeTabTriggerId}"]`)).toBeVisible();
    });
  });

  test.describe('Part 2: Edit Mode (Existing Agent)', () => {
    let page: Page; // page fixture for this describe block
    let dialogLocator: any;

    test.beforeEach(async ({ page: newPage, baseURL }) => { // use newPage from test fixture
      page = newPage; // Assign to block-scoped page
      await page.route('**/api/agents', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockAgentForEditing]) });
      });
      await page.goto(`${baseURL}/agent-builder`);
      const agentCardLocator = page.locator('div.bg-card.shadow-md', { hasText: mockAgentForEditing.agentName }).first();
      await expect(agentCardLocator).toBeVisible({ timeout: 10000 });
      await agentCardLocator.getByRole('button', { name: /editar/i }).click();
      dialogLocator = page.getByRole('dialog', { name: /Editar Agente IA/i });
      await expect(dialogLocator).toBeVisible();
    });
    
    test.afterEach(async () => {
      // page will be closed automatically by Playwright if it's from the test fixture
    });


    test('edit mode: should initialize with "General" tab active and all tabs enabled', async () => {
      await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName('general'), selected: true })).toBeVisible();
      for (const tabValue of tabOrder) {
        await expect(dialogLocator.getByRole('tab', { name: getTabDisplayName(tabValue) })).toBeEnabled();
      }
    });

    for (const tabValue of tabOrder) {
      test(`edit mode: clicking tab "${getTabDisplayName(tabValue)}" should make it active`, async () => {
        const currentTabDisplayName = getTabDisplayName(tabValue);
        await dialogLocator.getByRole('tab', { name: currentTabDisplayName }).click();
        
        const activeTabTrigger = dialogLocator.getByRole('tab', { name: currentTabDisplayName, selected: true });
        await expect(activeTabTrigger).toBeVisible();
        
        const activeTabTriggerId = await activeTabTrigger.getAttribute('id');
        await expect(dialogLocator.locator(`[role="tabpanel"][data-state="active"][aria-labelledby="${activeTabTriggerId}"]`)).toBeVisible();
      });
    }
  });
});
