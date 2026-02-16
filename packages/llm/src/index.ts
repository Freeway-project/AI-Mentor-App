import { OpenRouterClient } from './clients/openrouter.client';
import { GroqClient } from './clients/groq.client';
import { LLMProvider } from './types';

export * from './types';
export * from './clients/base.client';
export * from './clients/openrouter.client';
export * from './clients/groq.client';
export * from './prompts/provider-search.prompts';

export function createLLMClient(provider?: string): LLMProvider {
  const llmProvider = provider || process.env.LLM_PROVIDER || 'openrouter';

  switch (llmProvider.toLowerCase()) {
    case 'groq':
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) {
        throw new Error('GROQ_API_KEY environment variable is required');
      }
      return new GroqClient(groqKey);

    case 'openrouter':
    default:
      const openrouterKey = process.env.OPENROUTER_API_KEY;
      if (!openrouterKey) {
        throw new Error('OPENROUTER_API_KEY environment variable is required');
      }
      return new OpenRouterClient(openrouterKey);
  }
}
