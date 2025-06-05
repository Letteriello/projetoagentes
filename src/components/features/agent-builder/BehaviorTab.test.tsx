import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import BehaviorTab from './BehaviorTab'; // Adjust path as necessary
import { AgentToneOption } from '@/types/agent-types-unified'; // Adjust path

// Mock child forms to simplify testing
jest.mock('@/components/features/agent-builder/forms/LLMBehaviorForm', () => () => <div data-testid="mock-llm-behavior-form">LLM Behavior Form</div>);
jest.mock('@/components/features/agent-builder/forms/WorkflowBehaviorForm', () => () => <div data-testid="mock-workflow-behavior-form">Workflow Behavior Form</div>);
jest.mock('@/components/features/agent-builder/forms/CustomBehaviorForm', () => () => <div data-testid="mock-custom-behavior-form">Custom Behavior Form</div>);

const mockAgentToneOptions: AgentToneOption[] = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'friendly', label: 'Friendly' },
];

const mockShowHelpModal = jest.fn();

// A wrapper component to provide FormProvider and Tabs context
const TestWrapper: React.FC<{ children: React.ReactNode; defaultValues?: any; formMethods?: UseFormReturn<any>}> = ({ children, defaultValues, formMethods }) => {
  const methods = formMethods || useForm({ defaultValues: defaultValues || { config: { type: 'llm', systemPrompt: '' } } });
  return (
    <FormProvider {...methods}>
      <Tabs defaultValue="behavior">
        <TabsContent value="behavior">
          {children}
        </TabsContent>
      </Tabs>
    </FormProvider>
  );
};

describe('BehaviorTab', () => {
  test('renders BehaviorTab with global instruction field', () => {
    render(
      <TestWrapper>
        <BehaviorTab
          agentToneOptions={mockAgentToneOptions}
          showHelpModal={mockShowHelpModal}
        />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/Instrução Global do Sistema/i)).toBeInTheDocument();
  });

  test('conditionally renders LLMBehaviorForm when agent type is "llm"', () => {
    const mockWatch = jest.fn(() => 'llm');
    const methods = useForm({ defaultValues: { config: { type: 'llm' } } });
    // @ts-ignore
    methods.watch = mockWatch;

    render(
      <TestWrapper formMethods={methods}>
        <BehaviorTab
          agentToneOptions={mockAgentToneOptions}
          showHelpModal={mockShowHelpModal}
        />
      </TestWrapper>
    );
    expect(screen.getByTestId('mock-llm-behavior-form')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-workflow-behavior-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-custom-behavior-form')).not.toBeInTheDocument();
    expect(mockWatch).toHaveBeenCalledWith('config.type');
  });

  test('conditionally renders WorkflowBehaviorForm when agent type is "workflow"', () => {
    const mockWatch = jest.fn(() => 'workflow');
    const methods = useForm({ defaultValues: { config: { type: 'workflow' } } });
     // @ts-ignore
    methods.watch = mockWatch;

    render(
      <TestWrapper formMethods={methods}>
        <BehaviorTab
          agentToneOptions={mockAgentToneOptions}
          showHelpModal={mockShowHelpModal}
        />
      </TestWrapper>
    );
    expect(screen.getByTestId('mock-workflow-behavior-form')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-llm-behavior-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-custom-behavior-form')).not.toBeInTheDocument();
    expect(mockWatch).toHaveBeenCalledWith('config.type');
  });

  test('conditionally renders CustomBehaviorForm when agent type is "custom"', () => {
    const mockWatch = jest.fn(() => 'custom');
    const methods = useForm({ defaultValues: { config: { type: 'custom' } } });
     // @ts-ignore
    methods.watch = mockWatch;

    render(
      <TestWrapper formMethods={methods}>
        <BehaviorTab
          agentToneOptions={mockAgentToneOptions}
          showHelpModal={mockShowHelpModal}
        />
      </TestWrapper>
    );
    expect(screen.getByTestId('mock-custom-behavior-form')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-llm-behavior-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-workflow-behavior-form')).not.toBeInTheDocument();
    expect(mockWatch).toHaveBeenCalledWith('config.type');
  });
});
