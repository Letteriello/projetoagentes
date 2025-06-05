// Interfaces
export interface AgentStatus {
  id: string;
  isActive: boolean;
}

export interface ExecutionHistory {
  id: string;
  timestamp: Date;
  status: 'success' | 'failure';
}

export interface AverageResponseTime {
  agentId: string;
  averageTime: number; // in milliseconds
}

export interface ToolUsage {
  toolName: string;
  usageCount: number;
}

// Mock Data Generation Functions

/**
 * Generates mock AgentStatus data.
 * @param count The number of agent statuses to generate.
 * @returns An array of AgentStatus objects.
 */
export const generateAgentStatusData = (count: number): AgentStatus[] => {
  const data: AgentStatus[] = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: `agent-${i}`,
      isActive: Math.random() < 0.7, // 70% chance of being active
    });
  }
  return data;
};

/**
 * Generates mock ExecutionHistory data.
 * @param count The number of execution history records to generate.
 * @returns An array of ExecutionHistory objects.
 */
export const generateExecutionHistoryData = (count: number): ExecutionHistory[] => {
  const data: ExecutionHistory[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    data.push({
      id: `exec-${i}`,
      timestamp: new Date(now - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 7)), // within the last week
      status: Math.random() < 0.8 ? 'success' : 'failure', // 80% chance of success
    });
  }
  return data;
};

/**
 * Generates mock AverageResponseTime data for a list of agent IDs.
 * @param agentIds An array of agent IDs.
 * @returns An array of AverageResponseTime objects.
 */
export const generateAverageResponseTimeData = (agentIds: string[]): AverageResponseTime[] => {
  const data: AverageResponseTime[] = [];
  for (const agentId of agentIds) {
    data.push({
      agentId,
      averageTime: Math.floor(Math.random() * 5000) + 500, // 500ms to 5500ms
    });
  }
  return data;
};

/**
 * Generates mock ToolUsage data.
 * @param toolNames An array of tool names.
 * @param maxUsage The maximum usage count for any tool.
 * @returns An array of ToolUsage objects.
 */
export const generateToolUsageData = (toolNames: string[], maxUsage: number): ToolUsage[] => {
  const data: ToolUsage[] = [];
  for (const toolName of toolNames) {
    data.push({
      toolName,
      usageCount: Math.floor(Math.random() * maxUsage) + 1, // 1 to maxUsage
    });
  }
  return data;
};
