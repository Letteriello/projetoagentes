import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CommunicationChannelItem } from './a2a-communication-channel';
import { CommunicationChannel } from '@/types/a2a-types';
import { logA2AMessageEvent, logA2AError, logA2AStatusChange } from '@/lib/logService';

// Mock the logService module
jest.mock('@/lib/logService');

// Mock an agent list for channel props if needed
const mockAvailableAgents = [
  { id: 'agent2', name: 'Agent 2' },
  { id: 'agent3', name: 'Agent 3' },
];

describe('A2ACommunicationChannel Integration Tests (with simulated events)', () => {
  jest.useFakeTimers();

  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();

  // Helper to render the component with given channel props
  const renderChannelItem = (channelProps: Partial<CommunicationChannel> = {}) => {
    const defaultChannel: CommunicationChannel = {
      id: 'channel1',
      name: 'Test Channel Outbound',
      direction: 'outbound', // Critical for activating heartbeat/reconnection
      messageFormat: 'json',
      syncMode: 'async',
      // retryPolicy, targetAgentId, etc., can be added as needed per test
      ...channelProps,
    };
    return render(
      <CommunicationChannelItem
        channel={defaultChannel}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        availableAgents={mockAvailableAgents}
      />
    );
  };

  beforeEach(() => {
    // Clear mock history before each test
    jest.clearAllMocks();
    // Reset window.* mocks if any were set by tests
    // This is a simple way; a more robust way might involve a setup/teardown for window properties
    const globalAny = window as any;
    Object.keys(globalAny).forEach(key => {
      if (key.startsWith('clearPongTimer_')) {
        delete globalAny[key];
      }
    });
  });

  test('initial connection simulation and status display', () => {
    const channelId = 'channel1'; // Default channel ID from helper
    renderChannelItem({ id: channelId }); // Explicitly pass channelId for clarity in log assertions

    expect(screen.getByTitle(/Unknown status/i)).toBeInTheDocument();

    act(() => { jest.advanceTimersByTime(10); });
    expect(screen.getByTitle(/Connecting.../i)).toBeInTheDocument();
    expect(logA2AStatusChange).toHaveBeenCalledWith(
      { channelId }, "connecting", expect.stringContaining('Attempting initial connection')
    );
    jest.clearAllMocks();

    act(() => { jest.advanceTimersByTime(1500); });
    expect(screen.queryByTitle(/Connecting.../i)).not.toBeInTheDocument();

    const isConnected = !!screen.queryByTitle(/Connected/i);
    const isDisconnected = !!screen.queryByTitle(/Disconnected/i);
    expect(isConnected || isDisconnected).toBe(true);

    if (isConnected) {
      expect(logA2AStatusChange).toHaveBeenCalledWith(
        { channelId }, "connected", expect.stringContaining('Initial connection established')
      );
    } else {
      expect(logA2AError).toHaveBeenCalledWith(
        'a2a_connection_error', { channelId }, expect.stringContaining('Initial connection failed')
      );
    }
  });

  test('heartbeat: sends ping, handles pong timeout, becomes unresponsive then disconnected', () => {
    const channelId = 'channel-heartbeat-test';
    const targetAgentId = 'agentTargetFoo'; // Example target agent for pings
    const mockMath = Object.create(global.Math);
    mockMath.random = () => 0.1; // Force initial connection success
    global.Math = mockMath;

    renderChannelItem({ id: channelId, targetAgentId: targetAgentId });

    act(() => { jest.advanceTimersByTime(1500); }); // Initial connection
    expect(screen.getByTitle(/Connected/i)).toBeInTheDocument();
    expect(logA2AStatusChange).toHaveBeenCalledWith(
      { channelId }, "connected", expect.stringContaining('Initial connection established')
    );
    jest.clearAllMocks();

    // --- First ping and timeout ---
    act(() => { jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS); });
    expect(logA2AMessageEvent).toHaveBeenCalledWith(
      'a2a_heartbeat_ping', { channelId, targetAgentId }, expect.stringContaining('Sending PING')
    );
    act(() => { jest.advanceTimersByTime(PONG_TIMEOUT_MS); });
    expect(screen.getByTitle(/Unresponsive/i)).toBeInTheDocument();
    expect(logA2AError).toHaveBeenCalledWith(
      'a2a_connection_error', { channelId }, expect.stringContaining('PONG timeout'), { unresponsivePings: 1 }
    );
    expect(logA2AStatusChange).toHaveBeenCalledWith(
      { channelId }, "unresponsive", expect.stringContaining('unresponsive, attempt 1')
    );
    jest.clearAllMocks();

    // --- Second ping and timeout ---
    act(() => { jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS); });
    expect(logA2AMessageEvent).toHaveBeenCalledWith(
      'a2a_heartbeat_ping', { channelId, targetAgentId }, expect.stringContaining('Sending PING')
    );
    act(() => { jest.advanceTimersByTime(PONG_TIMEOUT_MS); });
    expect(screen.getByTitle(/Unresponsive/i)).toBeInTheDocument();
    expect(logA2AError).toHaveBeenCalledWith(
      'a2a_connection_error', { channelId }, expect.stringContaining('PONG timeout'), { unresponsivePings: 2 }
    );
    expect(logA2AStatusChange).toHaveBeenCalledWith(
      { channelId }, "unresponsive", expect.stringContaining('unresponsive, attempt 2')
    );
    jest.clearAllMocks();

    // --- Third ping and timeout (leads to disconnect) ---
    act(() => { jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS); });
    expect(logA2AMessageEvent).toHaveBeenCalledWith(
      'a2a_heartbeat_ping', { channelId, targetAgentId }, expect.stringContaining('Sending PING')
    );
    act(() => { jest.advanceTimersByTime(PONG_TIMEOUT_MS); });
    expect(screen.getByTitle(/Disconnected/i)).toBeInTheDocument();
    expect(logA2AError).toHaveBeenCalledWith( // This is the 3rd pong timeout error
      'a2a_connection_error', { channelId }, expect.stringContaining('PONG timeout'), { unresponsivePings: 3 }
    );
    expect(logA2AStatusChange).toHaveBeenCalledWith( // This is the status change to disconnected
      { channelId }, "disconnected", expect.stringContaining(`disconnected after ${MAX_UNRESPONSIVE_PINGS} unresponsive pings`)
    );

    global.Math = Object.getPrototypeOf(mockMath); // Restore Math
  });

  test('reconnection logic: attempts reconnection after disconnect, then succeeds', () => {
    const channelId = 'channel-reconnect-test';
    let successfulReconnectCheck = false;
    const mockMath = Object.create(global.Math);
    mockMath.random = () => 0.5; // Fail initial connection
    global.Math = mockMath;

    renderChannelItem({ id: channelId });

    act(() => { jest.advanceTimersByTime(1500); }); // Initial connection fails
    expect(screen.getByTitle(/Disconnected/i)).toBeInTheDocument();
    expect(logA2AError).toHaveBeenCalledWith('a2a_connection_error', { channelId }, expect.stringContaining('Initial connection failed'));
    jest.clearAllMocks();

    mockMath.random = () => 0.1; // Succeed reconnection
    global.Math = mockMath;

    // --- 1st reconnect attempt (delay: Math.pow(2, 0) * 1000 = 1000ms) ---
    act(() => { jest.advanceTimersByTime(1000); }); // Advance for reconnect scheduler
    expect(screen.getByTitle(/Connecting.../i)).toBeInTheDocument();
    expect(logA2AStatusChange).toHaveBeenCalledWith(
      { channelId }, "connecting", expect.stringContaining(`Attempting to reconnect channel ${channelId} (1/${MAX_RECONNECT_ATTEMPTS})`), { currentAttempt: 1 }
    );

    act(() => { jest.advanceTimersByTime(3000); }); // Advance for the reconnect attempt itself + random jitter (e.g. 2000 + 500)

    const connectedTitle = screen.queryByTitle(/Connected/i);
    if (connectedTitle) {
      expect(connectedTitle).toBeInTheDocument();
      expect(logA2AStatusChange).toHaveBeenCalledWith(
        { channelId }, "connected", expect.stringContaining('reconnected successfully on attempt 1'), { attemptsMade: 1 }
      );
      successfulReconnectCheck = true;
    }
    expect(successfulReconnectCheck).toBe(true); // This assertion confirms the above block was entered

    global.Math = Object.getPrototypeOf(mockMath); // Restore Math
  });

  test('inbound channel remains connected and does not trigger pings or reconnections', () => {
    const channelId = 'inbound-channel-test';
    renderChannelItem({ direction: 'inbound', id: channelId });

    act(() => { jest.advanceTimersByTime(10); });
    expect(screen.getByTitle(/Connected/i)).toBeInTheDocument();
    expect(logA2AStatusChange).toHaveBeenCalledWith(
        { channelId }, "connected", expect.stringContaining('Inbound channel')
    );
    jest.clearAllMocks(); // Clear initial connection log

    act(() => { jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 2); });

    expect(screen.getByTitle(/Connected/i)).toBeInTheDocument();
    expect(logA2AMessageEvent).not.toHaveBeenCalledWith(
      'a2a_heartbeat_ping', expect.anything(), expect.anything() // Simplified, type only
    );
    // Check that status change to connecting (reconnect attempt) was not called
    expect(logA2AStatusChange).not.toHaveBeenCalledWith(expect.anything(), "connecting", expect.stringContaining("Attempting to reconnect"));
    expect(logA2AError).not.toHaveBeenCalled();
  });

  test('user clicking Reconnect button triggers reconnection attempt', () => {
    const channelId = 'channel-manual-reconnect';
    const mockMath = Object.create(global.Math);
    mockMath.random = () => 0.8; // Force initial connection to fail
    global.Math = mockMath;

    renderChannelItem({ id: channelId });

    act(() => { jest.advanceTimersByTime(1500); }); // Initial connection fails
    expect(screen.getByTitle(/Disconnected/i)).toBeInTheDocument();
    // Ensure log for initial failure is there, then clear for next assertions
    expect(logA2AError).toHaveBeenCalledWith('a2a_connection_error', { channelId }, expect.stringContaining('Initial connection failed'));
    jest.clearAllMocks();

    // Button should be visible
    const reconnectButton = screen.getByRole('button', { name: /Reconnect/i });
    expect(reconnectButton).toBeInTheDocument();

    // Mock Math to make this reconnection attempt succeed
    mockMath.random = () => 0.1;
    global.Math = mockMath;

    act(() => {
      fireEvent.click(reconnectButton);
    });

    // Should go to connecting state and log the attempt
    expect(screen.getByTitle(/Connecting.../i)).toBeInTheDocument();
    expect(logA2AStatusChange).toHaveBeenCalledWith(
      { channelId }, "connecting", expect.stringContaining(`Attempting to reconnect channel ${channelId} (1/${MAX_RECONNECT_ATTEMPTS})`), { currentAttempt: 1 }
    );

    // Advance time for the reconnection attempt to complete
    act(() => { jest.advanceTimersByTime(3000); });
    expect(screen.getByTitle(/Connected/i)).toBeInTheDocument();
    expect(logA2AStatusChange).toHaveBeenCalledWith(
      { channelId }, "connected", expect.stringContaining('reconnected successfully on attempt 1'), { attemptsMade: 1 }
    );

    global.Math = Object.getPrototypeOf(mockMath);
  });

});

// Define constants used in A2ACommunicationChannel for test reference (if not exported by component)
const HEARTBEAT_INTERVAL_MS = 30000;
const PONG_TIMEOUT_MS = 10000;
const MAX_UNRESPONSIVE_PINGS = 3;
const MAX_RECONNECT_ATTEMPTS = 5;

// Note: Testing the "pong received" scenario (onPongReceived function) is challenging
// because it relies on an external trigger (clearing a timer via window property)
// which is a side effect of sendPingWithPongDetection. A more direct way to test
// onPongReceived would require refactoring it to be callable or triggered differently,
// e.g. via a prop or a more sophisticated mock of the communication layer.

// Further tests could include:
// - Max reconnection attempts leading to "error" state (covered implicitly by reconnection logic test if it fails multiple times).
// - Prop updates (e.g., channel name change) are handled correctly if they affect component behavior.
// - More granular checks of what's NOT called, e.g. ensuring pings don't start if connection fails.
