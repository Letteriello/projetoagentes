import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ToolConfigModal from './ToolConfigModal';
import { AvailableTool, ToolConfigData } from '@/types/agent-configs-fixed';
import { InfoIcon } from 'lucide-react'; // Using a real icon component

// Mock useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock API Key Vault fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]), // Default to no keys
  })
) as jest.Mock;

const mockOnSave = jest.fn();
const mockOnApiKeyIdChange = jest.fn();

const baseConfiguringTool: AvailableTool = {
  id: 'testTool',
  label: 'Test Tool',
  name: 'Test Tool',
  type: 'genkit_native',
  description: 'A tool for testing.',
  hasConfig: true,
  requiresAuth: false,
  serviceTypeRequired: 'none',
  configFields: [
    { id: 'textField', label: 'Text Field', type: 'text', description: 'A simple text field.' },
  ],
};

const toolWithGuardrails: AvailableTool = {
  ...baseConfiguringTool,
  id: 'guardrailTool',
  label: 'Guardrail Tool',
  configFields: [
    ...baseConfiguringTool.configFields!,
    {
      id: 'allowedDomains',
      label: 'Allowed Domains',
      type: 'textarea',
      description: 'Comma-separated domains'
    },
    {
      id: 'blockedDomains',
      label: 'Blocked Domains',
      type: 'textarea',
      description: 'Comma-separated domains'
    },
  ],
};

const defaultProps = {
  isOpen: true,
  onOpenChange: jest.fn(),
  configuringTool: baseConfiguringTool,
  onSave: mockOnSave,
  currentSelectedApiKeyId: undefined,
  onApiKeyIdChange: mockOnApiKeyIdChange,
  InfoIcon: InfoIcon,
  toolConfigurations: {},
};

describe('ToolConfigModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders standard config fields', () => {
    render(<ToolConfigModal {...defaultProps} />);
    expect(screen.getByLabelText('Text Field')).toBeInTheDocument();
  });

  it('renders new guardrail config fields as textareas', () => {
    render(<ToolConfigModal {...defaultProps} configuringTool={toolWithGuardrails} />);
    expect(screen.getByLabelText('Allowed Domains')).toBeInTheDocument();
    expect(screen.getByLabelText('Allowed Domains')).toBeInstanceOf(HTMLTextAreaElement);
    expect(screen.getByLabelText('Blocked Domains')).toBeInTheDocument();
    expect(screen.getByLabelText('Blocked Domains')).toBeInstanceOf(HTMLTextAreaElement);
  });

  describe('State and Save Logic for Guardrail Fields', () => {
    it('saves comma-separated string from textarea as an array', async () => {
      render(<ToolConfigModal {...defaultProps} configuringTool={toolWithGuardrails} />);

      const allowedDomainsTextarea = screen.getByLabelText('Allowed Domains');
      fireEvent.change(allowedDomainsTextarea, { target: { value: 'example.com, test.com, another.org' } });

      const blockedDomainsTextarea = screen.getByLabelText('Blocked Domains');
      fireEvent.change(blockedDomainsTextarea, { target: { value: 'blocked.com, evil.net' } });

      fireEvent.click(screen.getByRole('button', { name: /Salvar Configuração/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
        expect(mockOnSave).toHaveBeenCalledWith('guardrailTool', expect.objectContaining({
          allowedDomains: ['example.com', 'test.com', 'another.org'],
          blockedDomains: ['blocked.com', 'evil.net'],
        }));
      });
    });

    it('handles empty or whitespace-only entries when saving', async () => {
      render(<ToolConfigModal {...defaultProps} configuringTool={toolWithGuardrails} />);

      const allowedDomainsTextarea = screen.getByLabelText('Allowed Domains');
      fireEvent.change(allowedDomainsTextarea, { target: { value: 'example.com, , test.com,  , ' } });

      fireEvent.click(screen.getByRole('button', { name: /Salvar Configuração/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('guardrailTool', expect.objectContaining({
          allowedDomains: ['example.com', 'test.com'],
        }));
      });
    });

    it('initializes with empty array if guardrail field is undefined or null in config', async () => {
      render(<ToolConfigModal {...defaultProps} configuringTool={toolWithGuardrails} toolConfigurations={{
        guardrailTool: { allowedDomains: undefined }
      }} />);

      fireEvent.click(screen.getByRole('button', { name: /Salvar Configuração/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('guardrailTool', expect.objectContaining({
          allowedDomains: [],
        }));
      });
    });

    it('populates textarea with comma-separated string from existing array config', () => {
      const existingConfig: Record<string, ToolConfigData> = {
        guardrailTool: {
          allowedDomains: ['example.com', 'test.com'],
          blockedDomains: ['blocked.com'],
        },
      };
      render(
        <ToolConfigModal
          {...defaultProps}
          configuringTool={toolWithGuardrails}
          toolConfigurations={existingConfig}
        />
      );

      expect(screen.getByLabelText('Allowed Domains')).toHaveValue('example.com, test.com');
      expect(screen.getByLabelText('Blocked Domains')).toHaveValue('blocked.com');
    });

    it('populates textarea with empty string if existing array is empty', () => {
      const existingConfig: Record<string, ToolConfigData> = {
        guardrailTool: {
          allowedDomains: [],
        },
      };
      render(
        <ToolConfigModal
          {...defaultProps}
          configuringTool={toolWithGuardrails}
          toolConfigurations={existingConfig}
        />
      );
      expect(screen.getByLabelText('Allowed Domains')).toHaveValue('');
    });
  });

  // TODO: Add tests for API Key Vault interactions if not covered elsewhere
  // TODO: Add tests for other field types (select, password, etc.) if specific logic applies
});
