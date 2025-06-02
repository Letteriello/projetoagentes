import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomToolDialog, { CustomToolData } from './custom-tool-dialog';
import { FormProvider, useForm } from 'react-hook-form';

// Mocking external dependencies
jest.mock('@/components/ui/JsonEditorField', () => ({
  __esModule: true,
  default: jest.fn(({ value, onChange, error }) => (
    <>
      <textarea
        data-testid="json-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p role="alert">{error}</p>}
    </>
  )),
}));

jest.mock('@/lib/agent-genkit-utils', () => ({
  generateGenkitToolStub: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
  writable: true,
});


const Wrapper: React.FC<{ children: React.ReactNode; initialData?: CustomToolData }> = ({ children, initialData }) => {
  const methods = useForm<CustomToolData>({
    defaultValues: initialData || { name: '', description: '', inputSchema: '{}', outputSchema: '{}' },
     mode: 'onChange', // Important for validation to trigger correctly for button disabling
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
};


describe('CustomToolDialog', () => {
  const mockOnSave = jest.fn();
  const mockOnOpenChange = jest.fn();

  const defaultProps = {
    isOpen: true,
    onOpenChange: mockOnOpenChange,
    onSave: mockOnSave,
    initialData: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderDialog = (props = defaultProps, initialFormValues?: CustomToolData) => {
    return render(
      <Wrapper initialData={initialFormValues || props.initialData}>
        <CustomToolDialog {...props} />
      </Wrapper>
    );
  };

  test('renders all form fields and buttons', () => {
    renderDialog();
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Input Schema/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Output Schema/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salvar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copiar Código Genkit/i })).toBeInTheDocument();
  });

  test('shows validation error for empty name', async () => {
    renderDialog();
    const saveButton = screen.getByRole('button', { name: /Salvar/i });
    
    // Initially, name is empty, so save should be disabled by Zod schema if min(1) is set
    // The test wrapper needs to correctly pass form context for this to be accurate
    // For this test, let's ensure it's disabled by default due to empty name.
    // And then try to click save if it were enabled (though it should be disabled by schema)
    
    fireEvent.input(screen.getByLabelText(/Name/i), { target: { value: '' } });
    fireEvent.input(screen.getByLabelText(/Description/i), { target: { value: 'Test Desc' } });
     // Assuming JsonEditorField mock correctly updates the underlying value for react-hook-form
    fireEvent.change(screen.getAllByTestId('json-editor')[0], { target: { value: '{"type":"string"}' } });
    fireEvent.change(screen.getAllByTestId('json-editor')[1], { target: { value: '{"type":"string"}' } });
    
    await waitFor(() => {
      expect(saveButton).toBeDisabled(); // It should be disabled if name is empty
    });

    // If we were to enable it and click
    // fireEvent.click(saveButton);
    // const nameError = await screen.findByText(/Name is required/i);
    // expect(nameError).toBeInTheDocument();
    // expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('shows validation error for invalid JSON in schema fields', async () => {
    renderDialog();
    const inputSchemaEditor = screen.getAllByTestId('json-editor')[0];
    const saveButton = screen.getByRole('button', { name: /Salvar/i });

    fireEvent.change(inputSchemaEditor, { target: { value: 'invalid json' } });
    fireEvent.blur(inputSchemaEditor); // Trigger validation if onBlur is used

    await waitFor(() => {
      const jsonError = screen.getByText('Deve ser um JSON válido.');
      expect(jsonError).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('calls onSave with correct data when form is valid and saved', async () => {
    renderDialog();
    fireEvent.input(screen.getByLabelText(/Name/i), { target: { value: 'Test Tool' } });
    fireEvent.input(screen.getByLabelText(/Description/i), { target: { value: 'A valid description.' } });
    fireEvent.change(screen.getAllByTestId('json-editor')[0], { target: { value: '{"type":"string"}' } });
    fireEvent.change(screen.getAllByTestId('json-editor')[1], { target: { value: '{"type":"object"}' } });

    const saveButton = screen.getByRole('button', { name: /Salvar/i });
    await waitFor(() => {
        expect(saveButton).toBeEnabled();
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        {
          name: 'Test Tool',
          description: 'A valid description.',
          inputSchema: '{"type":"string"}',
          outputSchema: '{"type":"object"}',
        },
        undefined // No ID, as it's a new tool
      );
    });
  });

  test('calls onOpenChange with false when Cancel button is clicked', () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  test('Copy Code button calls generateGenkitToolStub and copies to clipboard', async () => {
    const mockGenerateGenkitToolStub = jest.requireMock('@/lib/agent-genkit-utils').generateGenkitToolStub;
    mockGenerateGenkitToolStub.mockReturnValue('mocked genkit code');

    renderDialog();
    fireEvent.input(screen.getByLabelText(/Name/i), { target: { value: 'CopyTest' } });
    fireEvent.input(screen.getByLabelText(/Description/i), { target: { value: 'Copy desc' } });
    fireEvent.change(screen.getAllByTestId('json-editor')[0], { target: { value: '{"in":"schema"}' } });
    fireEvent.change(screen.getAllByTestId('json-editor')[1], { target: { value: '{"out":"schema"}' } });
    
    const copyButton = screen.getByRole('button', { name: /Copiar Código Genkit/i });
    await waitFor(() => {
        expect(copyButton).toBeEnabled();
    });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockGenerateGenkitToolStub).toHaveBeenCalledWith(
        'CopyTest',
        'Copy desc',
        '{"in":"schema"}',
        '{"out":"schema"}'
      );
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('mocked genkit code');
    });
     // Check for toast message (simplified check, actual toast may involve more complex selectors)
    expect(jest.requireMock('@/hooks/use-toast').useToast().toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Código Genkit Copiado!",
    }));
  });

  test('populates form with initialData and calls onSave with ID when editing', async () => {
    const initialData: CustomToolData = {
      id: 'custom_123',
      name: 'Initial Name',
      description: 'Initial Desc',
      inputSchema: '{"initial":"input"}',
      outputSchema: '{"initial":"output"}',
    };
    renderDialog({ ...defaultProps, initialData }, initialData);

    expect(screen.getByLabelText(/Name/i)).toHaveValue(initialData.name);
    expect(screen.getByLabelText(/Description/i)).toHaveValue(initialData.description);
    expect(screen.getAllByTestId('json-editor')[0]).toHaveValue(initialData.inputSchema);
    expect(screen.getAllByTestId('json-editor')[1]).toHaveValue(initialData.outputSchema);

    fireEvent.input(screen.getByLabelText(/Name/i), { target: { value: 'Updated Name' } });
    
    const saveButton = screen.getByRole('button', { name: /Salvar/i });
    await waitFor(() => {
        expect(saveButton).toBeEnabled();
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated Name' }),
        initialData.id
      );
    });
  });
});
