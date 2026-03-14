import { logger } from '@owl-mentors/utils';
import { BaseEmbeddingClient } from './base.embedding-client';

/**
 * OpenAI text-embedding-3-small client.
 *
 * Model: text-embedding-3-small
 *   - 1536 dimensions
 *   - Cost: $0.02 / 1M tokens (~$0 for typical mentor profile sizes)
 *   - Docs: https://platform.openai.com/docs/api-reference/embeddings
 *
 * Reuses the OPENAI_API_KEY already required by the Whisper transcription service.
 */
export class OpenAIEmbeddingClient extends BaseEmbeddingClient {
  /** Max chars sent to the API — conservative guard against token limit (8191 tokens). */
  private static readonly MAX_CHARS = 20_000;

  constructor(apiKey: string) {
    super(apiKey, 'https://api.openai.com/v1', 'text-embedding-3-small');
  }

  /**
   * Embed text using text-embedding-3-small.
   * @param text - Profile or query text to embed
   * @returns float[1536] vector
   */
  async embed(text: string): Promise<number[]> {
    const model = this.defaultModel;
    const startTime = Date.now();

    try {
      const response = await this.fetchJson<{ data: [{ embedding: number[] }] }>(
        '/embeddings',
        {
          model,
          input: text.slice(0, OpenAIEmbeddingClient.MAX_CHARS),
        },
      );

      const duration = Date.now() - startTime;
      logger.llm({ provider: 'openai', model, duration });

      return response.data[0].embedding;
    } catch (error) {
      logger.llm({
        provider: 'openai',
        model,
        duration: Date.now() - startTime,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
