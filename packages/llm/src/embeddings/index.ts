import { OpenAIEmbeddingClient } from './openai.embedding-client';
import { EmbeddingProvider } from './types';

export * from './types';
export * from './base.embedding-client';
export * from './openai.embedding-client';

/**
 * Factory for embedding clients.
 *
 * Reads EMBEDDING_PROVIDER env var (default: 'openai').
 * Currently only OpenAI is supported; extend the switch for future providers.
 *
 * Required env vars:
 *   OPENAI_API_KEY — shared with the Whisper transcription service
 *   EMBEDDING_PROVIDER — optional, defaults to 'openai'
 */
export function createEmbeddingClient(): EmbeddingProvider {
  const provider = (process.env.EMBEDDING_PROVIDER ?? 'openai').toLowerCase();

  switch (provider) {
    case 'openai': {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error('OPENAI_API_KEY is required for the OpenAI embedding client');
      return new OpenAIEmbeddingClient(key);
    }
    default:
      throw new Error(`Unknown EMBEDDING_PROVIDER: "${provider}". Supported: openai`);
  }
}
