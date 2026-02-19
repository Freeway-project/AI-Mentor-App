import { BaseLLMClient } from './base.client';
import { LLMMessage, LLMResponse, LLMChatOptions } from '../types';
import { logger } from '@owl-mentors/utils';

export class OpenRouterClient extends BaseLLMClient {
  constructor(apiKey: string) {
    super(apiKey, 'https://openrouter.ai/api/v1', 'openai/gpt-3.5-turbo');
  }

  async chat(messages: LLMMessage[], options?: LLMChatOptions): Promise<LLMResponse> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;

    try {
      logger.debug('OpenRouter chat request', { model, messages: messages.length });

      const response = await this.fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://mentor-app.com',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens,
          top_p: options?.topP,
        }),
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      const result: LLMResponse = {
        content: data.choices[0]?.message?.content || '',
        model,
        provider: 'openrouter',
        tokens: {
          prompt: data.usage?.prompt_tokens,
          completion: data.usage?.completion_tokens,
          total: data.usage?.total_tokens,
        },
      };

      logger.llm({
        provider: 'openrouter',
        model,
        tokens: result.tokens,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.llm({
        provider: 'openrouter',
        model,
        duration,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
