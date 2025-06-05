// Mock implementation for genkit
const genkit = {
  defineFlow: jest.fn().mockImplementation((name, options, handler) => ({
    __isFlow: true,
    name,
    options,
    handler
  })),
  run: jest.fn().mockResolvedValue({}),
  // Add other methods as needed by your tests
};

module.exports = genkit;
