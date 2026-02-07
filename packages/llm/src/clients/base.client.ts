import { LLMMessage, LLMResponse, LLMChatOptions, LLMProvider } from '../types';
import { logger } from '@mentor-app/utils';

export abstract class BaseLLMClient implements LLMProvider {
  protected apiKey: string;
  protected baseUrl: string;
  protected defaultModel: string;

  constructor(apiKey: string, baseUrl: string, defaultModel: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.defaultModel = defaultModel;
  }

  abstract chat(messages: LLMMessage[], options?: LLMChatOptions): Promise<LLMResponse>;

  protected async fetch(url: string, options: RequestInit): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      return response;
    } catch (error) {
      logger.error('LLM fetch error', error as Error);
      throw error;
    }
  }
}
