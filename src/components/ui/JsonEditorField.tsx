import React, { useState, useEffect, useRef } from 'react';
import Editor, { Monaco, OnChange, OnValidate } from '@monaco-editor/react';

interface JsonEditorFieldProps {
  id: string;
  value: string; // JSON string
  onChange: (value: string) => void; // Passes the new JSON string
  placeholder?: string;
  height?: string;
  error?: string; // Optional: for displaying external validation errors from react-hook-form
}

const JsonEditorField: React.FC<JsonEditorFieldProps> = ({
  id,
  value,
  onChange,
  placeholder,
  height = '200px',
  error,
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const [isValidJson, setIsValidJson] = useState(true);
  const editorRef = useRef<any>(null); // Keep a ref to the editor instance

  useEffect(() => {
    // Update internal value when the external value prop changes
    // This is important if the form is reset or programmatically changed
    setInternalValue(value);
    try {
      if (value && value.trim() !== "") {
        JSON.parse(value);
      }
      setIsValidJson(true);
    } catch (e) {
      setIsValidJson(false);
    }
  }, [value]);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    // You can now access the editor instance via editorRef.current
    // For example, to focus the editor:
    // editorRef.current.focus();

    // Configure JSON specific options if needed
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [], // You can add JSON schemas here for more advanced validation
    });
  };

  const handleEditorChange: OnChange = (newValue, event) => {
    const strValue = newValue || "";
    setInternalValue(strValue);
    onChange(strValue); // Pass the raw string value to react-hook-form
  };

  const handleEditorValidate: OnValidate = (markers) => {
    // markers is an array of validation errors from Monaco
    // If markers array is empty, JSON is valid according to Monaco's basic linting
    setIsValidJson(markers.length === 0);
  };

  return (
    <div>
      <Editor
        height={height}
        language="json"
        value={internalValue}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        onValidate={handleEditorValidate}
        options={{
          minimap: { enabled: false },
          automaticLayout: true,
          scrollbar: {
            verticalScrollbarSize: 5,
            horizontalScrollbarSize: 5,
          },
          glyphMargin: false,
          folding: false,
          lineNumbers: 'on',
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 3,
          wordWrap: 'on', // Enable word wrap
          // Placeholder text is not directly supported by Monaco Editor.
          // A common workaround is to display a styled div on top when the content is empty.
          // For simplicity, we'll rely on the placeholder prop of a surrounding TextField if used,
          // or a custom implementation if needed.
        }}
        // Apply a border style directly for validation feedback
        // Monaco editor itself doesn't have a simple border prop that changes with validation.
        // We'll use the isValidJson state to style a wrapper or show a message.
      />
      {!isValidJson && (
        <p style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem' }}>
          Invalid JSON format.
        </p>
      )}
      {error && (
        <p style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem' }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default JsonEditorField;
