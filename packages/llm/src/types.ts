export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
  tokens?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
}

export interface LLMChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface LLMProvider {
  chat(messages: LLMMessage[], options?: LLMChatOptions): Promise<LLMResponse>;
}

export interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}
