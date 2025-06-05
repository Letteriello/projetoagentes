import { test, expect, Page } from '@playwright/test';

const CHAT_PAGE_URL = '/chat'; // Assuming chat is directly at /chat

// Helper function to mock the chat API stream
async function mockChatStream(page: Page, responseChunks: Array<{type: string, data: any}>, statusCode = 200) {
  await page.route('**/api/chat-stream', async route => {
    if (statusCode !== 200) {
      await route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify({ error: responseChunks[0]?.data || 'Mock API Error' }),
      });
      return;
    }

    let body = '';
    for (const chunk of responseChunks) {
      body += JSON.stringify(chunk) + '\n';
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/x-ndjson; charset=utf-8',
      body: body,
    });
  });
}

// Helper function to send a message
async function sendMessage(page: Page, text: string) {
  await page.fill('textarea[name="userInput"]', text);
  await page.click('button[type="submit"]');
}

test.describe('Chat Flow Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CHAT_PAGE_URL);
    // Wait for a known element to ensure page is somewhat loaded, e.g., the input area
    await expect(page.locator('textarea[name="userInput"]')).toBeVisible();
  });

  test('should send a message and receive a simple response, then clear input', async ({ page }) => {
    await mockChatStream(page, [{ type: 'text', data: 'Test response from agent' }]);

    await sendMessage(page, 'Hello agent');

    // Check for the agent's response
    // Using getByText which is good for user-visible text.
    // For more complex message structures, data-testid would be better.
    await expect(page.getByText('Test response from agent')).toBeVisible({ timeout: 10000 });

    // Check that input is cleared (assuming MessageInputArea gets updated value from store)
    // This relies on the parent component (ChatUI) correctly clearing the inputValue
    // which is then passed back to MessageInputArea.
    await expect(page.locator('textarea[name="userInput"]')).toHaveValue('');
  });

  test('should display a streamed response progressively', async ({ page }) => {
    const chunks = [
      { type: 'text', data: 'Streamed pa' },
      { type: 'text', data: 'Streamed part 1. ' },
      { type: 'text', data: 'Streamed part 1. Streamed part 2.' },
    ];
    await mockChatStream(page, chunks);

    await sendMessage(page, 'Test streaming');

    // Check for the final message content
    // The typewriter effect means intermediate states are hard to catch reliably without very specific timing,
    // so testing the final state is most robust for E2E.
    await expect(page.getByText('Streamed part 1. Streamed part 2.')).toBeVisible({ timeout: 15000 });
  });

  test('should display an API error message if submission fails (e.g., 500 error)', async ({ page }) => {
    await mockChatStream(page, [{ type: 'error', data: 'Internal Server Error from mock' }], 500);

    await sendMessage(page, 'Test API error');

    // Assuming errors are displayed in a toast notification or a specific error display area.
    // Playwright's getByText can find text within such elements.
    // The exact error message might be transformed by the client, so use a regex or partial text.
    await expect(page.getByText(/Internal Server Error from mock|Ocorreu um erro/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display an agent event (e.g., tool call pending and result)', async ({ page }) => {
    const eventsAndResponse = [
      { type: 'event', data: { eventType: 'TOOL_CALL_PENDING', eventTitle: 'Using Web Search tool...' } },
      { type: 'event', data: { eventType: 'TOOL_CALL', eventTitle: 'Web Search tool result', eventDetails: 'Found some data.' } },
      { type: 'text', data: 'Final response after tool use.' },
    ];
    await mockChatStream(page, eventsAndResponse);

    await sendMessage(page, 'Search for something');

    // Check for event displays (these selectors might need data-testid for robustness)
    await expect(page.getByText(/TOOL_CALL_PENDING: Using Web Search tool.../i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/TOOL_CALL: Web Search tool result/i)).toBeVisible({ timeout: 10000 });

    // Check for the final text message
    await expect(page.getByText('Final response after tool use.')).toBeVisible({ timeout: 10000 });
  });

  test('should display an error event if an error occurs during streaming', async ({ page }) => {
    const eventsAndError = [
      { type: 'text', data: 'Starting stream... ' },
      { type: 'event', data: { eventType: 'AGENT_ERROR', eventTitle: 'Error during processing', eventDetails: 'Something went wrong in the agent.' } },
      // No further text chunks should ideally be processed or displayed if AGENT_ERROR is critical.
    ];
    await mockChatStream(page, eventsAndError);

    await sendMessage(page, 'Test stream error');

    await expect(page.getByText('Starting stream...')).toBeVisible({ timeout: 10000 });
    // Check for the error event display
    await expect(page.getByText(/AGENT_ERROR: Error during processing/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Something went wrong in the agent.')).toBeVisible({ timeout: 10000 });
  });

  // Basic check for message list scrolling - send multiple messages
  test('should show the last message when many messages are sent', async ({ page }) => {
    // Mock a simple echo agent for this test
    await page.route('**/api/chat-stream', async (route) => {
      const request = route.request();
      const reqBody = request.postDataJSON();
      const userMessage = reqBody?.userMessage || "mock response"; // Corrected: Matches ChatInput in route.ts
      await route.fulfill({
        status: 200,
        contentType: 'application/x-ndjson; charset=utf-8',
        body: JSON.stringify({ type: 'text', data: `Echo: ${userMessage}` }) + '\n',
      });
    });

    for (let i = 0; i < 15; i++) {
      await sendMessage(page, `Message ${i + 1}`);
      // Wait for the response to ensure messages are processed one by one
      await expect(page.getByText(`Echo: Message ${i + 1}`)).toBeVisible({ timeout: 5000 });
    }
    // Check if the last message is visible (implies scrolling has occurred)
    await expect(page.getByText('Echo: Message 15')).toBeVisible();
  });
});
