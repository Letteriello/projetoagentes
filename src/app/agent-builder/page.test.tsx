import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import AgentBuilderPage from './page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock useAgents
jest.mock('@/contexts/AgentsContext', () => ({
  useAgents: () => ({
    savedAgents: [],
    addAgent: jest.fn(),
    updateAgent: jest.fn(),
    deleteAgent: jest.fn(),
    isLoadingAgents: false,
  }),
}));

// Mock useAchievements
jest.mock('@/hooks/useAchievements', () => ({
  useAchievements: () => ({
    unlockAchievement: jest.fn(),
  }),
}));

// Mock AgentBuilderDialog (as it's lazy loaded and complex)
jest.mock('@/components/features/agent-builder/agent-builder-dialog', () => {
  // @ts-ignore
  return function DummyAgentBuilderDialog({ isOpen, onOpenChange, name }) {
    if (!isOpen) return null;
    return (
      <div data-testid="mocked-agent-builder-dialog">
        <h2>{name}</h2>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    );
  };
});


// Mock other lazy loaded components that might be triggered by UI interactions
jest.mock('@/components/features/agent-builder/tool-config-modal', () => () => <div>Mocked ToolConfigModal</div>);
jest.mock('@/components/ui/help-modal', () => () => <div>Mocked HelpModal</div>);
jest.mock('@/components/features/agent-builder/feedback-modal', () => () => <div>Mocked FeedbackModal</div>);
jest.mock('@/components/ui/confirmation-modal', () => () => <div>Mocked ConfirmationModal</div>);
jest.mock('@/components/features/agent-builder/save-as-template-dialog', () => () => <div>Mocked TemplateNameModal</div>);


describe('AgentBuilderPage', () => {
  const renderPage = () => {
    return render(
      <TooltipProvider>
        <AgentBuilderPage />
      </TooltipProvider>
    );
  };

  test('renders AgentBuilderPage without crashing', () => {
    renderPage();
    expect(screen.getByText('Construtor de Agentes')).toBeInTheDocument();
    expect(screen.getByText('Crie, gerencie e monitore seus agentes de IA')).toBeInTheDocument();
  });

  test('displays empty state when no agents are present', () => {
    renderPage();
    expect(screen.getByText('Nenhum Agente Criado Ainda')).toBeInTheDocument();
    expect(screen.getByText(/Parece que você não tem nenhum agente./)).toBeInTheDocument();
  });

  test('opens create agent modal when "Novo Agente" is clicked', async () => {
    renderPage();
    const newAgentButton = screen.getByRole('button', { name: /Novo Agente/i });
    fireEvent.click(newAgentButton);

    await waitFor(() => {
      expect(screen.getByTestId('mocked-agent-builder-dialog')).toBeVisible();
      expect(screen.getByRole('heading', { name: 'Criar Agente' })).toBeInTheDocument();
    });
  });
});
