// src/types/evaluation-report.ts
export interface EvaluationMetric {
  name: string; // e.g., "response_match_score", "tool_trajectory_avg_score", "guardrail_compliance"
  value: number | string | boolean; // Value of the metric
  threshold?: number | string | boolean; // Optional threshold for pass/fail
  details?: string; // Optional additional details or explanation
  status?: 'pass' | 'fail' | 'indeterminate'; // Status based on value and threshold
}

export interface EvaluationReport {
  reportId: string; // Unique ID for the report
  agentId: string; // ID of the agent being evaluated
  timestamp: string; // ISO string timestamp of when the report was generated
  metrics: EvaluationMetric[];
  summary?: string; // Optional overall summary
  conversationSamples?: any[]; // Optional samples of conversations used for evaluation
  agentConfigSnapshot?: any; // Optional snapshot of the agent config evaluated
}
