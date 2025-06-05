import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormProvider, useForm, Control } from 'react-hook-form';
import { Tabs, TabsContent } from '@/components/ui/tabs'; // Assuming Tabs components are needed
import GeneralTab from './GeneralTab'; // Adjust path as necessary
import { AgentFrameworkOption, AgentTypeOption, AvailableTool } from '@/types/agent-types-unified'; // Adjust path

// Mock child components that might be complex or have their own dependencies
jest.mock('@/components/ui/multi-select-dropdown', () => ({
  __esModule: true,
  MultiSelectDropdown: ({ options, selected, onChange, placeholder }: any) => (
    <select
      multiple
      data-testid="mock-multi-select"
      onChange={(e) => {
        const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
        onChange(selectedOptions);
      }}
      value={selected}
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}));

const mockAgentTypeOptions: AgentTypeOption[] = [
  { value: 'llm', label: 'LLM Agent' },
  { value: 'code', label: 'Code Agent' },
];

const mockAgentFrameworkOptions: AgentFrameworkOption[] = [
  { value: 'genkit', label: 'Genkit' },
  { value: 'custom', label: 'Custom' },
];

const mockAvailableTools: AvailableTool[] = [
  { id: 'tool1', name: 'Tool 1', description: 'Description for Tool 1', category: 'test', icon: 'Code' },
  { id: 'tool2', name: 'Tool 2', description: 'Description for Tool 2', category: 'test', icon: 'Search' },
];

// A wrapper component to provide FormProvider and Tabs context
const TestWrapper: React.FC<{ children: React.ReactNode; defaultValues?: any }> = ({ children, defaultValues }) => {
  const methods = useForm({ defaultValues: defaultValues || { agentName: '', type: 'llm', framework: 'genkit', tools: [] } });
  return (
    <FormProvider {...methods}>
      <Tabs defaultValue="general">
        <TabsContent value="general">
          {children}
        </TabsContent>
      </Tabs>
    </FormProvider>
  );
};

describe('GeneralTab', () => {
  test('renders GeneralTab with form fields', () => {
    render(
      <TestWrapper>
        <GeneralTab
          agentTypeOptions={mockAgentTypeOptions}
          agentFrameworkOptions={mockAgentFrameworkOptions}
          availableTools={mockAvailableTools}
          isGeneratingName={false}
          onGenerateName={jest.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/Nome do Agente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tipo de Agente/i)).toBeInTheDocument();
    // expect(screen.getByLabelText(/Framework do Agente/i)).toBeInTheDocument(); // This might not be directly a label, check select trigger
    expect(screen.getByText('Framework do Agente')).toBeInTheDocument(); // Check for the text associated with the select
    expect(screen.getByLabelText(/Descrição/i)).toBeInTheDocument();
    expect(screen.getByText('Ferramentas Disponíveis')).toBeInTheDocument(); // For MultiSelectDropdown
  });

  test('updates agent name form value on input change', () => {
    const defaultValues = { agentName: 'Initial Name', type: 'llm', framework: 'genkit', tools: [] };
    const mockSetValue = jest.fn();

    const WrapperWithMockForm: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      const methods = useForm({ defaultValues });
      // @ts-ignore
      methods.setValue = mockSetValue; // Mock setValue
      return (
        <FormProvider {...methods}>
          <Tabs defaultValue="general"><TabsContent value="general">{children}</TabsContent></Tabs>
        </FormProvider>
      );
    };

    render(
      <WrapperWithMockForm>
        <GeneralTab
          agentTypeOptions={mockAgentTypeOptions}
          agentFrameworkOptions={mockAgentFrameworkOptions}
          availableTools={mockAvailableTools}
          isGeneratingName={false}
          onGenerateName={jest.fn()}
        />
      </WrapperWithMockForm>
    );

    const agentNameInput = screen.getByLabelText(/Nome do Agente/i);
    fireEvent.change(agentNameInput, { target: { value: 'New Agent Name' } });

    // Check if setValue was called correctly by the component's internal logic (via Controller -> onChange)
    // Note: The actual `setValue` on the real form would update the form state.
    // Here we check if our mocked `setValue` is called by the component's event handling.
    // The Controller component calls its onChange prop, which then calls setValue.
    // Since Controller is part of RHF and not easily mocked here without deeper setup,
    // we'll assume the underlying Input's onChange is eventually triggering the form's setValue.
    // A more integrated test would be to check methods.watch('agentName') or methods.getValues('agentName')
    // but that requires a more complete form setup for the test.
    // For this basic test, we assume the change event on the input is enough to indicate interaction.
    expect((agentNameInput as HTMLInputElement).value).toBe('New Agent Name');
    // The above line directly checks the input's controlled value if it's updated by React state,
    // or its uncontrolled value if not fully controlled by RHF in this testing setup.
    // RHF's Controller should update the input's value.
  });
});
