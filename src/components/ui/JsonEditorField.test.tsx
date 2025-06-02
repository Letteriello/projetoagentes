import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import JsonEditorField from './JsonEditorField'; // Adjust path as necessary

// Mock @monaco-editor/react
let mockOnValidate: ((markers: any[]) => void) | undefined;

jest.mock('@monaco-editor/react', () => {
  const FakeEditor = jest.fn(({ value, onChange, onValidate, ...props }) => {
    // Store onValidate to be called manually from tests
    mockOnValidate = onValidate;

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        onChange(event.target.value, event);
      }
    };

    // Directly call onValidate when value changes for simplicity in mock
    React.useEffect(() => {
      if (onValidate) {
        const markers = [];
        try {
          if (value && value.trim() !== "") {
            JSON.parse(value);
          }
        } catch (e) {
          markers.push({ message: 'Invalid JSON from mock', severity: 8 /* monaco.MarkerSeverity.Error */ });
        }
        onValidate(markers);
      }
    }, [value, onValidate]);

    return (
      <textarea
        data-testid="mock-monaco-editor"
        value={value || ''} // Ensure value is not null/undefined
        onChange={handleChange}
        {...props} // Spread other props like height, options, etc.
      />
    );
  });
  return FakeEditor;
});

describe('JsonEditorField', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnValidate = undefined;
  });

  test('renders without crashing', () => {
    render(<JsonEditorField id="test-editor" value="" onChange={mockOnChange} />);
    expect(screen.getByTestId('mock-monaco-editor')).toBeInTheDocument();
  });

  test('propagates id, value, and height props to the mocked editor', () => {
    render(
      <JsonEditorField
        id="my-json-editor"
        value='{"key": "value"}'
        onChange={mockOnChange}
        height="250px"
      />
    );
    const editor = screen.getByTestId('mock-monaco-editor');
    expect(editor).toHaveAttribute('id', 'my-json-editor'); // Monaco editor itself doesn't use HTML id prop directly on textarea in this mock
                                                          // but the wrapper might, or options are passed.
                                                          // For this mock, the id is passed to the textarea directly.
    expect(editor).toHaveValue('{"key": "value"}');
    // Height is not a direct HTML attribute on textarea, it's passed in options or style.
    // The mock would need to be more sophisticated to check height if it's passed via options object.
    // For now, we assume the mock receives it in ...props.
    // We can check if the FakeEditor was called with the correct height.
    const FakeEditor = require('@monaco-editor/react');
    expect(FakeEditor).toHaveBeenCalledWith(expect.objectContaining({ height: '250px' }), {});
  });

  test('calls onChange prop when the editor content changes', () => {
    render(<JsonEditorField id="test-editor" value="" onChange={mockOnChange} />);
    const editor = screen.getByTestId('mock-monaco-editor');
    fireEvent.change(editor, { target: { value: '{"newKey": "newValue"}' } });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('{"newKey": "newValue"}');
  });

  test('displays "Invalid JSON format" message for invalid JSON input', () => {
    render(<JsonEditorField id="test-editor" value='{"key": "value"' onChange={mockOnChange} />);
    // The mock's useEffect for onValidate will be triggered on render
    expect(screen.getByText('Invalid JSON format.')).toBeInTheDocument();
  });
  
  test('displays "Invalid JSON format" message when onValidate is called with errors by the mock', () => {
    render(<JsonEditorField id="test-editor" value='{"key": "value"' onChange={mockOnChange} />);
    // Manually trigger onValidate if the automatic one in mock isn't sufficient for a specific test case
    if (mockOnValidate) {
      mockOnValidate([{ message: 'Manual error', severity: 8 }]);
    }
    expect(screen.getByText('Invalid JSON format.')).toBeInTheDocument();
  });


  test('does not display "Invalid JSON format" message for valid JSON input', () => {
    render(<JsonEditorField id="test-editor" value='{"key": "value"}' onChange={mockOnChange} />);
    // The mock's useEffect for onValidate will be triggered on render
    expect(screen.queryByText('Invalid JSON format.')).not.toBeInTheDocument();
  });
  
  test('does not display "Invalid JSON format" message when onValidate is called with no errors', () => {
    render(<JsonEditorField id="test-editor" value='{"key": "value"}' onChange={mockOnChange} />);
    if (mockOnValidate) {
      mockOnValidate([]);
    }
    expect(screen.queryByText('Invalid JSON format.')).not.toBeInTheDocument();
  });

  test('displays external error message when error prop is provided', () => {
    const externalError = "This is an external error from RHF.";
    render(<JsonEditorField id="test-editor" value="" onChange={mockOnChange} error={externalError} />);
    expect(screen.getByText(externalError)).toBeInTheDocument();
  });

  test('displays both internal and external errors if both are present', () => {
    const externalError = "External schema validation failed.";
    render(<JsonEditorField id="test-editor" value='{"invalid"' onChange={mockOnChange} error={externalError} />);
    expect(screen.getByText('Invalid JSON format.')).toBeInTheDocument();
    expect(screen.getByText(externalError)).toBeInTheDocument();
  });

  test('updates internal validation when value prop changes externally', () => {
    const { rerender } = render(<JsonEditorField id="test-editor" value='{"valid": "json"}' onChange={mockOnChange} />);
    expect(screen.queryByText('Invalid JSON format.')).not.toBeInTheDocument();

    rerender(<JsonEditorField id="test-editor" value='{"invalidJson"' onChange={mockOnChange} />);
    expect(screen.getByText('Invalid JSON format.')).toBeInTheDocument();

    rerender(<JsonEditorField id="test-editor" value='{}' onChange={mockOnChange} />);
    expect(screen.queryByText('Invalid JSON format.')).not.toBeInTheDocument();
  });

});
