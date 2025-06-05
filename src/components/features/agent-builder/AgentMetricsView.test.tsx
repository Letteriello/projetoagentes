import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentMetricsView } from './AgentMetricsView'; // Adjust path as needed
import { LogEntry } from './AgentLogView'; // Import LogEntry type

// Mock global fetch
global.fetch = jest.fn();

const mockAgentId = 'test-agent-metrics';

const mockLogs: LogEntry[] = [
  // Execution 1: Success
  { id: '1', agentId: mockAgentId, timestamp: '2023-10-01T10:00:00Z', flowName: 'FlowA', type: 'start', traceId: 'traceA1', data: { input: 'data1' } },
  { id: '2', agentId: mockAgentId, timestamp: '2023-10-01T10:01:00Z', flowName: 'FlowA', type: 'tool_call', traceId: 'traceA1', data: { toolName: 'Calculator', input: '1+1' } },
  { id: '3', agentId: mockAgentId, timestamp: '2023-10-01T10:02:00Z', flowName: 'FlowA', type: 'end', traceId: 'traceA1', data: { output: 'result1' } },

  // Execution 2: Error
  { id: '4', agentId: mockAgentId, timestamp: '2023-10-02T11:00:00Z', flowName: 'FlowB', type: 'start', traceId: 'traceB1', data: { input: 'data2' } },
  { id: '5', agentId: mockAgentId, timestamp: '2023-10-02T11:01:00Z', flowName: 'FlowB', type: 'error', traceId: 'traceB1', data: { error: { message: 'Failure' } } },
  // Note: traceB1 did not 'end' successfully

  // Execution 3: Success (another tool call)
  { id: '6', agentId: mockAgentId, timestamp: '2023-10-03T12:00:00Z', flowName: 'FlowC', type: 'start', traceId: 'traceC1', data: { input: 'data3' } },
  { id: '7', agentId: mockAgentId, timestamp: '2023-10-03T12:01:00Z', flowName: 'FlowC', type: 'tool_call', traceId: 'traceC1', data: { toolName: 'WebSearch', input: 'query' } },
  { id: '8', agentId: mockAgentId, timestamp: '2023-10-03T12:02:00Z', flowName: 'FlowC', type: 'tool_call', traceId: 'traceC1', data: { toolName: 'Calculator', input: '2*2' } },
  { id: '9', agentId: mockAgentId, timestamp: '2023-10-03T12:03:00Z', flowName: 'FlowC', type: 'end', traceId: 'traceC1', data: { output: 'result3' } },

  // Execution 4: Started but no end/error (incomplete within this log set)
  { id: '10', agentId: mockAgentId, timestamp: '2023-10-04T13:00:00Z', flowName: 'FlowD', type: 'start', traceId: 'traceD1', data: { input: 'data4' } },
];

const mockSuccessResponseForAllLogs = (logs: LogEntry[]) => ({
    ok: true,
    // Simulate API that might return all logs in one go for metrics, or paginated if helper handles it
    json: async () => ({
      logs: logs, // Assuming fetchAllAgentLogs in component might paginate and aggregate
      hasNextPage: false, // Simplified: assume all logs fetched for metric calculation
    }),
  });

const mockErrorResponse = (message: string = "Failed to fetch logs for metrics") => ({
  ok: false,
  json: async () => ({ error: message }),
  statusText: message,
});

describe('AgentMetricsView', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test('renders loading state initially and fetches logs for metrics', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponseForAllLogs(mockLogs));
    render(<AgentMetricsView agentId={mockAgentId} />);

    expect(screen.getByText(/Carregando métricas.../i)).toBeInTheDocument();
    // fetchAllAgentLogs might call fetch multiple times if pagination is implemented there.
    // For this test, assume it's one aggregated call or the first call of a series.
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    // Example check for the first call made by fetchAllAgentLogs
    expect(fetch).toHaveBeenCalledWith(`/api/agents/${mockAgentId}/logs?page=1&limit=100&status=all`);


    // Check if metrics are rendered (example)
    await waitFor(() => {
      expect(screen.getByText('Total de Execuções')).toBeInTheDocument();
    });
  });

  test('calculates and displays metrics correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponseForAllLogs(mockLogs));
    render(<AgentMetricsView agentId={mockAgentId} />);

    await waitFor(() => {
      // Total Executions: traceA1, traceB1, traceC1, traceD1 = 4
      expect(screen.getByText('Total de Execuções').closest('div.pb-2')?.nextElementSibling?.querySelector('.text-2xl')?.textContent).toBe('4');

      // Successful Executions: traceA1, traceC1 = 2
      // Failed Executions: traceB1 = 1
      // Success Rate: (2/4)*100 = 50%
      // Error Rate: (1/4)*100 = 25%
      expect(screen.getByText('Taxa de Sucesso').closest('div.pb-2')?.nextElementSibling?.querySelector('.text-2xl')?.textContent).toBe('50.0%');
      expect(screen.getByText('Taxa de Erro').closest('div.pb-2')?.nextElementSibling?.querySelector('.text-2xl')?.textContent).toBe('25.0%');
      expect(screen.getByText('2 de 4 execuções bem-sucedidas')).toBeInTheDocument();
      expect(screen.getByText('1 de 4 execuções falharam')).toBeInTheDocument();


      // Tool Frequency: Calculator (2), WebSearch (1)
      expect(screen.getByText('Uso de Ferramentas')).toBeInTheDocument();
      const toolListItems = screen.getAllByRole('listitem'); // Assuming ul/li for tools
      expect(toolListItems[0]).toHaveTextContent('Calculator');
      expect(toolListItems[0]).toHaveTextContent('2 usos');
      expect(toolListItems[1]).toHaveTextContent('WebSearch');
      expect(toolListItems[1]).toHaveTextContent('1 uso');
    });
  });

  test('handles API error and displays error message', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(mockErrorResponse("Metrics API Down"));
    render(<AgentMetricsView agentId={mockAgentId} />);

    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar métricas: Metrics API Down/i)).toBeInTheDocument();
    });
  });

  test('handles empty logs response for metrics', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponseForAllLogs([]));
    render(<AgentMetricsView agentId={mockAgentId} />);

    await waitFor(() => {
      // Check for default/zeroed metrics display
      expect(screen.getByText('Total de Execuções').closest('div.pb-2')?.nextElementSibling?.querySelector('.text-2xl')?.textContent).toBe('0');
      expect(screen.getByText('Taxa de Sucesso').closest('div.pb-2')?.nextElementSibling?.querySelector('.text-2xl')?.textContent).toBe('0.0%');
      expect(screen.getByText('Taxa de Erro').closest('div.pb-2')?.nextElementSibling?.querySelector('.text-2xl')?.textContent).toBe('0.0%');
      expect(screen.getByText(/Nenhuma ferramenta utilizada/i)).toBeInTheDocument();
    });
  });

  test('displays message if agentId is not provided', () => {
    render(<AgentMetricsView agentId="" />); // Empty agentId
    expect(screen.getByText(/Erro ao carregar métricas: Agent ID is not provided./i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

});
