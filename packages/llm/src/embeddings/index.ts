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
 * Reads EMBEDDING_PROVIDER env var (default: 'voyage').
 *
 * Required env vars:
 *   VOYAGE_API_KEY  — for voyage (default)
 *   OPENAI_API_KEY  — for openai
 *   EMBEDDING_PROVIDER — optional, defaults to 'voyage'
 */
export function createEmbeddingClient(): EmbeddingProvider {
  const provider = (process.env.EMBEDDING_PROVIDER ?? 'voyage').toLowerCase();

  switch (provider) {
    case 'voyage': {
      const key = process.env.VOYAGE_API_KEY;
      if (!key) throw new Error('VOYAGE_API_KEY is required for the Voyage embedding client');
      return new VoyageEmbeddingClient(key);
    }
    case 'openai': {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error('OPENAI_API_KEY is required for the OpenAI embedding client');
      return new OpenAIEmbeddingClient(key);
    }
    default:
      throw new Error(`Unknown EMBEDDING_PROVIDER: "${provider}". Supported: voyage, openai`);
  }
}
