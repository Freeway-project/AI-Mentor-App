import { OpenAIEmbeddingClient } from './openai.embedding-client';
import { VoyageEmbeddingClient } from './voyage.embedding-client';
import { EmbeddingProvider } from './types';

export * from './types';
export * from './base.embedding-client';
export * from './openai.embedding-client';
export * from './voyage.embedding-client';

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
    case 'voyage': {
      const key = process.env.VOYAGE_API_KEY;
      if (!key) throw new Error('VOYAGE_API_KEY is required for the Voyage embedding client');
      return new VoyageEmbeddingClient(key);
    }
    default:
      throw new Error(`Unknown EMBEDDING_PROVIDER: "${provider}". Supported: openai, voyage`);
  }
}
