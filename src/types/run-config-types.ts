export interface SpeechConfig {
  voice?: string;
  speed?: number;
}

export interface ChatRunConfig {
  max_llm_calls?: number;
  stream_response?: boolean;
  speech_config?: SpeechConfig | string; // string for potential future complex configs
}
