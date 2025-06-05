import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormProvider, useForm } from 'react-hook-form';
import BehaviorTab from './behavior-tab'; // Adjust path as needed
import { SavedAgentConfiguration, LLMAgentConfig, AgentType } from '@/types/agent-configs-fixed'; // Adjust path

// --- Mocks ---
const mockShowHelpModalGlobal = jest.fn();
jest.mock('@/components/ui/InfoIcon', () => ({
  InfoIcon: ({ tooltipText, onClick }: { tooltipText: string; onClick: () => void }) => (
    <button data-testid={`info-icon-mock-${tooltipText}`} onClick={onClick}>
      Info
    </button>
  ),
}));

// Mock Slider if its internals are complex or to control its behavior,
// but for Radix slider, direct interaction is often possible and preferable.
// For now, we will use the actual Slider component.

const mockAgentToneOptions = [
  'Amigável e Prestativo', // Friendly
  'Profissional e Direto',  // Professional
  'Criativo e Inspirador',  // Creative
];


const TestWrapper = ({
  children,
  defaultValuesProp = {},
}: {
  children: React.ReactNode;
  defaultValuesProp?: Partial<SavedAgentConfiguration>;
}) => {
  // Ensure config and its type are always present in defaultValues for the test wrapper
  const completeDefaultValues = {
    agentName: 'Test Agent', // Required by top-level schema, provide a default
    agentDescription: 'Test Description', // Required by top-level schema
    agentVersion: '1.0.0', // Required
    id: 'test-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'test-user',
    tools: [],
    toolsDetails: [],
    toolConfigsApplied: {},
    templateId: '',
    isTemplate: false,
    isFavorite: false,
    tags: [],
    icon: '',
    internalVersion: 1,
    isLatest: true,
    originalAgentId: 'test-id',
    config: {
      type: 'llm', // Default to LLM for most BehaviorTab tests unless overridden
      framework: 'genkit',
      agentPersonality: 'professional', // Default for LLM
      agentTemperature: 0.7,        // Default for LLM
      // other LLM specific fields that are not rendered by BehaviorTab currently
      agentModel: 'gemini-1.5-flash',
      agentGoal: 'Default goal',
      agentTasks: ['Default task'],
      safetySettings: [],
      ...(defaultValuesProp.config || {}), // Spread specific config from props
    },
    ...defaultValuesProp, // Spread top-level props
  };

  const methods = useForm<SavedAgentConfiguration>({
    defaultValues: completeDefaultValues as SavedAgentConfiguration, // Cast as it's now complete
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('BehaviorTab', () => {
  let mockShowHelpModal: jest.Mock;

  beforeEach(() => {
    mockShowHelpModal = jest.fn();
  });

  describe('For LLM Agents (config.type: "llm")', () => {
    const llmDefaultValues: Partial<SavedAgentConfiguration> = {
      config: {
        type: 'llm',
        agentPersonality: 'creative', // Should map to 'Criativo e Inspirador'
        agentTemperature: 0.9,
      } as LLMAgentConfig,
    };

    it('should render LLM-specific behavior fields', () => {
      render(
        <TestWrapper defaultValuesProp={llmDefaultValues}>
          <BehaviorTab agentToneOptions={mockAgentToneOptions} showHelpModal={mockShowHelpModal} />
        </TestWrapper>
      );
      expect(screen.getByLabelText('Agent Personality/Tone')).toBeInTheDocument();
      expect(screen.getByLabelText('Agent Temperature (Creativity)')).toBeInTheDocument();
      // Check for the slider thumb specifically for temperature
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('should display values from form context for LLM fields', () => {
      render(
        <TestWrapper defaultValuesProp={llmDefaultValues}>
          <BehaviorTab agentToneOptions={mockAgentToneOptions} showHelpModal={mockShowHelpModal} />
        </TestWrapper>
      );
      // Check Select for Personality/Tone
      expect(screen.getByText('Criativo e Inspirador')).toBeInTheDocument(); // Displayed value for 'creative'

      // Check Slider for Temperature
      const sliderThumb = screen.getByRole('slider');
      expect(sliderThumb).toHaveAttribute('aria-valuenow', '0.9');
      expect(screen.getByText('Value: 0.90 (0: Precise, 1: Creative)')).toBeInTheDocument();
    });

    it('should update Agent Personality/Tone on selection', async () => {
      render(
        <TestWrapper defaultValuesProp={llmDefaultValues}>
          <BehaviorTab agentToneOptions={mockAgentToneOptions} showHelpModal={mockShowHelpModal} />
        </TestWrapper>
      );
      const personalitySelectTrigger = screen.getByLabelText('Agent Personality/Tone').parentNode!;
      fireEvent.mouseDown(personalitySelectTrigger);
      await waitFor(() => screen.getByText('Amigável e Prestativo')); // Wait for options
      fireEvent.click(screen.getByText('Amigável e Prestativo'));

      await waitFor(() => {
        // Check if the displayed value in the SelectTrigger updates
        expect(screen.getByText('Amigável e Prestativo')).toBeInTheDocument();
      });
      // Further check would involve inspecting RHF's internal state if possible, or onSave in parent
    });

    it('should update Agent Temperature on slider interaction', async () => {
      render(
        <TestWrapper defaultValuesProp={{ config: { type: 'llm', agentTemperature: 0.5 } as LLMAgentConfig }}>
          <BehaviorTab agentToneOptions={mockAgentToneOptions} showHelpModal={mockShowHelpModal} />
        </TestWrapper>
      );
      const sliderThumb = screen.getByRole('slider');
      
      // Simulate keyboard interaction to change value
      // Radix sliders respond to ArrowRight, ArrowLeft, etc.
      // Default value is 0.5, step is 0.01. Let's increase by 5 steps to 0.55.
      fireEvent.keyDown(sliderThumb, { key: 'ArrowRight' });
      fireEvent.keyDown(sliderThumb, { key: 'ArrowRight' });
      fireEvent.keyDown(sliderThumb, { key: 'ArrowRight' });
      fireEvent.keyDown(sliderThumb, { key: 'ArrowRight' });
      fireEvent.keyDown(sliderThumb, { key: 'ArrowRight' });

      await waitFor(() => {
        expect(sliderThumb).toHaveAttribute('aria-valuenow', '0.55');
        expect(screen.getByText('Value: 0.55 (0: Precise, 1: Creative)')).toBeInTheDocument();
      });
    });
    
    // Safety Settings and other LLM fields like Goal/Tasks are NOT in the current BehaviorTab.tsx
    // Tests for them would be added if the component is updated.
  });

  describe('For Non-LLM Agents', () => {
    const nonLLMAgentTypes: AgentType[] = ['workflow', 'custom', 'a2a'];

    nonLLMAgentTypes.forEach(agentType => {
      it(`should display "LLM only" message for agent type "${agentType}"`, () => {
        render(
          <TestWrapper defaultValuesProp={{ config: { type: agentType } as any }}>
            <BehaviorTab agentToneOptions={mockAgentToneOptions} showHelpModal={mockShowHelpModal} />
          </TestWrapper>
        );
        expect(screen.getByText('Behavior settings are applicable to LLM-based agents.')).toBeInTheDocument();
        expect(screen.queryByLabelText('Agent Personality/Tone')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Agent Temperature (Creativity)')).not.toBeInTheDocument();
      });
    });
  });
  
  // Help Modal tests would be relevant if InfoIcons were present for the rendered fields
  // Currently, BehaviorTab.tsx doesn't show InfoIcons for Personality or Temperature.
  // If they were added, tests similar to GeneralTab's help modal tests would be here.
});
