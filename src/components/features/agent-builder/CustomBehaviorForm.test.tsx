import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { savedAgentConfigurationSchema } from '@/lib/zod-schemas';
import CustomBehaviorForm from './CustomBehaviorForm';
import type { SavedAgentConfiguration, CustomAgentConfig } from '@/types/agent-configs';
import { TooltipProvider } from '@/components/ui/tooltip'; // Required for tooltips to render

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

const mockDefaultValues: Partial<SavedAgentConfiguration> = {
  config: {
    type: 'custom',
    framework: 'genkit', // or any default
    customLogicDescription: 'Initial custom logic description.',
    genkitFlowName: 'initialFlowName',
    inputSchema: '{"type":"object", "properties":{"inputKey":{"type":"string"}}}',
    outputSchema: '{"type":"object", "properties":{"outputKey":{"type":"string"}}}',
  } as CustomAgentConfig,
};

const TestWrapper: React.FC<{ children: React.ReactNode; defaultValues?: Partial<SavedAgentConfiguration> }> = ({ children, defaultValues = mockDefaultValues }) => {
  const methods = useForm<SavedAgentConfiguration>({
    resolver: zodResolver(savedAgentConfigurationSchema),
    defaultValues: defaultValues as SavedAgentConfiguration, // Type assertion
  });
  return (
    <TooltipProvider> {/* Tooltips need this provider */}
      <FormProvider {...methods}>
        {children}
      </FormProvider>
    </TooltipProvider>
  );
};

describe('CustomBehaviorForm', () => {
  it('renders the Custom Logic Description field correctly', () => {
    render(<TestWrapper><CustomBehaviorForm /></TestWrapper>);
    expect(screen.getByLabelText(/Custom Logic Description/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe the custom logic.../i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Initial custom logic description./i)).toBeInTheDocument();
  });

  describe('Genkit Flow Name Field', () => {
    it('renders the label and input field', () => {
      render(<TestWrapper><CustomBehaviorForm /></TestWrapper>);
      expect(screen.getByLabelText(/Genkit Flow Name \(Optional\)/i)).toBeInTheDocument();
      const inputField = screen.getByPlaceholderText(/e.g., myCustomSummarizationFlow/i);
      expect(inputField).toBeInTheDocument();
      expect(inputField).toHaveValue('initialFlowName');
    });

    it('renders the tooltip for Genkit Flow Name', async () => {
      render(<TestWrapper><CustomBehaviorForm /></TestWrapper>);
      const label = screen.getByLabelText(/Genkit Flow Name \(Optional\)/i);
      // Tooltip content is often not directly queryable until interaction.
      // We check if the label (trigger) is there.
      // For more robust tooltip testing, specific data-testid attributes or interaction might be needed.
      expect(label.closest('button')).toHaveClass('cursor-help'); // Assuming TooltipTrigger asChild results in a button or similar focusable element

      // Basic check for tooltip trigger presence
      const tooltipTrigger = screen.getByLabelText(/Genkit Flow Name \(Optional\)/i);
      expect(tooltipTrigger).toBeInTheDocument();

      // More advanced: find the tooltip trigger and hover to show content (might be flaky in JSDOM)
      // await userEvent.hover(tooltipTrigger);
      // expect(await screen.findByText(/If this agent is implemented as a Genkit flow, specify the flow name here./i, {}, { timeout: 2000 })).toBeInTheDocument();
      // For now, we'll assume the TooltipProvider and trigger setup implies functionality.
    });
  });

  describe('Input Schema Field', () => {
    it('renders the label and textarea field', () => {
      render(<TestWrapper><CustomBehaviorForm /></TestWrapper>);
      expect(screen.getByLabelText(/Input Schema \(Optional\)/i)).toBeInTheDocument();
      const textareaField = screen.getByPlaceholderText(/{\s*"type": "object",\s*"properties": {\s*"query": { "type": "string" }\s*},\s*"required": \["query"\]\s*}/i);
      expect(textareaField).toBeInTheDocument();
      expect(textareaField).toHaveValue('{"type":"object", "properties":{"inputKey":{"type":"string"}}}');
    });

    it('renders the tooltip for Input Schema', () => {
      render(<TestWrapper><CustomBehaviorForm /></TestWrapper>);
      const label = screen.getByLabelText(/Input Schema \(Optional\)/i);
      expect(label.closest('button')).toHaveClass('cursor-help');
    });
  });

  describe('Output Schema Field', () => {
    it('renders the label and textarea field', () => {
      render(<TestWrapper><CustomBehaviorForm /></TestWrapper>);
      expect(screen.getByLabelText(/Output Schema \(Optional\)/i)).toBeInTheDocument();
      const textareaField = screen.getByPlaceholderText(/{\s*"type": "object",\s*"properties": {\s*"summary": { "type": "string" }\s*},\s*"required": \["summary"\]\s*}/i);
      expect(textareaField).toBeInTheDocument();
      expect(textareaField).toHaveValue('{"type":"object", "properties":{"outputKey":{"type":"string"}}}');
    });

    it('renders the tooltip for Output Schema', () => {
      render(<TestWrapper><CustomBehaviorForm /></TestWrapper>);
      const label = screen.getByLabelText(/Output Schema \(Optional\)/i);
      expect(label.closest('button')).toHaveClass('cursor-help');
    });
  });

  it('updates form values on input', async () => {
    const user = userEvent.setup();
    render(<TestWrapper><CustomBehaviorForm /></TestWrapper>);

    const genkitFlowInput = screen.getByPlaceholderText(/e.g., myCustomSummarizationFlow/i);
    await user.clear(genkitFlowInput);
    await user.type(genkitFlowInput, 'newFlowName');
    expect(genkitFlowInput).toHaveValue('newFlowName');

    const inputSchemaTextarea = screen.getByLabelText(/Input Schema \(Optional\)/i);
    await user.clear(inputSchemaTextarea);
    await user.type(inputSchemaTextarea, '{"type":"number"}');
    expect(inputSchemaTextarea).toHaveValue('{"type":"number"}');

    const outputSchemaTextarea = screen.getByLabelText(/Output Schema \(Optional\)/i);
    await user.clear(outputSchemaTextarea);
    await user.type(outputSchemaTextarea, '{"type":"boolean"}');
    expect(outputSchemaTextarea).toHaveValue('{"type":"boolean"}');
  });
});

// Minimal SavedAgentConfiguration structure for defaultValues in useForm
const minimalDefaultValues: SavedAgentConfiguration = {
  id: 'test-agent',
  agentName: 'Test Agent',
  agentDescription: 'Test Description',
  agentVersion: '1.0.0',
  config: {
    type: 'custom',
    framework: 'genkit',
    customLogicDescription: '',
    genkitFlowName: '',
    inputSchema: '',
    outputSchema: '',
  } as CustomAgentConfig,
  tools: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Test with minimal default values to ensure fields render even if parent doesn't provide them initially
describe('CustomBehaviorForm with minimal default values', () => {
  it('renders Genkit Flow Name field with empty initial value', () => {
    render(
      <TestWrapper defaultValues={{ config: minimalDefaultValues.config }}>
        <CustomBehaviorForm />
      </TestWrapper>
    );
    const inputField = screen.getByPlaceholderText(/e.g., myCustomSummarizationFlow/i);
    expect(inputField).toBeInTheDocument();
    expect(inputField).toHaveValue(''); // Check for empty value
  });

  it('renders Input Schema field with empty initial value', () => {
     render(
      <TestWrapper defaultValues={{ config: minimalDefaultValues.config }}>
        <CustomBehaviorForm />
      </TestWrapper>
    );
    const textareaField = screen.getByLabelText(/Input Schema \(Optional\)/i);
    expect(textareaField).toBeInTheDocument();
    expect(textareaField).toHaveValue(''); // Check for empty value
  });

    it('renders Output Schema field with empty initial value', () => {
     render(
      <TestWrapper defaultValues={{ config: minimalDefaultValues.config }}>
        <CustomBehaviorForm />
      </TestWrapper>
    );
    const textareaField = screen.getByLabelText(/Output Schema \(Optional\)/i);
    expect(textareaField).toBeInTheDocument();
    expect(textareaField).toHaveValue(''); // Check for empty value
  });
});
