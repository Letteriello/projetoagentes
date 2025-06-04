import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { savedAgentConfigurationSchema, SavedAgentConfiguration } from '@/lib/zod-schemas';
import A2AConfigTab from './a2a-config'; // Adjust path as necessary
import { TooltipProvider } from '@/components/ui/tooltip';
import { PlusIcon, Trash2Icon } from 'lucide-react'; // Example icons

// Mock JsonEditorField
jest.mock('@/components/ui/JsonEditorField', () => {
  const MockJsonEditorField = jest.fn(({ value, onChange, id, ...props }) => (
    <textarea
      data-testid={id || 'mock-json-editor-a2a'} // Unique testid prefix for this context
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      {...props} // Pass through other props like placeholder, height
    />
  ));
  return MockJsonEditorField;
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock InfoIconComponent as it's used internally
jest.mock('@/components/ui/InfoIcon', () => ({
  InfoIconComponent: jest.fn(({ tooltipText, onClick }) => (
    <button data-testid="mock-info-icon" onClick={onClick}>
      {tooltipText ? `(Info: ${tooltipText.substring(0,10)}...)` : '(Info)'}
    </button>
  )),
}));


const mockShowHelpModal = jest.fn();

const TestWrapper: React.FC<{ children: React.ReactNode; defaultValues?: Partial<SavedAgentConfiguration> }> = ({ children, defaultValues }) => {
  const methods = useForm<SavedAgentConfiguration>({
    resolver: zodResolver(savedAgentConfigurationSchema),
    defaultValues: defaultValues as SavedAgentConfiguration || {
      config: {
        a2a: {
          enabled: false,
          communicationChannels: [],
          securityPolicy: 'none',
        }
      }
    } as SavedAgentConfiguration,
  });
  return (
    <TooltipProvider>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(() => {})}>{children}</form>
      </FormProvider>
    </TooltipProvider>
  );
};

describe('A2AConfigTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the A2A enable switch', () => {
    render(
      <TestWrapper>
        <A2AConfigTab showHelpModal={mockShowHelpModal} PlusIcon={PlusIcon} Trash2Icon={Trash2Icon} />
      </TestWrapper>
    );
    expect(screen.getByLabelText(/Enable Agent-to-Agent \(A2A\) Communication Features/i)).toBeInTheDocument();
  });

  it('does not show channel configuration if A2A is disabled', () => {
    render(
      <TestWrapper defaultValues={{ config: { a2a: { enabled: false, communicationChannels: [] } } as any }}>
        <A2AConfigTab showHelpModal={mockShowHelpModal} PlusIcon={PlusIcon} Trash2Icon={Trash2Icon} />
      </TestWrapper>
    );
    expect(screen.queryByText(/Communication Channels/i)).not.toBeInTheDocument();
  });

  it('shows channel configuration when A2A is enabled', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper defaultValues={{ config: { a2a: { enabled: false, communicationChannels: [] } } as any }}>
        <A2AConfigTab showHelpModal={mockShowHelpModal} PlusIcon={PlusIcon} Trash2Icon={Trash2Icon} />
      </TestWrapper>
    );
    const enableSwitch = screen.getByLabelText(/Enable Agent-to-Agent \(A2A\) Communication Features/i);
    await user.click(enableSwitch);
    expect(screen.getByText(/Communication Channels/i)).toBeInTheDocument();
  });

  it('allows adding and removing communication channels', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper defaultValues={{ config: { a2a: { enabled: true, communicationChannels: [] } } as any }}>
        <A2AConfigTab showHelpModal={mockShowHelpModal} PlusIcon={PlusIcon} Trash2Icon={Trash2Icon} />
      </TestWrapper>
    );

    const addChannelButton = screen.getByRole('button', { name: /Add Channel/i });
    await user.click(addChannelButton);

    expect(screen.getByPlaceholderText(/Channel Name/i)).toBeInTheDocument();
    // Check for JsonEditorField via its data-testid (constructed from field name)
    expect(screen.getByTestId('config.a2a.communicationChannels.0.schema')).toBeInTheDocument();

    await user.click(addChannelButton);
    expect(screen.getByTestId('config.a2a.communicationChannels.1.schema')).toBeInTheDocument();

    const removeButtons = screen.getAllByRole('button', { name: /Remove Channel/i });
    expect(removeButtons).toHaveLength(2);
    await user.click(removeButtons[0]);

    expect(screen.queryByTestId('config.a2a.communicationChannels.1.schema')).not.toBeInTheDocument();
    // After removing the first, the second one's index might become 0 if RHF re-indexes.
    // Or it might be gone if the testid was specific to the initial index.
    // Let's check if only one schema editor remains.
    const remainingEditors = await screen.findAllByTestId(/mock-json-editor-a2a/i);
    expect(remainingEditors).toHaveLength(1);
    // More robust: Check for a specific field that was the second one.
    // For this, the mock JsonEditorField's test id should be stable or predictable.
    // The current mock uses field.name, which RHF updates. So, the remaining field will be 'config.a2a.communicationChannels.0.schema'.
    expect(screen.getByTestId('config.a2a.communicationChannels.0.schema')).toBeInTheDocument();


  });

  it('renders JsonEditorField with correct props for channel schema', async () => {
    const user = userEvent.setup();
    const initialSchemaValue = '{"type":"string"}';
    render(
      <TestWrapper defaultValues={{ config: { a2a: { enabled: true, communicationChannels: [{ name: 'TestChan', schema: initialSchemaValue }] } } as any }}>
        <A2AConfigTab showHelpModal={mockShowHelpModal} PlusIcon={PlusIcon} Trash2Icon={Trash2Icon} />
      </TestWrapper>
    );

    const editor = screen.getByTestId('config.a2a.communicationChannels.0.schema');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveValue(initialSchemaValue);
    expect(editor).toHaveAttribute('placeholder', 'Message Schema (JSON Schema string or URL, optional)');
    // The mock JsonEditorField was called with height="150px" (from the example usage in prompt)
    // We can check if the underlying mock component (textarea) received it or if the JsonEditorField mock itself was called with it.
    const MockJsonEditor = require('@/components/ui/JsonEditorField');
    expect(MockJsonEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'config.a2a.communicationChannels.0.schema',
        value: initialSchemaValue,
        height: "150px", // This was specified in the prompt's example for a2a-config
        placeholder: "Message Schema (JSON Schema string or URL, optional)"
      }),
      {}
    );

    // Test onChange
    await user.clear(editor);
    await user.type(editor, '{"type":"number"}');
    expect(editor).toHaveValue('{"type":"number"}');
  });

  // Add more tests for other fields as needed (security policy, logging, etc.)
  it('renders security policy dropdown', () => {
    render(
      <TestWrapper defaultValues={{ config: { a2a: { enabled: true } } as any }}>
        <A2AConfigTab showHelpModal={mockShowHelpModal} PlusIcon={PlusIcon} Trash2Icon={Trash2Icon} />
      </TestWrapper>
    );
    expect(screen.getByText('Security Policy')).toBeInTheDocument();
    // Further interaction tests can be added here
  });

});
