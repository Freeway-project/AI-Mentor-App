import { BaseLLMClient } from './base.client';
import { LLMMessage, LLMResponse, LLMChatOptions } from '../types';
import { logger } from '@owl-mentors/utils';

export class GroqClient extends BaseLLMClient {
  constructor(apiKey: string) {
    super(apiKey, 'https://api.groq.com/openai/v1', 'mixtral-8x7b-32768');
  }

  async chat(messages: LLMMessage[], options?: LLMChatOptions): Promise<LLMResponse> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;

    try {
      logger.debug('Groq chat request', { model, messages: messages.length });

      const response = await this.fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
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
        provider: 'groq',
        tokens: {
          prompt: data.usage?.prompt_tokens,
          completion: data.usage?.completion_tokens,
          total: data.usage?.total_tokens,
        },
      };

      logger.llm({
        provider: 'groq',
        model,
        tokens: result.tokens,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.llm({
        provider: 'groq',
        model,
        duration,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
