import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormProvider, useForm } from 'react-hook-form'; // For wrapping and getting methods if needed

import AgentBuilderDialog from './agent-builder-dialog'; // The component to test
import { SavedAgentConfiguration, LLMAgentConfig } from '@/types/agent-configs';
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content'; // Actual help content

// --- Mocks ---
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-1234',
}));

// Mock InfoIcon to allow simulating its onClick if needed for showHelpModal
jest.mock('@/components/ui/InfoIcon', () => ({
  InfoIcon: ({ tooltipText, onClick }: { tooltipText: string, onClick?: () => void}) => (
    <div data-testid="info-icon-mock" onClick={onClick}>{tooltipText}</div>
  )
}));

// Mock all child tab components to focus on dialog logic
// One tab (GeneralTab) is slightly more interactive to allow triggering showHelpModal
jest.mock('./tabs/general-tab', () => ({showHelpModal}: {showHelpModal: (args: any) => void}) => <div data-testid="general-tab-mock">GeneralTabMock <button onClick={() => showHelpModal({tab: 'generalTab', field: 'agentName'})}>HelpForAgentName</button></div>);
jest.mock('./tabs/tools-tab', () => () => <div data-testid="tools-tab-mock">ToolsTabMock</div>);
jest.mock('./tabs/behavior-tab', () => () => <div data-testid="behavior-tab-mock">BehaviorTabMock</div>);
jest.mock('./tabs/state-memory-tab', () => () => <div data-testid="state-memory-tab-mock">StateMemoryTabMock</div>);
jest.mock('./tabs/rag-tab', () => () => <div data-testid="rag-tab-mock">RagTabMock</div>);
jest.mock('./tabs/artifacts-tab', () => () => <div data-testid="artifacts-tab-mock">ArtifactsTabMock</div>);
jest.mock('./tabs/a2a-config', () => () => <div data-testid="a2a-config-mock">A2AConfigMock</div>);
jest.mock('./tabs/multi-agent-tab', () => () => <div data-testid="multi-agent-tab-mock">MultiAgentTabMock</div>);
jest.mock('./tabs/review-tab', () => () => <div data-testid="review-tab-mock">ReviewTabMock</div>);
jest.mock('./tabs/DeployTab', () => () => <div data-testid="deploy-tab-mock">DeployTabMock</div>);

// Mock HelpModal to verify its props and visibility
jest.mock('@/components/ui/HelpModal', () => ({ isOpen, onClose, title, children }: {isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode}) => isOpen ? (
    <div data-testid="help-modal-mock">
      <h1 data-testid="help-modal-title">{title}</h1>
      <div data-testid="help-modal-content">{children}</div>
      <button onClick={onClose}>CloseHelpModal</button>
    </div>
  ) : null
);


const mockAvailableTools = [
  { id: 'webSearch', name: 'Web Search', description: 'Searches the web', type: 'genkit_native' }, // Added type
  { id: 'calculator', name: 'Calculator', description: 'Calculates things', type: 'genkit_native' },
];
const mockAgentTypeOptions = [ // More structure for options
    { value: 'llm', label: 'LLM Agent' },
    { value: 'workflow', label: 'Workflow Agent' }
];
const mockAgentToneOptions = [ // More structure for options
    { id: 'friendly', label: 'Amigável e Prestativo'},
    { id: 'professional', label: 'Profissional e Direto'}
];
const mockIconComponents = {};
const mockAvailableAgentsForSubSelector = [{ id: 'agent1', agentName: 'Agent One' }];

const mockDefaultLLMAgentConfig: LLMAgentConfig = {
    type: 'llm',
    framework: 'genkit',
    agentGoal: '',
    agentTasks: [],
    agentPersonality: 'neutral',
    agentModel: 'gemini-1.5-flash-latest',
    agentTemperature: 0.7,
    safetySettings: [],
    statePersistence: { enabled: false, type: 'session', defaultScope: 'AGENT', initialStateValues: [], validationRules: [] },
    rag: { enabled: false, serviceType: 'in-memory', knowledgeSources: [], retrievalParameters: {}, persistentMemory: { enabled: false } },
    artifacts: { enabled: false, storageType: 'memory', definitions: [] },
    a2a: { enabled: false, communicationChannels: [], defaultResponseFormat: 'json', securityPolicy: 'none', loggingEnabled: false },
    adkCallbacks: {},
    deploymentConfig: {},
};

// Default data for a new agent, reflecting what createDefaultSavedAgentConfiguration would produce
const mockNewAgentDefaultData: Partial<SavedAgentConfiguration> = { // Partial to exclude functions and allow expect.any for dates
  id: 'mock-uuid-1234',
  agentName: '',
  agentDescription: '',
  agentVersion: '1.0.0',
  icon: '',
  templateId: '',
  isTemplate: false,
  isFavorite: false,
  tags: [],
  userId: '',
  config: mockDefaultLLMAgentConfig,
  tools: [],
  toolConfigsApplied: {},
  toolsDetails: [],
  internalVersion: 1,
  isLatest: true,
  originalAgentId: 'mock-uuid-1234',
};


const mockEditingAgent: SavedAgentConfiguration = {
  id: 'edit-agent-id-1',
  agentName: 'Test Edit Agent',
  agentDescription: 'Original Description',
  agentVersion: '1.0.0',
  config: { ...mockDefaultLLMAgentConfig, agentGoal: 'Original Goal', agentName: 'Test Edit Agent', agentDescription: 'Original Description', agentVersion: '1.0.0' }, // agentName etc. in config for LLM type
  createdAt: new Date('2023-01-01T00:00:00.000Z').toISOString(),
  updatedAt: new Date('2023-01-01T00:00:00.000Z').toISOString(),
  userId: 'test-user',
  tools: ['webSearch'],
  toolsDetails: [{id: 'webSearch', label: 'Web Search', iconName: 'Search', genkitToolName: 'performWebSearch'}],
  templateId: '', isTemplate: false, isFavorite: false, tags: [], icon: '',
  internalVersion: 1, isLatest: true, originalAgentId: 'edit-agent-id-1',
  toolConfigsApplied: {},
  deploymentConfig: { targetPlatform: undefined, environmentVariables: [], resourceRequirements: {cpu:'', memory:''} },
};

// Helper to get display name for tab values
const getTabDisplayName = (tabValue: string): string => {
  return tabValue.charAt(0).toUpperCase() + tabValue.slice(1).replace(/_/g, " ");
};


describe('AgentBuilderDialog', () => {
  let mockOnSave: jest.Mock;
  let mockOnOpenChange: jest.Mock;
  // Capture react-hook-form methods for spying if needed for advanced tests
  let currentFormMethods: any; 

  const TestWrapper = ({ children, editingAgentState }: any) => {
    const methods = useForm<SavedAgentConfiguration>({
      defaultValues: editingAgentState || mockNewAgentDefaultData,
    });
    currentFormMethods = methods; // Capture methods
    return <FormProvider {...methods}>{children}</FormProvider>;
  };


  beforeEach(() => {
    mockOnSave = jest.fn();
    mockOnOpenChange = jest.fn();
    mockToast.mockClear();
    currentFormMethods = null; 
  });

  const renderDialog = (props: Partial<React.ComponentProps<typeof AgentBuilderDialog>> = {}) => {
    const dialogProps = {
      isOpen: true,
      onOpenChange: mockOnOpenChange,
      onSave: mockOnSave,
      availableTools: mockAvailableTools,
      agentTypeOptions: mockAgentTypeOptions as any, 
      agentToneOptions: mockAgentToneOptions as any, 
      iconComponents: mockIconComponents,
      availableAgentsForSubSelector: mockAvailableAgentsForSubSelector,
      ...props,
    };
    
    // The dialog sets up its own FormProvider. We don't need to wrap it externally for basic rendering.
    // If we needed to control the form instance from outside for spying on reset, we would.
    // For now, we'll test reset via its effects (e.g. onSave data after import).
    return render(<AgentBuilderDialog {...dialogProps} />);
  };

  describe('Rendering in New Agent Mode', () => {
    it('should render correct title and default tab', () => {
      renderDialog();
      expect(screen.getByText('Criar Novo Agente IA')).toBeInTheDocument();
      expect(screen.getByTestId('general-tab-mock')).toBeVisible();
      expect(screen.getByRole('tab', { name: 'General', selected: true })).toBeVisible();
    });

    it('should have Next/Previous buttons and Save on Review tab', async () => {
      renderDialog();
      expect(screen.getByRole('button', { name: 'Próximo' })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Anterior' })).toBeInTheDocument(); // Is present, might be disabled

      const tabOrder = ['general', 'behavior', 'tools', 'memory_knowledge', 'artifacts', 'a2a', 'multi_agent_advanced', 'advanced', 'deploy', 'review'];
      for (let i = 0; i < tabOrder.length - 1; i++) {
        const nextButton = screen.queryByRole('button', { name: 'Próximo' });
        const reviewButton = screen.queryByRole('button', { name: 'Revisar' });
        
        if (nextButton && nextButton.offsetParent !== null) {
            fireEvent.click(nextButton);
        } else if (reviewButton && reviewButton.offsetParent !== null) {
            fireEvent.click(reviewButton);
            break; 
        } else {
            // This means we are likely on the review tab or an unexpected state
            if (tabOrder[i] !== 'review') { // if not on review, then it's an issue
                 console.warn(`Wizard navigation: Could not find Next/Revisar on tab ${tabOrder[i]}`);
            }
            break;
        }
      }
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Review', selected: true })).toBeVisible();
      });
      expect(screen.getByRole('button', { name: 'Salvar Agente' })).toBeVisible();
    });
  });

  describe('Rendering in Edit Agent Mode', () => {
    it('should render correct title and show save/export buttons', () => {
      renderDialog({ editingAgent: mockEditingAgent });
      expect(screen.getByText('Editar Agente IA')).toBeInTheDocument();
      expect(screen.getByTestId('general-tab-mock')).toBeVisible(); // Default tab
      expect(screen.getByRole('button', { name: 'Salvar Agente' })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Exportar Configuração' })).toBeVisible();
    });
  });

  describe('onSave Callback', () => {
    it('New Agent: should call onSave with default data, including new ID and timestamps', async () => {
      renderDialog();
      // Navigate to Review tab
      const tabOrder = ['general', 'behavior', 'tools', 'memory_knowledge', 'artifacts', 'a2a', 'multi_agent_advanced', 'advanced', 'deploy', 'review'];
      for (let i = 0; i < tabOrder.length - 1; i++) {
         const nextButton = screen.queryByRole('button', { name: 'Próximo' });
        const reviewButton = screen.queryByRole('button', { name: 'Revisar' });
        if (nextButton && nextButton.offsetParent !== null) {
             fireEvent.click(nextButton);
        } else if (reviewButton && reviewButton.offsetParent !== null) {
             fireEvent.click(reviewButton);
             break;
        } else break;
      }
      await waitFor(() => expect(screen.getByRole('tab', { name: 'Review', selected: true })).toBeVisible());
      
      fireEvent.click(screen.getByRole('button', { name: 'Salvar Agente' }));
      
      await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
      const savedData = mockOnSave.mock.calls[0][0];
      
      expect(savedData.id).toBe('mock-uuid-1234'); // From uuid mock
      expect(savedData.agentName).toBe(''); // Default from createDefault... via RHF
      expect(savedData.config.type).toBe('llm');
      expect(savedData.createdAt).toEqual(expect.any(String));
      expect(savedData.updatedAt).toEqual(expect.any(String));
      expect(new Date(savedData.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(savedData.createdAt).getTime());
    });

    it('Edit Agent: should call onSave with editingAgent data and updated timestamp', async () => {
      renderDialog({ editingAgent: mockEditingAgent });
      // In edit mode, Save button is in the footer, always available.
      fireEvent.click(screen.getByRole('button', { name: 'Salvar Agente' }));

      await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
      const savedData = mockOnSave.mock.calls[0][0];

      expect(savedData.id).toBe(mockEditingAgent.id);
      expect(savedData.agentName).toBe(mockEditingAgent.agentName); // Assuming no changes made for this test part
      expect(savedData.createdAt).toBe(mockEditingAgent.createdAt); // CreatedAt should persist
      expect(savedData.updatedAt).toEqual(expect.any(String));
      expect(new Date(savedData.updatedAt).getTime()).toBeGreaterThan(new Date(mockEditingAgent.updatedAt).getTime());
    });
  });

  describe('Tab Navigation (Edit Mode)', () => {
    it('should switch tabs when their triggers are clicked', async () => {
      renderDialog({ editingAgent: mockEditingAgent });
      
      fireEvent.click(screen.getByRole('tab', { name: 'Tools' }));
      await waitFor(() => expect(screen.getByRole('tab', { name: 'Tools', selected: true })).toBeVisible());
      expect(screen.getByTestId('tools-tab-mock')).toBeVisible(); // Check content visibility

      fireEvent.click(screen.getByRole('tab', { name: 'Behavior' }));
      await waitFor(() => expect(screen.getByRole('tab', { name: 'Behavior', selected: true })).toBeVisible());
      expect(screen.getByTestId('behavior-tab-mock')).toBeVisible();
    });
  });

  describe('File Import (handleFileImport)', () => {
    let mockFileReaderInstance: any;
    let readAsTextSpy: jest.Mock;
    let onloadCallback: Function | null = null;

    beforeEach(() => {
      readAsTextSpy = jest.fn();
      mockFileReaderInstance = {
        readAsText: readAsTextSpy,
        result: '',
        set onload(fn: Function) { // Intercept setting of onload
          onloadCallback = fn;
        },
        get onload() { return onloadCallback; }
      };
      jest.spyOn(window, 'FileReader').mockImplementation(() => mockFileReaderInstance);
    });

    afterEach(() => {
      jest.restoreAllMocks();
      onloadCallback = null;
    });

    it('should call methods.reset with parsed JSON data on successful file import', async () => {
      const importData = { agentName: 'Imported Agent Name', config: {type: 'custom', customLogicDescription: 'imported logic'} };
      const MOCK_FILE_CONTENT = JSON.stringify(importData);
      mockFileReaderInstance.result = MOCK_FILE_CONTENT; // Set the result for when onload is called

      renderDialog(); // New agent mode

      const fileInput = screen.getByTestId('dialog-root-content').querySelector('input[type="file"]');
      expect(fileInput).not.toBeVisible(); // display: none

      // Simulate click on "Importar Configuração" button which then clicks the file input
      const importButton = screen.getByRole('button', { name: 'Importar Configuração' });
      
      // We can't directly fireEvent.click on hidden input.
      // Instead, we directly manipulate the file input's files property and dispatch 'change'.
      // This bypasses needing to make it visible.
      const mockFile = new File([MOCK_FILE_CONTENT], 'import.json', { type: 'application/json' });
      
      // Spy on the reset method of the form instance. This requires getting the instance.
      // This is hard without context exposure or deeper mocking of useForm.
      // As an alternative: verify the effect of reset by checking if data is passed to onSave.

      await act(async () => { // Wrap state updates and event dispatches in act
        if (fileInput) {
          Object.defineProperty(fileInput, 'files', { value: [mockFile] });
          fireEvent.change(fileInput); // FileReader.readAsText should be called by onChange
        }
        if (onloadCallback) { // Manually trigger onload if it was set
          onloadCallback();
        }
      });
      
      // Verify data by attempting to save and checking what onSave receives
      const tabOrder = ['general', 'behavior', 'tools', 'memory_knowledge', 'artifacts', 'a2a', 'multi_agent_advanced', 'advanced', 'deploy', 'review'];
      for (let i = 0; i < tabOrder.length - 1; i++) {
        const nextButton = screen.queryByRole('button', { name: 'Próximo' });
        const reviewButton = screen.queryByRole('button', { name: 'Revisar' });
        if (nextButton && nextButton.offsetParent !== null) {
             fireEvent.click(nextButton);
        } else if (reviewButton && reviewButton.offsetParent !== null) {
             fireEvent.click(reviewButton);
             break;
        } else break;
      }
      await waitFor(() => expect(screen.getByRole('tab', { name: 'Review', selected: true })).toBeVisible());
      fireEvent.click(screen.getByRole('button', { name: 'Salvar Agente' }));

      await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
      const savedData = mockOnSave.mock.calls[0][0];

      // Check if parts of the imported data are present in what's saved
      expect(savedData.agentName).toBe(importData.agentName);
      expect(savedData.config.type).toBe(importData.config.type);
      expect((savedData.config as CustomAgentConfig).customLogicDescription).toBe(importData.config.customLogicDescription);
    });
  });
  
  describe('Help Modal (showHelpModal)', () => {
    it('should display HelpModal with correct content when triggered from GeneralTab mock', async () => {
      renderDialog();
      // GeneralTabMock has a button that calls showHelpModal for 'generalTab', 'agentName'
      const helpTriggerButton = screen.getByText('HelpForAgentName');
      fireEvent.click(helpTriggerButton);

      await waitFor(() => expect(screen.getByTestId('help-modal-mock')).toBeVisible());
      
      const expectedTitle = agentBuilderHelpContent.generalTab.agentName.modal!.title;
      expect(screen.getByTestId('help-modal-title')).toHaveTextContent(expectedTitle);
      // Mocked HelpModal renders children, so content check is against what the mock does
      // For actual content: expect(screen.getByTestId('help-modal-content').innerHTML).toContain(agentBuilderHelpContent.generalTab.agentName.modal!.body);
    });
  });
});
