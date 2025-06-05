export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  inputCharacters?: number;
  outputCharacters?: number;
  cachedContentTokens?: number;
}

export function calculateTotalTokens(usage: TokenUsage[]): number {
  return usage.reduce((acc, curr) => acc + (curr.totalTokens || 0), 0);
}
