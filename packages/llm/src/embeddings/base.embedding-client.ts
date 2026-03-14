import { logger } from '@owl-mentors/utils';
import { EmbeddingProvider } from './types';

/**
 * Abstract base class for embedding clients.
 * Mirrors the BaseLLMClient pattern used in packages/llm/src/clients/base.client.ts.
 *
 * Subclasses implement embed() using their specific API.
 */
export abstract class BaseEmbeddingClient implements EmbeddingProvider {
  constructor(
    protected readonly apiKey: string,
    protected readonly baseUrl: string,
    protected readonly defaultModel: string,
  ) {}

  abstract embed(text: string): Promise<number[]>;

  /**
   * POST to the embedding API and return parsed JSON.
   * Handles auth headers and error surfacing consistently.
   */
  protected async fetchJson<T>(path: string, body: object): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      logger.error('Embedding network error', err as Error);
      throw err;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Embedding API ${response.status}: ${text}`);
    }

    return response.json() as Promise<T>;
  }
}
