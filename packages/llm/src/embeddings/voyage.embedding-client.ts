import { logger } from '@owl-mentors/utils';
import { BaseEmbeddingClient } from './base.embedding-client';

/**
 * Voyage AI text embedding client.
 *
 * Model: voyage-3
 *   - 1024 dimensions
 *   - Free tier available at https://www.voyageai.com
 *   - Docs: https://docs.voyageai.com/reference/embeddings-api
 */
export class VoyageEmbeddingClient extends BaseEmbeddingClient {
  private static readonly MAX_CHARS = 20_000;

  constructor(apiKey: string) {
    super(apiKey, 'https://api.voyageai.com/v1', 'voyage-3');
  }

  async embed(text: string): Promise<number[]> {
    const model = this.defaultModel;
    const startTime = Date.now();

    try {
      const response = await this.fetchJson<{ data: [{ embedding: number[] }] }>(
        '/embeddings',
        {
          model,
          input: text.slice(0, VoyageEmbeddingClient.MAX_CHARS),
        },
      );

      const duration = Date.now() - startTime;
      logger.llm({ provider: 'voyage', model, duration });

      return response.data[0].embedding;
    } catch (error) {
      logger.llm({
        provider: 'voyage',
        model,
        duration: Date.now() - startTime,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
