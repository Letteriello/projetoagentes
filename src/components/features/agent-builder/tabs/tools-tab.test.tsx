import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormProvider, useForm } from 'react-hook-form';
import ToolsTab from './tools-tab'; // Adjust path as needed
import { SavedAgentConfiguration, AvailableTool, ToolConfigData } from '@/types/agent-configs-fixed'; // Adjust path
import { iconComponents as actualIconComponents } from '@/data/agentBuilderConfig'; // For real icons if not all mocked

// --- Mocks ---
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockShowHelpModalGlobal = jest.fn();
jest.mock('@/components/ui/InfoIcon', () => ({
  InfoIcon: ({ tooltipText, onClick }: { tooltipText: string; onClick?: () => void }) => (
    <button data-testid={`info-icon-mock-${tooltipText?.toLowerCase().replace(/\s+/g, '-') || 'general'}`} onClick={onClick}>
      Info
    </button>
  ),
}));

// Mock icons that are passed as props, if they are not simple strings/names
const MockSettingsIcon = () => <div data-testid="settings-icon-mock">S</div>;
const MockCheckIcon = () => <div data-testid="check-icon-mock">C</div>;

// Mock JsonEditorField if it's used by ToolConfigModal (inline)
jest.mock('@/components/ui/JsonEditorField', () => ({ value, onChange, ...rest }: any) => (
  <textarea
    data-testid="json-editor-field-mock"
    value={value || ''} // Ensure value is not null/undefined
    onChange={(e) => onChange(e.target.value)}
    {...rest}
  />
));


const mockAvailableToolsList: AvailableTool[] = [
  { id: 'tool1', name: 'Web Search Tool', label: 'Web Search', description: 'Searches the internet.', type: 'genkit_native', icon: 'Search', genkitToolName: 'webSearch', hasConfig: true, configFields: [{ key: 'apiKey', label: 'API Key', fieldType: 'password', required: true }] },
  { id: 'tool2', name: 'Calculator Tool', label: 'Calculator', description: 'Performs calculations.', type: 'genkit_native', icon: 'Calculator', genkitToolName: 'calculator' },
  { id: 'tool3', name: 'Knowledge Base Tool', label: 'KB Search', description: 'Searches knowledge base.', type: 'genkit_native', icon: 'FileText', genkitToolName: 'kbSearch', serviceTypeRequired: 'vectorDB', configFields: [{key: 'dbId', label: 'Database ID', fieldType: 'text', required: true}]}
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
      tools: [],
      toolConfigsApplied: {},
      config: { type: 'llm' } as any, // Ensure config.type is present for some conditional logic if any
      ...formDefaultValues,
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
};


describe('ToolsTab', () => {
  let mockSetSelectedTools: jest.Mock;
  let mockUpdateToolConfig: jest.Mock; // For RHF's setValue(`toolConfigsApplied.${toolId}`, ...)
  let mockShowHelpModal: jest.Mock;

  beforeEach(() => {
    mockSetSelectedTools = jest.fn();
    mockUpdateToolConfig = jest.fn();
    mockShowHelpModal = jest.fn();
    mockToast.mockClear();
  });

  const renderToolsTab = (
    availableTools = mockAvailableToolsList,
    selectedTools: string[] = [],
    toolConfigsApplied: Record<string, ToolConfigData> = {}
  ) => {
    // Props that mimic what RHF `watch` and `setValue` would provide/do
    const rhfSelectedTools = selectedTools;
    const rhfToolConfigsApplied = toolConfigsApplied;

    return render(
      <TestWrapper defaultValues={{ tools: rhfSelectedTools, toolConfigsApplied: rhfToolConfigsApplied }}>
        <ToolsTab
          availableTools={availableTools}
          selectedTools={rhfSelectedTools} // from watch('tools')
          setSelectedTools={mockSetSelectedTools} // setValue('tools', ...)
          toolConfigsApplied={rhfToolConfigsApplied} // from watch('toolConfigsApplied')
          updateToolConfig={mockUpdateToolConfig} // setValue(`toolConfigsApplied.${toolId}`, ...)
          onToolConfigure={jest.fn()} // This prop is for external modal, internal modal is tested here
          iconComponents={actualIconComponents as any} // Using actual icons for ToolCard
          InfoIcon={actualIconComponents.Info as any} // Pass actual or mock
          SettingsIcon={MockSettingsIcon as any}
          CheckIcon={MockCheckIcon as any}
          PlusCircleIcon={actualIconComponents.PlusCircle as any}
          Trash2Icon={actualIconComponents.Trash2 as any}
          showHelpModal={mockShowHelpModal}
        />
      </TestWrapper>
    );
  };

  describe('Rendering Tools', () => {
    it('should render all available tools', () => {
      renderToolsTab();
      expect(screen.getByText('Web Search Tool')).toBeInTheDocument();
      expect(screen.getByText('Calculator Tool')).toBeInTheDocument();
      expect(screen.getByText('Knowledge Base Tool')).toBeInTheDocument();
    });

    it('should indicate selected tools', () => {
      renderToolsTab(mockAvailableToolsList, ['tool1']);
      // ToolCard usually has a checkbox or a visual indicator (e.g., data-selected attribute or specific style/icon)
      // Assuming ToolCard uses a checkbox role for selection state
      const webSearchCard = screen.getByText('Web Search Tool').closest('div[role="group"]'); // Assuming ToolCard root has role group or similar
      expect(within(webSearchCard!).getByRole('checkbox', { checked: true })).toBeInTheDocument();
      
      const calculatorCard = screen.getByText('Calculator Tool').closest('div[role="group"]');
      expect(within(calculatorCard!).getByRole('checkbox', { checked: false })).toBeInTheDocument();
    });

    it('should show configuration button for tools with hasConfig or serviceTypeRequired', () => {
      renderToolsTab();
      const webSearchCard = screen.getByText('Web Search Tool').closest('div[role="group"]');
      expect(within(webSearchCard!).getByTestId('settings-icon-mock')).toBeVisible(); // tool1 hasConfig

      const calculatorCard = screen.getByText('Calculator Tool').closest('div[role="group"]');
      expect(within(calculatorCard!).queryByTestId('settings-icon-mock')).not.toBeInTheDocument(); // tool2 no config

      const kbSearchCard = screen.getByText('Knowledge Base Tool').closest('div[role="group"]');
      expect(within(kbSearchCard!).getByTestId('settings-icon-mock')).toBeVisible(); // tool3 serviceTypeRequired
    });
  });

  describe('Selecting and Deselecting Tools', () => {
    it('should call setSelectedTools with added tool ID when an unselected tool is clicked', () => {
      renderToolsTab(mockAvailableToolsList, []); // No tools selected initially
      const calculatorCard = screen.getByText('Calculator Tool').closest('div[role="group"]');
      fireEvent.click(within(calculatorCard!).getByRole('checkbox')); // Click the checkbox/selection area
      expect(mockSetSelectedTools).toHaveBeenCalledWith(['tool2']);
    });

    it('should call setSelectedTools with removed tool ID when a selected tool is clicked', () => {
      renderToolsTab(mockAvailableToolsList, ['tool1', 'tool2']); // tool2 is selected
      const calculatorCard = screen.getByText('Calculator Tool').closest('div[role="group"]');
      fireEvent.click(within(calculatorCard!).getByRole('checkbox'));
      expect(mockSetSelectedTools).toHaveBeenCalledWith(['tool1']); // tool2 removed
    });
  });

  describe('Tool Search/Filter', () => {
    it('should filter tools based on search input', async () => {
      renderToolsTab();
      const searchInput = screen.getByPlaceholderText('Search tools by name or description...');
      fireEvent.change(searchInput, { target: { value: 'Web' } });
      await waitFor(() => {
        expect(screen.getByText('Web Search Tool')).toBeVisible();
        expect(screen.queryByText('Calculator Tool')).not.toBeInTheDocument();
        expect(screen.queryByText('Knowledge Base Tool')).not.toBeInTheDocument();
      });
    });

    it('should show all tools when search input is cleared', async () => {
      renderToolsTab();
      const searchInput = screen.getByPlaceholderText('Search tools by name or description...');
      fireEvent.change(searchInput, { target: { value: 'Web' } });
      await waitFor(() => expect(screen.queryByText('Calculator Tool')).not.toBeInTheDocument());
      
      fireEvent.change(searchInput, { target: { value: '' } });
      await waitFor(() => {
        expect(screen.getByText('Web Search Tool')).toBeVisible();
        expect(screen.getByText('Calculator Tool')).toBeVisible();
        expect(screen.getByText('Knowledge Base Tool')).toBeVisible();
      });
    });
  });

  describe('Tool Configuration Modal (Inline)', () => {
    const toolWithConfig = mockAvailableToolsList[0]; // Web Search Tool (tool1)

    it('should open the modal when configure button is clicked', async () => {
      renderToolsTab();
      const webSearchCard = screen.getByText(toolWithConfig.name).closest('div[role="group"]');
      fireEvent.click(within(webSearchCard!).getByTestId('settings-icon-mock'));
      
      // Modal is part of ToolsTab, should appear
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: `Configure ${toolWithConfig.name}` })).toBeVisible();
        expect(screen.getByLabelText(toolWithConfig.configFields![0].label)).toBeInTheDocument(); // API Key
      });
    });

    it('should populate modal with existing config and call updateToolConfig on save', async () => {
      const existingConfigs = { [toolWithConfig.id]: { apiKey: 'prev-key' } };
      renderToolsTab(mockAvailableToolsList, [toolWithConfig.id], existingConfigs);
      
      const webSearchCard = screen.getByText(toolWithConfig.name).closest('div[role="group"]');
      fireEvent.click(within(webSearchCard!).getByTestId('settings-icon-mock'));

      await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible());
      const apiKeyInput = screen.getByLabelText(toolWithConfig.configFields![0].label);
      expect(apiKeyInput).toHaveValue('prev-key');

      fireEvent.change(apiKeyInput, { target: { value: 'new-api-key' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save Configuration' }));

      expect(mockUpdateToolConfig).toHaveBeenCalledWith(toolWithConfig.id, { apiKey: 'new-api-key' });
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument()); // Modal closes
    });
  });
  
  // Help Modal Trigger test would go here if ToolsTab has its own general InfoIcons
  // For now, specific help for tool configuration is part of ToolConfigModal.
});
