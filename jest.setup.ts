// Add any global test setup here
import '@testing-library/jest-dom';

// Mock any global objects or functions if needed
global.console = {
  ...console,
  // uncomment to ignore specific logs
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock any modules that cause side effects
jest.mock('@genkit-ai/googleai', () => ({
  // Add mock implementations as needed
}));

jest.mock('genkit', () => ({
  // Add mock implementations as needed
}));
