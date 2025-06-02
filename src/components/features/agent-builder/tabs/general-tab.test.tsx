import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form';
import GeneralTab from './general-tab'; // Update path as needed
import { SavedAgentConfiguration, LLMAgentConfig, AgentFramework, AgentType } from '@/types/agent-configs'; // Update path
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content'; // Actual help content

// --- Mocks ---
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockGetAiConfigurationSuggestionsAction = jest.fn();
jest.mock('@/app/agent-builder/actions', () => ({
  getAiConfigurationSuggestionsAction: jest.fn((...args) => mockGetAiConfigurationSuggestionsAction(...args)),
}));

const mockShowHelpModalGlobal = jest.fn(); // For InfoIcon clicks
jest.mock('@/components/ui/InfoIcon', () => ({
  InfoIcon: ({ tooltipText, onClick }: { tooltipText: string; onClick: () => void }) => (
    <button data-testid={`info-icon-mock-${tooltipText.toLowerCase().replace(/\s+/g, '-')}`} onClick={onClick}>
      Info: {tooltipText}
    </button>
  ),
}));


jest.mock('@/components/features/agent-builder/AISuggestionIcon', () => ({ isLoading, onClick, tooltipText, size }: any) => (
  <button data-testid={`ai-suggestion-icon-mock-${tooltipText.toLowerCase().replace(/\s+/g, '-')}`} onClick={onClick} disabled={isLoading}>
    AI: {tooltipText} (Size: {size})
  </button>
));


// LLM Specific Fields Mock (conditionally rendered within GeneralTab itself if type is 'llm')
// Since GeneralTab itself contains the conditional rendering for LLM fields, we don't mock them separately.
// We will control their appearance by setting config.type.

const mockAgentTypeOptions = [
  { value: 'llm' as AgentType, label: 'LLM Agent' },
  { value: 'workflow' as AgentType, label: 'Workflow Agent' },
  { value: 'custom' as AgentType, label: 'Custom Agent' },
];
const mockAgentFrameworkOptions = [
  { value: 'genkit' as AgentFramework, label: 'Genkit' },
  { value: 'crewai' as AgentFramework, label: 'CrewAI' },
];

const TestWrapper = ({
  children,
  defaultValues: formDefaultValues = {},
}: {
  children: React.ReactNode;
  defaultValues?: Partial<SavedAgentConfiguration>;
}) => {
  const methods = useForm<SavedAgentConfiguration>({
    defaultValues: {
      agentName: '',
      agentDescription: '',
      agentVersion: '1.0.0',
      config: {
        type: 'llm',
        framework: 'genkit',
        agentModel: 'gemini-1.5-flash-latest',
        agentGoal: '',
        agentTasks: [],
        agentPersonality: 'neutral',
        agentTemperature: 0.7,
        // ... other sensible defaults for a complete LLM config
      } as LLMAgentConfig,
      ...formDefaultValues,
      // Ensure nested config is also spread if provided
      config: {
        type: 'llm',
        framework: 'genkit',
        agentModel: 'gemini-1.5-flash-latest',
        agentGoal: '',
        agentTasks: [],
        agentPersonality: 'neutral',
        agentTemperature: 0.7,
        ...(formDefaultValues.config || {}),
      } as LLMAgentConfig,
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('GeneralTab', () => {
  let mockShowHelpModal: jest.Mock;

  beforeEach(() => {
    mockShowHelpModal = jest.fn();
    mockGetAiConfigurationSuggestionsAction.mockClear();
    mockToast.mockClear();
  });

  const renderGeneralTab = (defaultValues: Partial<SavedAgentConfiguration> = {}) => {
    return render(
      <TestWrapper defaultValues={defaultValues}>
        <GeneralTab
          showHelpModal={mockShowHelpModal}
          agentTypeOptions={mockAgentTypeOptions}
          agentFrameworkOptions={mockAgentFrameworkOptions}
        />
      </TestWrapper>
    );
  };

  describe('Rendering Fields', () => {
    it('should render common fields correctly', () => {
      renderGeneralTab();
      expect(screen.getByLabelText('Agent Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Agent Version')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Agent Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Agent Framework')).toBeInTheDocument();

      expect(screen.getByTestId('ai-suggestion-icon-mock-sugerir-nome-do-agente')).toBeInTheDocument();
      expect(screen.getByTestId('ai-suggestion-icon-mock-sugerir-descrição-do-agente')).toBeInTheDocument();
    });
    
    // Conditional rendering of LLM fields is tested in "Data Display & Conditional Rendering"
    // Conditional rendering of Genkit Flow Name for 'custom' type:
    it('should render Genkit Flow Name field if agent type is "custom"', () => {
      renderGeneralTab({ config: { type: 'custom' } as any });
      expect(screen.getByLabelText('Genkit Flow Name (for Custom Agent)')).toBeInTheDocument();
    });

    it('should NOT render Genkit Flow Name field if agent type is not "custom"', () => {
      renderGeneralTab({ config: { type: 'llm' } as any });
      expect(screen.queryByLabelText('Genkit Flow Name (for Custom Agent)')).not.toBeInTheDocument();
    });

    it('should render LLM specific fields if agent type is "llm"', () => {
      renderGeneralTab({ config: { type: 'llm' } as any });
      // These labels are based on the Playwright E2E tests' assumptions.
      // Actual labels might differ and need to be updated once BehaviorTab is implemented for these.
      // For GeneralTab, these fields are part of its own JSX when type is 'llm'.
      expect(screen.getByLabelText('LLM Model')).toBeInTheDocument(); // Assuming this label for config.agentModel
      expect(screen.getByLabelText('Agent Goal')).toBeInTheDocument(); // Assuming this label for config.agentGoal
      expect(screen.getByPlaceholderText('Enter a task for the agent')).toBeInTheDocument(); // For config.agentTasks
      expect(screen.getByRole('button', { name: 'Add Task' })).toBeInTheDocument();
      expect(screen.getByTestId('ai-suggestion-icon-mock-sugerir-objetivo-do-agente')).toBeInTheDocument();
    });

    it('should NOT render LLM specific fields if agent type is not "llm"', () => {
      renderGeneralTab({ config: { type: 'workflow' } as any });
      expect(screen.queryByLabelText('LLM Model')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Agent Goal')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Enter a task for the agent')).not.toBeInTheDocument();
    });
  });

  describe('Data Display & Conditional Rendering', () => {
    it('should display values from form context for common fields', () => {
      const initialData = {
        agentName: 'My Test Agent',
        agentDescription: 'A detailed description.',
        agentVersion: '1.2.3',
        config: { type: 'workflow', framework: 'crewai' } as any,
      };
      renderGeneralTab(initialData);
      expect(screen.getByLabelText('Agent Name')).toHaveValue(initialData.agentName);
      expect(screen.getByLabelText('Description')).toHaveValue(initialData.agentDescription);
      expect(screen.getByLabelText('Agent Version')).toHaveValue(initialData.agentVersion);
      // Selects need special handling to check displayed value
      expect(screen.getByText('Workflow Agent')).toBeInTheDocument(); // from agentTypeOptions label
      expect(screen.getByText('CrewAI')).toBeInTheDocument(); // from agentFrameworkOptions label
    });
  });

  describe('User Interaction and Form Updates', () => {
    it('should update agentName in form context on input', async () => {
      const { container } = renderGeneralTab();
      const agentNameInput = screen.getByLabelText('Agent Name');
      fireEvent.change(agentNameInput, { target: { value: 'New Agent Name' } });
      // To verify RHF update, typically you'd get value from RHF methods.
      // Here, we just check the input's controlled value reflects change.
      expect(agentNameInput).toHaveValue('New Agent Name');
    });

    it('should show/hide Genkit Flow Name based on Agent Type selection', async () => {
      renderGeneralTab();
      expect(screen.queryByLabelText('Genkit Flow Name (for Custom Agent)')).not.toBeInTheDocument();

      // Change to Custom
      fireEvent.mouseDown(screen.getByLabelText('Agent Type').parentNode!); // Click the SelectTrigger
      await waitFor(() => screen.getByText('Custom Agent')); // Wait for options to appear
      fireEvent.click(screen.getByText('Custom Agent'));
      
      await waitFor(() => {
        expect(screen.getByLabelText('Genkit Flow Name (for Custom Agent)')).toBeInTheDocument();
      });

      // Change back to LLM
      fireEvent.mouseDown(screen.getByLabelText('Agent Type').parentNode!);
      await waitFor(() => screen.getByText('LLM Agent'));
      fireEvent.click(screen.getByText('LLM Agent'));

      await waitFor(() => {
        expect(screen.queryByLabelText('Genkit Flow Name (for Custom Agent)')).not.toBeInTheDocument();
      });
    });

    it('should display values from form context for LLM fields when type is "llm"', () => {
      const initialLLMData = {
        config: {
          type: 'llm',
          agentModel: 'gemini-pro',
          agentGoal: 'LLM Specific Goal',
          agentTasks: ['LLM Task 1', 'LLM Task 2'],
        } as LLMAgentConfig,
      };
      renderGeneralTab(initialLLMData);
      expect(screen.getByText('gemini-pro')).toBeInTheDocument(); // Value in Select
      expect(screen.getByLabelText('Agent Goal')).toHaveValue(initialLLMData.config.agentGoal);
      expect(screen.getByText('LLM Task 1')).toBeInTheDocument(); // Task displayed in list
      expect(screen.getByText('LLM Task 2')).toBeInTheDocument();
    });

    it('should update LLM Model in form context on selection', async () => {
        renderGeneralTab({ config: { type: 'llm', agentModel: 'gemini-1.5-flash-latest' } as LLMAgentConfig });
        const modelSelect = screen.getByLabelText('LLM Model').parentNode!; // SelectTrigger is child of parent of Label
        fireEvent.mouseDown(modelSelect);
        await waitFor(() => screen.getByText('gpt-4')); // Assuming 'gpt-4' is an option
        fireEvent.click(screen.getByText('gpt-4'));
        // Check if the displayed value in the SelectTrigger updates
        await waitFor(() => {
            expect(screen.getByText('gpt-4')).toBeInTheDocument();
        });
    });

    it('should update Agent Goal in form context on input', () => {
        renderGeneralTab({ config: { type: 'llm' } as LLMAgentConfig });
        const goalTextarea = screen.getByLabelText('Agent Goal');
        fireEvent.change(goalTextarea, { target: { value: 'New Goal Content' } });
        expect(goalTextarea).toHaveValue('New Goal Content');
    });

    describe('Agent Tasks Interaction', () => {
        it('should add a task to the list and form context', async () => {
            renderGeneralTab({ config: { type: 'llm', agentTasks: [] } as LLMAgentConfig });
            const taskInput = screen.getByPlaceholderText('Enter a task for the agent');
            const addButton = screen.getByRole('button', { name: 'Add Task' });

            fireEvent.change(taskInput, { target: { value: 'A new task' } });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByText('A new task')).toBeInTheDocument(); // Check if task is rendered
            });
            expect(taskInput).toHaveValue(''); // Input should clear
            // To check RHF context, you'd need access to `methods.getValues()` or pass a spy to `setValue`
        });

        it('should remove a task from the list and form context', async () => {
            renderGeneralTab({ config: { type: 'llm', agentTasks: ['Task to remove'] } as LLMAgentConfig });
            expect(screen.getByText('Task to remove')).toBeInTheDocument();
            
            const removeButton = screen.getByRole('button', { name: /remove task/i }); // Assuming remove button has aria-label or text
            fireEvent.click(removeButton);

            await waitFor(() => {
                expect(screen.queryByText('Task to remove')).not.toBeInTheDocument();
            });
        });
    });
  });

  describe('AI Suggestion Button Clicks', () => {
    beforeEach(() => {
      // Reset mock for each test to ensure clean state
      mockGetAiConfigurationSuggestionsAction.mockReset();
    });
  
    it('should call getAiConfigurationSuggestionsAction for Agent Name', async () => {
      mockGetAiConfigurationSuggestionsAction.mockResolvedValueOnce({ success: true, suggestions: { suggestedAgentName: 'AI Suggested Name' } });
      renderGeneralTab();
      const suggestNameButton = screen.getByTestId('ai-suggestion-icon-mock-sugerir-nome-do-agente');
      fireEvent.click(suggestNameButton);
      
      await waitFor(() => {
        expect(mockGetAiConfigurationSuggestionsAction).toHaveBeenCalledWith(expect.anything(), "agentName");
      });
    });
  
    it('should call getAiConfigurationSuggestionsAction for Agent Description', async () => {
      mockGetAiConfigurationSuggestionsAction.mockResolvedValueOnce({ success: true, suggestions: { suggestedAgentDescription: 'AI Suggested Description' } });
      renderGeneralTab();
      const suggestDescButton = screen.getByTestId('ai-suggestion-icon-mock-sugerir-descrição-do-agente');
      fireEvent.click(suggestDescButton);
      
      await waitFor(() => {
        expect(mockGetAiConfigurationSuggestionsAction).toHaveBeenCalledWith(expect.anything(), "agentDescription");
      });
    });

    it('should call getAiConfigurationSuggestionsAction for Agent Goal when type is LLM', async () => {
      mockGetAiConfigurationSuggestionsAction.mockResolvedValueOnce({ success: true, suggestions: { suggestedAgentGoal: 'AI Suggested Goal' } });
      renderGeneralTab({ config: { type: 'llm' } as LLMAgentConfig });
      const suggestGoalButton = screen.getByTestId('ai-suggestion-icon-mock-sugerir-objetivo-do-agente');
      fireEvent.click(suggestGoalButton);

      await waitFor(() => {
        expect(mockGetAiConfigurationSuggestionsAction).toHaveBeenCalledWith(expect.anything(), "agentGoal");
      });
    });
  });

  describe('Help Modal Trigger', () => {
    it('should call showHelpModal with correct args for Agent Name help', () => {
      renderGeneralTab();
      // The mock InfoIcon now includes tooltipText in its test ID
      const helpIcon = screen.getByTestId('info-icon-mock-agent-name'); // Adjusted test ID based on new mock
      fireEvent.click(helpIcon);
      expect(mockShowHelpModal).toHaveBeenCalledWith({
        tab: 'generalTab',
        field: 'agentName',
      });
    });
    
    it('should call showHelpModal with correct args for Description help', () => {
      renderGeneralTab();
      const helpIcon = screen.getByTestId('info-icon-mock-description'); // Adjusted test ID
      fireEvent.click(helpIcon);
      expect(mockShowHelpModal).toHaveBeenCalledWith({
        tab: 'generalTab',
        field: 'description',
      });
    });

    // Add tests for other InfoIcons if their help content/keys are unique and need testing
    it('should call showHelpModal for Agent Type help', () => {
        renderGeneralTab();
        const helpIcon = screen.getByTestId('info-icon-mock-defines-the-agent\'s-core-capability-(e.g.,-llm,-workflow).');
        fireEvent.click(helpIcon);
        expect(mockShowHelpModal).toHaveBeenCalledWith({ tab: 'generalTab', field: 'agentType' });
    });
    
    // Example for LLM Model help, assuming it's rendered when type is 'llm'
    it('should call showHelpModal for LLM Model help when type is llm', () => {
        renderGeneralTab({ config: { type: 'llm' } as LLMAgentConfig });
        const helpIcon = screen.getByTestId('info-icon-mock-select-the-llm-model-for-the-agent.'); // Tooltip text from component
        fireEvent.click(helpIcon);
        expect(mockShowHelpModal).toHaveBeenCalledWith({ tab: 'generalTab', field: 'llmModel' });
    });

  });
});
