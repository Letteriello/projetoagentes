// Configurações globais para os testes
// Adicione aqui configurações que devem ser executadas antes dos testes

// Mock de módulos globais
jest.mock('next/config', () => () => ({
  publicRuntimeConfig: {
    // Adicione aqui as configurações públicas necessárias
  },
}));

// Mock do localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
