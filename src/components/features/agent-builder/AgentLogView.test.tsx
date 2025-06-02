import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentLogView, LogEntry } from './AgentLogView'; // Adjust path as needed

// Mock global fetch
global.fetch = jest.fn();

const mockAgentId = 'test-agent-id';

const mockLogsPage1: LogEntry[] = [
  { id: '1', agentId: mockAgentId, timestamp: new Date('2023-10-01T10:00:00Z').toISOString(), flowName: 'FlowA', type: 'start', traceId: 'trace1', data: { input: 'data1' } },
  { id: '2', agentId: mockAgentId, timestamp: new Date('2023-10-01T10:05:00Z').toISOString(), flowName: 'FlowA', type: 'end', traceId: 'trace1', data: { output: 'result1' } },
];
const mockLogsPage2: LogEntry[] = [
  { id: '3', agentId: mockAgentId, timestamp: new Date('2023-10-02T11:00:00Z').toISOString(), flowName: 'FlowB', type: 'error', traceId: 'trace2', data: { error: { message: 'An error occurred' } } },
];

const mockSuccessResponse = (logs: LogEntry[], hasNextPage: boolean, page: number = 1) => ({
  ok: true,
  json: async () => ({
    logs,
    currentPage: page,
    limit: 10, // Assuming default limit or matching component's state
    hasNextPage,
  }),
});

const mockErrorResponse = (message: string = "Failed to fetch logs") => ({
  ok: false,
  json: async () => ({ error: message }),
  statusText: message,
});


// Mock child components that might be complex or not relevant to this specific test
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode, value: string, onValueChange: (val: string) => void }) => <select data-testid="status-select" value={value} onChange={e => onValueChange(e.target.value)}>{children}</select>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode, value: string }) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder: string }) => <span>{placeholder}</span>,
}));


describe('AgentLogView', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test('renders loading state initially and fetches logs', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse(mockLogsPage1, true));
    render(<AgentLogView agentId={mockAgentId} />);

    expect(screen.getByText(/Carregando logs.../i)).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith(`/api/agents/${mockAgentId}/logs?page=1&limit=10`);

    // Check if logs are rendered
    await waitFor(() => {
      expect(screen.getByText('FlowA')).toBeInTheDocument();
      expect(screen.getByText(/Input: "data1"/)).toBeInTheDocument(); // Details summary
    });
  });

  test('displays logs correctly after fetching', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse(mockLogsPage1, true));
    render(<AgentLogView agentId={mockAgentId} />);

    await waitFor(() => {
      expect(screen.getByText(new Date(mockLogsPage1[0].timestamp).toLocaleString())).toBeInTheDocument();
      expect(screen.getAllByText('FlowA').length).toBeGreaterThan(0);
      expect(screen.getByText('Início de Execução')).toBeInTheDocument(); // Type label for 'start'
      expect(screen.getByText('Fim de Execução (Sucesso)')).toBeInTheDocument(); // Type label for 'end'
    });
  });

  test('handles API error and displays error message', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(mockErrorResponse("Network Error"));
    render(<AgentLogView agentId={mockAgentId} />);

    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar logs: Network Error/i)).toBeInTheDocument();
    });
  });

  test('handles empty logs response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse([], false));
    render(<AgentLogView agentId={mockAgentId} />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhum log encontrado/i)).toBeInTheDocument();
    });
  });

  test('filtering calls API with correct parameters', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse(mockLogsPage1, true)); // Initial fetch
    render(<AgentLogView agentId={mockAgentId} />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1)); // Wait for initial load

    // Change status filter
    fireEvent.change(screen.getByTestId('status-select'), { target: { value: 'error' } });

    // Change flow name filter
    fireEvent.change(screen.getByPlaceholderText(/Nome do Fluxo/i), { target: { value: 'MyFlow' } });

    // Change date filters (example, actual date input might need different event)
    fireEvent.change(screen.getAllByPlaceholderText(/Data Início/i)[0], { target: { value: '2023-01-01' } });
    fireEvent.change(screen.getAllByPlaceholderText(/Data Fim/i)[0], { target: { value: '2023-01-31' } });

    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse([], false)); // For filter apply fetch
    fireEvent.click(screen.getByText(/Aplicar Filtros/i));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch).toHaveBeenLastCalledWith(
      `/api/agents/${mockAgentId}/logs?page=1&limit=10&startDate=2023-01-01&endDate=2023-01-31&status=error&flowName=MyFlow`
    );
  });

  test('clearing filters calls API with default parameters', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse(mockLogsPage1, true)); // Initial fetch
    render(<AgentLogView agentId={mockAgentId} />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    // Set some filters first
    fireEvent.change(screen.getByTestId('status-select'), { target: { value: 'error' } });
    fireEvent.change(screen.getByPlaceholderText(/Nome do Fluxo/i), { target: { value: 'MyFlow' } });
    fireEvent.click(screen.getByText(/Aplicar Filtros/i));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2)); // Wait for filter application

    // Now clear filters
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse([], false)); // For clear filter fetch
    fireEvent.click(screen.getByText(/Limpar Filtros/i));
    // After clearing, the component calls handleApplyFilters or relies on useEffect.
    // Assuming handleApplyFilters is called by "Limpar Filtros" then it calls fetchLogs(1)
    // Or if it just resets state and handleApplyFilters is clicked separately:
    // For this test, let's assume Limpar then Aplicar is the flow, or Limpar auto-refreshes.
    // The current AgentLogView code: Limpar button does not auto-submit. User needs to click "Aplicar Filtros"
    // So, let's click "Aplicar Filtros" again after clearing.
    fireEvent.click(screen.getByText(/Aplicar Filtros/i));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    expect(fetch).toHaveBeenLastCalledWith(
      // After clearing, page=1, limit=10, and other filters should be default/empty
      // The actual implementation of handleClearFilters + handleApplyFilters will determine this.
      // Current impl: handleClearFilters resets state, handleApplyFilters reads state.
      `/api/agents/${mockAgentId}/logs?page=1&limit=10`
    );
  });


  test('pagination buttons fetch correct pages', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(mockSuccessResponse(mockLogsPage1, true, 1)) // Page 1
      .mockResolvedValueOnce(mockSuccessResponse(mockLogsPage2, false, 2)); // Page 2

    render(<AgentLogView agentId={mockAgentId} />);
    await waitFor(() => expect(screen.getByText('FlowA')).toBeInTheDocument()); // Ensure page 1 loaded

    // Click Next
    fireEvent.click(screen.getByText('Próxima'));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch).toHaveBeenLastCalledWith(`/api/agents/${mockAgentId}/logs?page=2&limit=10`);
    await waitFor(() => expect(screen.getByText('FlowB')).toBeInTheDocument()); // Ensure page 2 loaded

    // Check "Anterior" button is enabled, "Próxima" is disabled
    expect(screen.getByText('Anterior')).not.toBeDisabled();
    expect(screen.getByText('Próxima')).toBeDisabled();

    // Click Previous
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse(mockLogsPage1, true, 1)); // Back to Page 1
    fireEvent.click(screen.getByText('Anterior'));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    expect(fetch).toHaveBeenLastCalledWith(`/api/agents/${mockAgentId}/logs?page=1&limit=10`);
    await waitFor(() => expect(screen.getAllByText('FlowA').length).toBeGreaterThan(0)); // Ensure page 1 re-loaded

    // Check "Anterior" is disabled, "Próxima" is enabled
    expect(screen.getByText('Anterior')).toBeDisabled();
    expect(screen.getByText('Próxima')).not.toBeDisabled();
  });

  test('log details are expandable', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse(mockLogsPage1, false));
    render(<AgentLogView agentId={mockAgentId} />);

    await waitFor(() => {
      // Find the summary element for the first log (more robust selectors might be needed)
      const summaryElement = screen.getByText(/Input: {"data":"data1"}/i); // Partial match for summary
      expect(summaryElement).toBeInTheDocument();

      // The details (<pre> content) should not be visible initially
      // This depends on how <details> element works in JSDOM and if content is implicitly there.
      // A more robust test would check for a specific class or attribute if one is toggled.
      // For now, let's assume it's not visible / or try to click and check for content.
      // const detailsContent = screen.queryByText(/"input":\s*{\s*"data": "data1"\s*}/i);
      // expect(detailsContent).not.toBeVisible(); // This might fail due to JSDOM limitations or CSS

      // Click the summary to expand
      fireEvent.click(summaryElement);

      // Check if the detailed JSON content is now visible/present
      // Using findByText which waits for element to appear
      const detailedJson = await screen.findByText(/"data": "data1"/i, { exact: false });
      expect(detailedJson).toBeInTheDocument();
    });
  });

});
