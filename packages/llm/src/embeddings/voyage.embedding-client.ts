import { logger } from '@owl-mentors/utils';
import { BaseEmbeddingClient } from './base.embedding-client';

/**
 * Voyage AI embedding client.
 *
 * Model: voyage-3-large (default) — best-in-class retrieval quality
 *   - 1024 dimensions
 *   - Context: 32,000 tokens
 *   - Docs: https://docs.voyageai.com/reference/embeddings-api
 *
 * Auth: Bearer token via VOYAGE_API_KEY env var.
 *
 * Input type is set to "document" for mentor profiles (indexing) and
 * "query" for search queries to maximise asymmetric retrieval quality.
 */
export class VoyageEmbeddingClient extends BaseEmbeddingClient {
  /** Voyage voyage-3-large context window is 32k tokens; use a conservative char limit. */
  private static readonly MAX_CHARS = 24_000;

  constructor(apiKey: string) {
    super(apiKey, 'https://api.voyageai.com/v1', 'voyage-3-large');
  }

  /**
   * Embed text using the Voyage AI Embeddings API.
   *
   * @param text - Profile or query text to embed
   * @param inputType - 'document' (indexing) or 'query' (search). Defaults to 'document'.
   * @returns float[1024] vector
   */
  async embed(text: string, inputType: 'document' | 'query' = 'document'): Promise<number[]> {
    const model = this.defaultModel;
    const startTime = Date.now();

    try {
      const response = await this.fetchJson<{ data: [{ embedding: number[] }] }>(
        '/embeddings',
        {
          model,
          input: [text.slice(0, VoyageEmbeddingClient.MAX_CHARS)],
          input_type: inputType,
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
