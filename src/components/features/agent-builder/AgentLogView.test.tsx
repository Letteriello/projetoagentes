import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentLogView from './AgentLogView'; // Default import
import { LogEntry } from '../../../lib/logger'; // Changed from LogEntryV2

// Mock global fetch
global.fetch = jest.fn();

// 1. Update RetrievedLog interface to extend LogEntry
interface RetrievedLog extends LogEntry {
  id: string;
}

const mockAgentId = 'test-agent-id';
const mockAgentName = 'Test Agent';

// 2. Update Mock Data to use `type` and structure `data` field correctly
const mockLogsPage1: RetrievedLog[] = [
  {
    id: 'log1',
    agentId: mockAgentId,
    timestamp: new Date('2023-10-01T10:00:00.000Z').toISOString(),
    type: 'info', // Changed from level
    flowName: 'FlowA',
    traceId: 'trace1',
    data: { message: 'Agent started successfully', input: 'data1' } // message in data
  },
  {
    id: 'log2',
    agentId: mockAgentId,
    timestamp: new Date('2023-10-01T10:05:00.000Z').toISOString(),
    type: 'start', // Changed from level, using 'start' type
    flowName: 'FlowA',
    traceId: 'trace1',
    data: { message: 'Processing user request', output: 'result1' } // message in data
  },
];
const mockLogsPage2: RetrievedLog[] = [
  {
    id: 'log3',
    agentId: mockAgentId,
    timestamp: new Date('2023-10-02T11:00:00.000Z').toISOString(),
    type: 'error', // Changed from level
    flowName: 'FlowB',
    traceId: 'trace2',
    // error object now nested under data.error as per LogEntry and AgentLogView.tsx logic
    data: {
      error: { name: 'APIError', message: 'An error occurred accessing external resource', stack: 'stacktrace...' },
      details: 'some error data'
    }
  },
];

// 3. Update Mock API Responses (no change needed in structure itself)
const mockSuccessResponse = (logs: RetrievedLog[], hasNextPage: boolean, page: number = 1, limit: number = 10) => ({
  ok: true,
  json: async () => ({
    logs,
    currentPage: page,
    hasNextPage,
    // limit, // Not strictly needed by component from response, but good for completeness
    // totalPages: Math.ceil(logs.length / limit) // Also not strictly needed
  }),
});

const mockErrorResponse = (message: string = "Failed to fetch logs") => ({
  ok: false,
  json: async () => ({ message }), // API returns { message: "..." }
  status: 500,
  statusText: message,
});

// 6. Remove Obsolete Mocks (jest.mock for @/components/ui/select is removed)

describe('AgentLogView', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    // Reset any date mocks if necessary, though not used here yet
  });

  test('renders loading state initially and fetches logs', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse(mockLogsPage1, true));
    render(<AgentLogView agentId={mockAgentId} name={mockAgentName} />);

    // Check for loading spinner (more generic way to find it)
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // Spinner usually has role="status"

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith(`/api/agents/${mockAgentId}/logs?page=1&limit=10`);

    await waitFor(() => {
      // Message is now in data.message
      expect(screen.getByText('Agent started successfully')).toBeInTheDocument();
    });
  });

  test('displays logs correctly after fetching', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse(mockLogsPage1, true));
    render(<AgentLogView agentId={mockAgentId} name={mockAgentName} />);

    await waitFor(() => {
      // Check for specific log messages from data.message
      expect(screen.getByText('Agent started successfully')).toBeInTheDocument();
      expect(screen.getByText('Processing user request')).toBeInTheDocument();

      // Check for type badges (changed from level)
      expect(screen.getByText('INFO')).toBeInTheDocument(); // From mockLogsPage1[0].type
      expect(screen.getByText('START')).toBeInTheDocument(); // From mockLogsPage1[1].type

      // Check for flow names
      expect(screen.getAllByText('FlowA').length).toBeGreaterThan(0); // This remains the same

      // Check formatted timestamp (exact format depends on toLocaleTimeString with options)
      // Example: 10:00:00 AM or 10:00:00 if seconds are included
      const expectedTimeLog1 = new Date(mockLogsPage1[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      expect(screen.getByText(expectedTimeLog1)).toBeInTheDocument();
    });
  });

  test('handles API error and displays error message with retry button', async () => {
    const errorMessage = "Network Error Occurred";
    (fetch as jest.Mock).mockResolvedValueOnce(mockErrorResponse(errorMessage));
    render(<AgentLogView agentId={mockAgentId} name={mockAgentName} />);

    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar logs:/i)).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Test retry button
    const retryButton = screen.getByText(/Tentar Novamente/i);
    expect(retryButton).toBeInTheDocument();
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse(mockLogsPage1, true)); // Setup success for retry
    fireEvent.click(retryButton);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2)); // Initial + Retry
    expect(screen.getByText('Agent started successfully')).toBeInTheDocument(); // Logs load on retry (message from data.message)
  });

  test('handles empty logs response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse([], false));
    render(<AgentLogView agentId={mockAgentId} name={mockAgentName} />);

    await waitFor(() => {
      // Updated text for empty logs based on refactored component
      expect(screen.getByText(/Nenhum log disponível para os filtros aplicados./i)).toBeInTheDocument();
    });
  });

  test('filtering calls API with correct parameters and resets to page 1', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse(mockLogsPage1, true, 1)); // Initial fetch for page 1
    render(<AgentLogView agentId={mockAgentId} name={mockAgentName} />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    // Simulate user typing into filter inputs
    fireEvent.change(screen.getByPlaceholderText('Data Início'), { target: { value: '2023-01-01T00:00' } });
    fireEvent.change(screen.getByPlaceholderText('Data Fim'), { target: { value: '2023-01-31T23:59' } });
    fireEvent.change(screen.getByPlaceholderText('Status (info, error)'), { target: { value: 'error' } });
    fireEvent.change(screen.getByPlaceholderText('Nome do Fluxo'), { target: { value: 'TestFlow' } });

    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse([], false, 1)); // Mock response for filter application

    // Click "Aplicar Filtros" button
    fireEvent.click(screen.getByText('Aplicar Filtros'));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch).toHaveBeenLastCalledWith(
      `/api/agents/${mockAgentId}/logs?page=1&limit=10&startDate=2023-01-01T00%3A00&endDate=2023-01-31T23%3A59&status=error&flowName=TestFlow`
    ); // Note: datetime-local values might be URL encoded.
  });

  test('pagination buttons fetch correct pages and update disabled states', async () => {
    // Initial call for page 1
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse(mockLogsPage1, true, 1));
    render(<AgentLogView agentId={mockAgentId} name={mockAgentName} />);

    await waitFor(() => expect(screen.getByText('Agent started successfully')).toBeInTheDocument()); // message from data.message
    expect(screen.getByText('Página 1')).toBeInTheDocument();
    expect(screen.getByText('Anterior')).toBeDisabled();
    expect(screen.getByText('Próxima')).not.toBeDisabled();

    // Click Next to go to Page 2
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse(mockLogsPage2, false, 2));
    fireEvent.click(screen.getByText('Próxima'));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch).toHaveBeenLastCalledWith(`/api/agents/${mockAgentId}/logs?page=2&limit=10`);
    // Message for error log is now in data.error.message
    await waitFor(() => expect(screen.getByText('An error occurred accessing external resource')).toBeInTheDocument());
    expect(screen.getByText('Página 2')).toBeInTheDocument();
    expect(screen.getByText('Anterior')).not.toBeDisabled();
    expect(screen.getByText('Próxima')).toBeDisabled();

    // Click Previous to go back to Page 1
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse(mockLogsPage1, true, 1));
    fireEvent.click(screen.getByText('Anterior'));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    expect(fetch).toHaveBeenLastCalledWith(`/api/agents/${mockAgentId}/logs?page=1&limit=10`);
    await waitFor(() => expect(screen.getByText('Agent started successfully')).toBeInTheDocument()); // message from data.message
    expect(screen.getByText('Página 1')).toBeInTheDocument();
    expect(screen.getByText('Anterior')).toBeDisabled();
    expect(screen.getByText('Próxima')).not.toBeDisabled();
  });

  test('log details are expandable and show correct content', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse(mockLogsPage1, false));
    render(<AgentLogView agentId={mockAgentId} name={mockAgentName} />);

    await waitFor(() => expect(screen.getByText('Agent started successfully')).toBeInTheDocument()); // message from data.message

    // Find the summary element for the first log's details
    // The component uses "Detalhes" as the summary text
    const summaryElements = screen.getAllByText('Detalhes');
    expect(summaryElements.length).toBeGreaterThan(0);

    const firstLogSummary = summaryElements[0];

    // Check that details are not visible initially. For log1, data is { message: '...', input: 'data1' }
    // We'll look for a string unique to the JSON data, e.g., "input": "data1"
    expect(screen.queryByText(/"input":\s*"data1"/)).toBeNull();

    // Click the summary to expand
    fireEvent.click(firstLogSummary);

    // Check if the detailed JSON content is now visible
    const detailedJson = await screen.findByText(/"input":\s*"data1"/i, { exact: false });
    expect(detailedJson).toBeInTheDocument();
    expect(detailedJson.closest('pre')).toBeInTheDocument();
    // Also check for the message part of data
    expect(await screen.findByText(/"message":\s*"Agent started successfully"/i, { exact: false })).toBeInTheDocument();
  });

  test('error details are shown for logs with errors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse(mockLogsPage2, false)); // mockLogsPage2 contains an error log
    render(<AgentLogView agentId={mockAgentId} name={mockAgentName} />);

    // The main message for error log is data.error.message
    await waitFor(() => expect(screen.getByText('An error occurred accessing external resource')).toBeInTheDocument());

    // Check for the detailed error message display structure
    // The component uses "Erro Detalhado:" prefix
    const detailedErrorElement = screen.getByText(/Erro Detalhado: An error occurred accessing external resource/i);
    expect(detailedErrorElement).toBeInTheDocument();
    expect(detailedErrorElement.tagName).toBe('P');
    expect(detailedErrorElement).toHaveClass('text-red-700');

    // Check for stack trace
    expect(screen.getByText(/Stack: stacktrace.../i)).toBeInTheDocument();
  });

  test('refresh button calls fetchLogs with current parameters', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse(mockLogsPage1, true, 1));
    render(<AgentLogView agentId={mockAgentId} name={mockAgentName} />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1)); // Initial load

    // Mock for the refresh call
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse(mockLogsPage1, true, 1));

    const refreshButton = screen.getByRole('button', { name: /RefreshCcw/i }); // Icon name
    fireEvent.click(refreshButton);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    // It should call with the same page, limit, and filters (empty in this case)
    expect(fetch).toHaveBeenLastCalledWith(`/api/agents/${mockAgentId}/logs?page=1&limit=10`);
  });

  test('export button shows alert', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse(mockLogsPage1, true));
    render(<AgentLogView agentId={mockAgentId} name={mockAgentName} />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    const exportButton = screen.getByRole('button', { name: /Exportar/i });
    fireEvent.click(exportButton);

    expect(alertSpy).toHaveBeenCalledWith('Functionality to be implemented');
    alertSpy.mockRestore();
  });

});
