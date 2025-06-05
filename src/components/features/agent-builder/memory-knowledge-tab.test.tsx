import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryKnowledgeTab, RagMemoryConfig, KnowledgeSourceType } from './memory-knowledge-tab';
import { TooltipProvider } from '@/components/ui/tooltip'; // Needed for tooltips

// Mock FileUploader component
vi.mock('@/components/ui/file-uploader', () => ({
  FileUploader: vi.fn(({ value, onValueChange, accept, multiple, maxFiles, maxSize }) => (
    <div data-testid="mock-file-uploader">
      <input
        type="file"
        data-testid="mock-file-input"
        onChange={(e) => {
          if (onValueChange && e.target.files) {
            onValueChange(Array.from(e.target.files));
          }
        }}
        multiple={multiple}
        accept={Object.values(accept).flat().join(',')}
      />
      {/* Display selected files for assertion */}
      {value && value.map((file: File) => <span key={file.name}>{file.name}</span>)}
    </div>
  )),
}));

const defaultRagMemoryConfig: RagMemoryConfig = {
  enabled: false,
  serviceType: 'in-memory' as any, // Cast for simplicity if MemoryServiceType is complex
  embeddingModel: undefined,
  knowledgeSources: [],
  similarityTopK: 3,
  vectorDistanceThreshold: 0.5,
  includeConversationContext: true,
};

const mockSetRagMemoryConfig = vi.fn();
const mockSetEnableRAG = vi.fn();
const mockSetEnableStatePersistence = vi.fn();
const mockSetStatePersistenceType = vi.fn();
const mockSetInitialStateValues = vi.fn();
const mockSetEnableStateSharing = vi.fn();
const mockSetStateSharingStrategy = vi.fn();


const defaultProps = {
  ragMemoryConfig: { ...defaultRagMemoryConfig },
  setRagMemoryConfig: mockSetRagMemoryConfig,
  enableStatePersistence: false,
  setEnableStatePersistence: mockSetEnableStatePersistence,
  statePersistenceType: 'session' as 'session' | 'memory' | 'database',
  setStatePersistenceType: mockSetStatePersistenceType,
  initialStateValues: [],
  setInitialStateValues: mockSetInitialStateValues,
  enableStateSharing: false,
  setEnableStateSharing: mockSetEnableStateSharing,
  stateSharingStrategy: 'all' as 'all' | 'explicit' | 'none',
  setStateSharingStrategy: mockSetStateSharingStrategy,
  enableRAG: false,
  setEnableRAG: mockSetEnableRAG,
};

// Helper to render with TooltipProvider
const renderWithProviders = (ui: React.ReactElement, props = {}) => {
  return render(
    <TooltipProvider>
      {React.cloneElement(ui, { ...defaultProps, ...props })}
    </TooltipProvider>
  );
};


describe('MemoryKnowledgeTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset ragMemoryConfig for each test if it's modified directly
    defaultProps.ragMemoryConfig = { ...defaultRagMemoryConfig, knowledgeSources: [] };
  });

  describe('FileUploader Integration', () => {
    it('should render FileUploader when newSource.type is "document_upload"', async () => {
      renderWithProviders(<MemoryKnowledgeTab {...defaultProps} />);

      // Navigate to "Fontes de Conhecimento" tab
      await userEvent.click(screen.getByRole('tab', { name: /Fontes de Conhecimento/i }));

      // Click "Adicionar Nova Fonte"
      await userEvent.click(screen.getByRole('button', { name: /Adicionar Nova Fonte/i }));

      // Select "Upload de Documento"
      const typeSelect = screen.getByRole('combobox'); // Assuming only one combobox for type initially
      await userEvent.click(typeSelect);
      await userEvent.click(screen.getByText('Upload de Documento'));

      expect(screen.getByTestId('mock-file-uploader')).toBeInTheDocument();
    });

    it('should not render FileUploader for other source types', async () => {
      renderWithProviders(<MemoryKnowledgeTab {...defaultProps} />);
      await userEvent.click(screen.getByRole('tab', { name: /Fontes de Conhecimento/i }));
      await userEvent.click(screen.getByRole('button', { name: /Adicionar Nova Fonte/i }));

      // Type defaults to "document" (Documento (Texto Genérico))
      expect(screen.queryByTestId('mock-file-uploader')).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText('Conteúdo do documento...')).toBeInTheDocument();
    });

    it('should update uploadedFiles state on file selection', async () => {
      renderWithProviders(<MemoryKnowledgeTab {...defaultProps} />);
      await userEvent.click(screen.getByRole('tab', { name: /Fontes de Conhecimento/i }));
      await userEvent.click(screen.getByRole('button', { name: /Adicionar Nova Fonte/i }));

      const typeSelect = screen.getByRole('combobox');
      await userEvent.click(typeSelect);
      await userEvent.click(screen.getByText('Upload de Documento'));

      const fileInput = screen.getByTestId('mock-file-input');
      const testFile = new File(['hello'], 'hello.pdf', { type: 'application/pdf' });
      await userEvent.upload(fileInput, testFile);

      // Check if the mock FileUploader displays the file name (simulating state update)
      expect(screen.getByText(testFile.name)).toBeInTheDocument();
    });

    it('handleAddSource should use uploadedFile names for "document_upload" and clear files', async () => {
      renderWithProviders(<MemoryKnowledgeTab {...defaultProps} />);
      await userEvent.click(screen.getByRole('tab', { name: /Fontes de Conhecimento/i }));
      await userEvent.click(screen.getByRole('button', { name: /Adicionar Nova Fonte/i }));

      // Fill name
      const nameInput = screen.getByPlaceholderText('Nome da Fonte (ex: Documento de Políticas)');
      await userEvent.type(nameInput, 'Test Document Upload');

      const typeSelect = screen.getByRole('combobox');
      await userEvent.click(typeSelect);
      await userEvent.click(screen.getByText('Upload de Documento'));

      const fileInput = screen.getByTestId('mock-file-input');
      const testFile1 = new File(['content1'], 'doc1.pdf', { type: 'application/pdf' });
      const testFile2 = new File(['content2'], 'doc2.txt', { type: 'text/plain' });
      await userEvent.upload(fileInput, [testFile1, testFile2]);

      // Wait for the mock file uploader to show the files
      expect(screen.getByText(testFile1.name)).toBeInTheDocument();
      expect(screen.getByText(testFile2.name)).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Adicionar Fonte' }));

      expect(mockSetRagMemoryConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          knowledgeSources: expect.arrayContaining([
            expect.objectContaining({
              name: 'Test Document Upload',
              type: 'document_upload',
              pathOrContent: 'doc1.pdf, doc2.txt',
            }),
          ]),
        })
      );
      // Check if files are cleared from display (simulating uploadedFiles state reset)
      expect(screen.queryByText(testFile1.name)).not.toBeInTheDocument();
      expect(screen.queryByText(testFile2.name)).not.toBeInTheDocument();
    });
  });

  describe('Embedding Model Selection', () => {
    const ragEnabledProps = { ...defaultProps, enableRAG: true, ragMemoryConfig: { ...defaultRagMemoryConfig, enabled: true } };

    it('should render "Modelo de Embedding" select when RAG is enabled', () => {
      renderWithProviders(<MemoryKnowledgeTab {...ragEnabledProps} />);
      fireEvent.click(screen.getByRole('tab', { name: /Configuração RAG/i }));

      expect(screen.getByLabelText(/Modelo de Embedding/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /Modelo de Embedding/i })).toBeInTheDocument();
    });

    it('select should reflect ragMemoryConfig.embeddingModel', () => {
      const model = 'text-embedding-004';
      renderWithProviders(
        <MemoryKnowledgeTab {...ragEnabledProps} ragMemoryConfig={{ ...ragEnabledProps.ragMemoryConfig, embeddingModel: model }} />
      );
      fireEvent.click(screen.getByRole('tab', { name: /Configuração RAG/i }));

      const select = screen.getByRole('combobox', { name: /Modelo de Embedding/i });
      // For Shadcn/ui Select, the displayed value is within a span inside the button
      expect(select).toHaveTextContent('Google text-embedding-004');
    });

    it('should call setRagMemoryConfig on embeddingModel change', async () => {
      renderWithProviders(<MemoryKnowledgeTab {...ragEnabledProps} />);
      fireEvent.click(screen.getByRole('tab', { name: /Configuração RAG/i }));

      const selectTrigger = screen.getByRole('combobox', { name: /Modelo de Embedding/i });
      await userEvent.click(selectTrigger);

      const option = screen.getByText('Google textembedding-gecko@003'); // Assuming this option exists
      await userEvent.click(option);

      expect(mockSetRagMemoryConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          embeddingModel: 'textembedding-gecko@003',
        })
      );
    });

     it('should set embeddingModel to undefined when "Nenhum / Usar Padrão" is selected', async () => {
      renderWithProviders(
        <MemoryKnowledgeTab {...ragEnabledProps} ragMemoryConfig={{ ...ragEnabledProps.ragMemoryConfig, embeddingModel: "text-embedding-004" }} />
      );
      fireEvent.click(screen.getByRole('tab', { name: /Configuração RAG/i }));

      const selectTrigger = screen.getByRole('combobox', { name: /Modelo de Embedding/i });
      await userEvent.click(selectTrigger);

      const noneOption = screen.getByText('Nenhum / Usar Padrão');
      await userEvent.click(noneOption);

      expect(mockSetRagMemoryConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          embeddingModel: undefined,
        })
      );
    });
  });

  describe('RAG Parameter Tooltips', () => {
    const ragEnabledProps = { ...defaultProps, enableRAG: true, ragMemoryConfig: { ...defaultRagMemoryConfig, enabled: true } };

    const tooltipTests = [
      { label: /Modelo de Embedding/i, content: /Seleciona o modelo de embedding que será usado/i },
      { label: /Top K \(Similaridade\)/i, content: /Define o número máximo de documentos ou chunks de texto/i },
      { label: /Limite de Distância Vetorial/i, content: /Estabelece um limite para a similaridade vetorial/i },
      { label: /Incluir Contexto da Conversa no RAG/i, content: /Indica se o histórico da conversa atual deve ser incluído/i },
    ];

    tooltipTests.forEach(testCase => {
      it(`should render Info icon and TooltipContent for "${testCase.label}"`, async () => {
        renderWithProviders(<MemoryKnowledgeTab {...ragEnabledProps} />);
        fireEvent.click(screen.getByRole('tab', { name: /Configuração RAG/i }));

        const labelElement = screen.getByLabelText(testCase.label);
        expect(labelElement).toBeInTheDocument();

        // Check for Info icon within the label's structure (usually a sibling button to the text)
        // This assumes the Info icon is in a button, adjust if structure is different
        const infoButton = labelElement.querySelector('button[aria-label*="info"], button svg[data-lucide="info"]')?.closest('button');
        // More robust check: find the label, then find the button within its parent or as a sibling
        const parentOfLabel = labelElement.parentElement;
        const triggerButton = Array.from(parentOfLabel?.querySelectorAll('button') || []).find(btn => btn.querySelector('svg[data-lucide="info"]'));

        expect(triggerButton).toBeInTheDocument();

        // Check for TooltipContent (might not be visible but should be in the DOM)
        // React Testing Library's `getByText` might not find it if it's not rendered until hover.
        // A more reliable way for non-interactive check is to query for the text if TooltipProvider always renders content.
        // For this test, we'll assume TooltipContent is rendered but hidden.
        // A better approach would be to fire hover/focus events if the testing setup supports it well for tooltips.
        // For now, we check that the trigger (button with icon) is there.
        // If TooltipContent is always in DOM:
        expect(triggerButton).toBeInTheDocument(); // Ensure the trigger button is found

        // Attempt to check for tooltip content on hover
        if (triggerButton) {
          await act(async () => {
            await userEvent.hover(triggerButton);
          });
          // Tooltip content might take a moment to appear due to animations or delays
          const tooltipContentElement = await screen.findByText(testCase.content, {}, { timeout: 1500 });
          expect(tooltipContentElement).toBeInTheDocument();

          // It's good practice to unhover, though not strictly necessary for all tests
          await act(async () => {
            await userEvent.unhover(triggerButton);
          });
          // Optionally, check if it disappears, though this can be flaky if unhover logic is complex
          // expect(screen.queryByText(testCase.content)).not.toBeInTheDocument();
        } else {
            throw new Error (`Tooltip trigger button not found for label: ${testCase.label}`);
        }
      });
    });
  });
});

// Placeholder for further tests if needed
describe('MemoryKnowledgeTab Additional Tests', () => {
    it('should switch tabs correctly', async () => {
        renderWithProviders(<MemoryKnowledgeTab {...defaultProps} />);
        expect(screen.getByText(/Configuração RAG \(Retrieval Augmented Generation\)/i)).toBeInTheDocument(); // Default tab

        await userEvent.click(screen.getByRole('tab', { name: /Estado e Persistência/i }));
        expect(screen.getByText(/Gerenciamento de Estado e Persistência/i)).toBeInTheDocument();

        await userEvent.click(screen.getByRole('tab', { name: /Fontes de Conhecimento/i }));
        expect(screen.getByText(/Fontes de Conhecimento para RAG/i)).toBeInTheDocument();
    });
});
