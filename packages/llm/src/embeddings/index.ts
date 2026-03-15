import { OpenAIEmbeddingClient } from './openai.embedding-client';
import { VoyageEmbeddingClient } from './voyage.embedding-client';
import { EmbeddingProvider } from './types';

export * from './types';
export * from './base.embedding-client';
export * from './openai.embedding-client';
export * from './voyage.embedding-client';

/**
 * Factory for embedding clients.
 *
 * Reads EMBEDDING_PROVIDER env var (default: 'openai').
 *
 * Supported providers:
 *   - 'openai'  — text-embedding-3-small (1536 dims). Requires OPENAI_API_KEY.
 *   - 'voyage'  — voyage-3-large (1024 dims).          Requires VOYAGE_API_KEY.
 */
export function createEmbeddingClient(): EmbeddingProvider {
  const provider = (process.env.EMBEDDING_PROVIDER ?? 'openai').toLowerCase();

  switch (provider) {
    case 'openai': {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error('OPENAI_API_KEY is required for the OpenAI embedding client');
      return new OpenAIEmbeddingClient(key);
    }
    case 'voyage': {
      const key = process.env.VOYAGE_API_KEY;
      if (!key) throw new Error('VOYAGE_API_KEY is required for the Voyage embedding client');
      return new VoyageEmbeddingClient(key);
    }
    default:
      throw new Error(
        `Unknown EMBEDDING_PROVIDER: "${provider}". Supported: openai, voyage`,
      );
  }
}
