import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatUI } from './chat-ui'; // Import the actual component
import { ThemeProvider } from '@/contexts/ThemeContext'; // Required by ThemeToggle in ChatHeader

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useParams: () => ({
    conversationId: null, // Or a mock ID if needed for a specific test
  }),
}));

// Mock useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock useAuth
const mockCurrentUser = {
  uid: 'test-user-id',
  displayName: 'Test User',
  email: 'test@example.com',
  photoURL: null,
};
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    currentUser: mockCurrentUser,
    loading: false,
  })),
}));

// Mock useAgents
jest.mock('@/contexts/AgentsContext', () => ({
  useAgents: () => ({
    savedAgents: [],
    setSavedAgents: jest.fn(),
    addAgent: jest.fn(),
    updateAgent: jest.fn(),
    deleteAgent: jest.fn(),
  }),
}));

// Mock useChatStore
const mockUseChatStoreValues = {
  conversations: [],
  activeConversationId: null,
  messages: [],
  optimisticMessages: [],
  isPending: false,
  isLoadingMessages: false,
  isLoadingConversations: false,
  inputContinuation: null,
  selectedFile: null,
  selectedFileName: null,
  selectedFileDataUri: null,
  currentUserId: mockCurrentUser.uid,
  inputValue: '',
  waitingForFeedbackOnMessageId: null,
  setConversations: jest.fn(),
  setActiveConversationId: jest.fn(),
  setMessages: jest.fn(),
  setIsPending: jest.fn(),
  setIsLoadingMessages: jest.fn(),
  setIsLoadingConversations: jest.fn(),
  setInputContinuation: jest.fn(),
  setSelectedFile: jest.fn(),
  setSelectedFileName: jest.fn(),
  setSelectedFileDataUri: jest.fn(),
  setInputValue: jest.fn(),
  setWaitingForFeedbackOnMessageId: jest.fn(),
  handleNewConversation: jest.fn().mockResolvedValue({ id: 'new-conv-id', title: 'New Chat', createdAt: new Date(), messages: [] }),
  handleSelectConversation: jest.fn(),
  handleDeleteConversation: jest.fn(),
  handleRenameConversation: jest.fn(),
  submitMessage: jest.fn().mockResolvedValue(undefined),
  handleFeedback: jest.fn(),
  handleRegenerate: jest.fn(),
  clearSelectedFile: jest.fn(),
};
jest.mock('@/hooks/use-chat-store', () => ({
  useChatStore: jest.fn(() => mockUseChatStoreValues),
}));


// Mock Firebase auth functions (if directly imported/used, though likely abstracted by useAuth)
jest.mock('@/lib/firebaseClient', () => ({
  auth: {}, // Mocked auth object
}));
jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn().mockResolvedValue({ user: mockCurrentUser }),
  signOut: jest.fn().mockResolvedValue(undefined),
}));

// Mock fetch for ADK agent calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ agents: [] }),
  })
) as jest.Mock;

// Mock child components that are lazy loaded or complex
jest.mock('@/components/features/chat/ConversationSidebar', () => () => <div data-testid="mock-conversation-sidebar">Sidebar</div>);
jest.mock('@/components/features/chat/TestRunConfigPanel', () => () => <div data-testid="mock-test-run-config-panel">Test Config</div>);


describe('ChatUI', () => {
  const renderChatUI = () => {
    // Need to wrap with ThemeProvider because ChatHeader uses ThemeToggle which uses useTheme
    return render(
      <ThemeProvider>
        <ChatUI />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    // Reset relevant mock store values before each test
    mockUseChatStoreValues.inputValue = '';
    mockUseChatStoreValues.optimisticMessages = [];
    (useAuth as jest.Mock).mockReturnValue({ currentUser: mockCurrentUser, loading: false });
  });

  test('renders ChatUI without crashing when user is logged in', () => {
    renderChatUI();
    // Check for a key element that indicates successful rendering with a user
    expect(screen.getByRole('button', { name: /nova conversa/i })).toBeInTheDocument(); // New Conversation button in header
    expect(screen.getByPlaceholderText(/type your message here/i)).toBeInTheDocument(); // Message input
  });

  test('renders login prompt when user is not logged in', () => {
    (useAuth as jest.Mock).mockReturnValue({ currentUser: null, loading: false });
    renderChatUI();
    expect(screen.getByText(/bem-vindo ao chat/i)).toBeInTheDocument();
    expect(screen.getByText(/por favor, faça login para usar o chat/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar com google/i })).toBeInTheDocument();
  });

  test('allows typing in the message input', () => {
    renderChatUI();
    const inputElement = screen.getByPlaceholderText(/type your message here/i);
    fireEvent.change(inputElement, { target: { value: 'Hello, agent!' } });
    // The value is controlled by the store, so we check if setInputValue was called
    expect(mockUseChatStoreValues.setInputValue).toHaveBeenCalledWith('Hello, agent!');
  });

  // Test for WelcomeScreen when messages are empty
  test('displays WelcomeScreen when user is logged in and messages are empty', () => {
    // Ensure optimisticMessages is empty for this test
    mockUseChatStoreValues.optimisticMessages = [];
    (useAuth as jest.Mock).mockReturnValue({ currentUser: mockCurrentUser, loading: false });

    renderChatUI();

    // Check for a unique element from WelcomeScreen
    // Replace 'Unique WelcomeScreen Text Element' with actual text or a test ID from WelcomeScreen
    // For now, assuming WelcomeScreen is shown because messages.length is 0
    // A more specific check would be to find text unique to WelcomeScreen.
    // For example, if WelcomeScreen has a title:
    expect(screen.getByText(/Comece uma nova conversa ou selecione uma existente/i)).toBeInTheDocument();
    // Or check for one of the suggestion buttons if they are always there
    expect(screen.getByRole('button', { name: /Explique computação quântica em termos simples/i })).toBeInTheDocument();
  });
});
