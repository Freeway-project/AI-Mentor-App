import {
  GroqClient,
  OpenRouterClient,
  buildSearchQueryParserPrompt,
  buildProviderRankingPrompt,
  LLMMessage,
} from '@owl-mentors/llm';
import { Mentor } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';

export interface ParsedIntent {
  maxRate?: number;
  language?: string;
  semanticQuery: string;
}

export type MentorWithReason = Mentor & { matchScore?: number; matchReason?: string };

export class LLMSearchService {
  private groq: GroqClient | null;
  private openrouter: OpenRouterClient | null;

  constructor() {
    this.groq = process.env.GROQ_API_KEY ? new GroqClient(process.env.GROQ_API_KEY) : null;
    this.openrouter = process.env.OPENROUTER_API_KEY ? new OpenRouterClient(process.env.OPENROUTER_API_KEY) : null;
  }

  private async callWithFallback(messages: LLMMessage[]): Promise<string> {
    const opts = { maxTokens: 512, temperature: 0 };

    if (this.groq) {
      try {
        const res = await this.groq.chat(messages, opts);
        return res.content;
      } catch (err) {
        logger.warn(`[LLMSearch] Groq failed, falling back to OpenRouter: ${(err as Error).message}`);
      }
    }

    if (this.openrouter) {
      const res = await this.openrouter.chat(messages, opts);
      return res.content;
    }

    throw new Error('No LLM provider configured');
  }

  async parseIntent(query: string): Promise<ParsedIntent> {
    try {
      const messages = buildSearchQueryParserPrompt(query);
      const content = await this.callWithFallback(messages);

      // Extract JSON from response (may be wrapped in markdown code fences)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { semanticQuery: query };

      const parsed = JSON.parse(jsonMatch[0]);
      const result: ParsedIntent = { semanticQuery: query };

      if (parsed.budget?.max != null) {
        result.maxRate = Number(parsed.budget.max);
      }
      if (parsed.language) {
        result.language = parsed.language.charAt(0).toUpperCase() + parsed.language.slice(1);
      }

      return result;
    } catch {
      return { semanticQuery: query };
    }
  }

  async rerankAndExplain(query: string, mentors: MentorWithReason[]): Promise<MentorWithReason[]> {
    try {
      const messages = buildProviderRankingPrompt(query, mentors);
      const content = await this.callWithFallback(messages);

      // Extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return mentors;

      const rankings: Array<{ providerId: string; score: number; reason: string }> = JSON.parse(jsonMatch[0]);

      // Build a lookup map
      const rankMap = new Map(rankings.map(r => [r.providerId, r]));

      // Merge matchReason onto each mentor and sort by LLM score descending
      const enriched = mentors.map(m => {
        const rank = rankMap.get(m.id);
        return rank ? { ...m, matchReason: rank.reason } : m;
      });

      enriched.sort((a, b) => {
        const scoreA = rankMap.get(a.id)?.score ?? 0;
        const scoreB = rankMap.get(b.id)?.score ?? 0;
        return scoreB - scoreA;
      });

      return enriched;
    } catch {
      return mentors;
    }
  }
}
