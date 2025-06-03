import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form';
import WorkflowBehaviorForm from './WorkflowBehaviorForm';
import { SavedAgentConfiguration, WorkflowDetailedType } from '@/types/agent-configs-fixed';
import { TooltipProvider } from '@/components/ui/tooltip'; // Required by the component

// Helper component to wrap WorkflowBehaviorForm with FormProvider
const TestFormWrapper: React.FC<{
  defaultValues?: Partial<SavedAgentConfiguration['config']>;
  children: (methods: UseFormReturn<SavedAgentConfiguration>) => React.ReactNode;
}> = ({ defaultValues, children }) => {
  const methods = useForm<SavedAgentConfiguration>({
    defaultValues: { config: defaultValues } as SavedAgentConfiguration,
  });
  return <FormProvider {...methods}>{children(methods)}</FormProvider>;
};

describe('WorkflowBehaviorForm', () => {
  const renderWithFormProvider = (
    defaultWorkflowType?: WorkflowDetailedType,
    defaultConfigValues?: Partial<SavedAgentConfiguration['config']>
  ) => {
    let watchedDetailedWorkflowType: WorkflowDetailedType | undefined = defaultWorkflowType;

    const ComponentToTest = () => {
      const { watch, setValue } = useForm<SavedAgentConfiguration>();

      // Set the initial value for detailedWorkflowType if provided
      React.useEffect(() => {
        if (defaultWorkflowType) {
          setValue('config.detailedWorkflowType', defaultWorkflowType);
        }
      }, [defaultWorkflowType, setValue]);

      watchedDetailedWorkflowType = watch('config.detailedWorkflowType');

      return (
        <TooltipProvider> {/* TooltipProvider is used by sub-components */}
          <WorkflowBehaviorForm />
        </TooltipProvider>
      );
    };

    const methods = useForm<SavedAgentConfiguration>({
        defaultValues: { config: { detailedWorkflowType: defaultWorkflowType, ...defaultConfigValues } } as SavedAgentConfiguration,
    });

    // Mock watch to control detailedWorkflowType for conditional rendering tests
    const originalWatch = methods.watch;
    methods.watch = (name: any, defaultValue?: any): any => {
      if (name === 'config.detailedWorkflowType') {
        // This allows us to simulate changing the watched value if needed by tests,
        // but for these specific tests, we rely on the initial default value propagation.
        return watchedDetailedWorkflowType || originalWatch(name, defaultValue);
      }
      return originalWatch(name, defaultValue);
    };


    return render(
      <FormProvider {...methods}>
        <ComponentToTest />
      </FormProvider>
    );
  };

  test('renders sequential workflow placeholder when detailedWorkflowType is "sequential"', () => {
    renderWithFormProvider('sequential');
    expect(screen.getByText(/Drag-and-drop reordering of tools will be implemented here./i)).toBeInTheDocument();
  });

  test('renders loop workflow fields when detailedWorkflowType is "loop"', () => {
    renderWithFormProvider('loop');
    expect(screen.getByLabelText(/Ferramenta de Saída do Loop/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Chave de Estado de Saída do Loop/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Valor de Estado de Saída do Loop/i)).toBeInTheDocument();
  });

  test('renders parallel workflow alert when detailedWorkflowType is "parallel"', () => {
    renderWithFormProvider('parallel');
    expect(screen.getByText(/Workflows Paralelos/i)).toBeInTheDocument();
    expect(screen.getByText(/As tarefas em um workflow paralelo devem ser independentes para garantir a execução correta./i)).toBeInTheDocument();
  });

  test('updates UI correctly when detailedWorkflowType changes', () => {
    // Start with no specific type, then change it
    const { rerender } = render(
        <TestFormWrapper defaultValues={{ detailedWorkflowType: undefined }}>
            {(methods) => (
                <TooltipProvider>
                    <WorkflowBehaviorForm />
                </TooltipProvider>
            )}
        </TestFormWrapper>
    );

    // Initially, none of the specific sections should be visible
    expect(screen.queryByText(/Drag-and-drop reordering of tools will be implemented here./i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Ferramenta de Saída do Loop/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Workflows Paralelos/i)).not.toBeInTheDocument();

    // Change to 'sequential'
    // To simulate change, we need access to setValue from within the TestFormWrapper context
    // This is a bit complex because the watch is inside WorkflowBehaviorForm
    // A better approach for dynamic changes might involve directly calling setValue on the methods object
    // and re-rendering, or using a more integrated setup.

    // For simplicity in this test, we'll rerender with new defaultValues, simulating a change.
    rerender(
        <TestFormWrapper defaultValues={{ detailedWorkflowType: 'sequential' }}>
            {(methods) => (
                 <TooltipProvider>
                    <WorkflowBehaviorForm />
                </TooltipProvider>
            )}
        </TestFormWrapper>
    );
    expect(screen.getByText(/Drag-and-drop reordering of tools will be implemented here./i)).toBeInTheDocument();

    // Change to 'loop'
     rerender(
        <TestFormWrapper defaultValues={{ detailedWorkflowType: 'loop' }}>
            {(methods) => (
                 <TooltipProvider>
                    <WorkflowBehaviorForm />
                </TooltipProvider>
            )}
        </TestFormWrapper>
    );
    expect(screen.getByLabelText(/Ferramenta de Saída do Loop/i)).toBeInTheDocument();

    // Change to 'parallel'
    rerender(
        <TestFormWrapper defaultValues={{ detailedWorkflowType: 'parallel' }}>
            {(methods) => (
                 <TooltipProvider>
                    <WorkflowBehaviorForm />
                </TooltipProvider>
            )}
        </TestFormWrapper>
    );
    expect(screen.getByText(/Workflows Paralelos/i)).toBeInTheDocument();
  });
});
