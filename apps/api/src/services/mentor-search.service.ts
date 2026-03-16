import {
  GroqClient,
  LLMResponse,
  OpenRouterClient,
  buildProviderRankingPrompt,
  buildSearchQueryParserPrompt,
  LLMMessage,
} from '@owl-mentors/llm';
import { Mentor } from '@owl-mentors/types';
import { logger } from '@owl-mentors/utils';
import { serviceUsageService } from './service-usage.service';

export interface ParsedIntent {
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  keywords: string[];
  language?: string;
  maxRate?: number;
  queryVariants: string[];
  semanticQuery: string;
  skills: string[];
  topic?: string;
}

export type MentorWithReason = Mentor & { matchScore?: number; matchReason?: string };

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'at',
  'be',
  'better',
  'coach',
  'coaching',
  'for',
  'get',
  'help',
  'i',
  'im',
  'improve',
  'in',
  'learn',
  'looking',
  'me',
  'mentor',
  'mentors',
  'my',
  'need',
  'on',
  'someone',
  'stuck',
  'struggling',
  'support',
  'teach',
  'to',
  'want',
  'weak',
  'with',
]);

const EXPERIENCE_LEVELS = new Set(['beginner', 'intermediate', 'advanced']);

const TERM_ALIASES = new Map<string, string>([
  ['api design', 'API Design'],
  ['backend engineering', 'Backend Engineering'],
  ['career growth', 'Career Growth'],
  ['code review', 'Code Review'],
  ['design system', 'Design Systems'],
  ['design systems', 'Design Systems'],
  ['frontend architecture', 'Frontend Architecture'],
  ['interview prep', 'Interview Prep'],
  ['js', 'JavaScript'],
  ['machine learning', 'Machine Learning'],
  ['ml', 'Machine Learning'],
  ['next js', 'Next.js'],
  ['next.js', 'Next.js'],
  ['nextjs', 'Next.js'],
  ['node js', 'Node.js'],
  ['node.js', 'Node.js'],
  ['nodejs', 'Node.js'],
  ['performance optimization', 'Performance Optimization'],
  ['product sense', 'Product Sense'],
  ['react js', 'React'],
  ['react native', 'React Native'],
  ['reactjs', 'React'],
  ['system design', 'System Design'],
  ['ts', 'TypeScript'],
  ['type script', 'TypeScript'],
  ['typescript', 'TypeScript'],
  ['ux design', 'UX Design'],
  ['web performance', 'Web Performance'],
]);

const MULTI_WORD_TERMS = [
  'api design',
  'backend engineering',
  'career growth',
  'code review',
  'design system',
  'design systems',
  'frontend architecture',
  'interview prep',
  'machine learning',
  'next js',
  'next.js',
  'node js',
  'node.js',
  'performance optimization',
  'product sense',
  'react native',
  'system design',
  'type script',
  'ux design',
  'web performance',
];

const LANGUAGE_ALIASES = new Map<string, string>([
  ['english', 'English'],
  ['french', 'French'],
  ['german', 'German'],
  ['hindi', 'Hindi'],
  ['japanese', 'Japanese'],
  ['korean', 'Korean'],
  ['portuguese', 'Portuguese'],
  ['spanish', 'Spanish'],
]);

function unique(values: Array<string | undefined | null>): string[] {
  return Array.from(new Set(values.map(value => value?.trim()).filter(Boolean) as string[]));
}

function sanitizeQuery(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9.+#\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function toTitleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function canonicalizeTerm(value?: string): string | undefined {
  if (!value) return undefined;

  const normalized = sanitizeQuery(value);
  if (!normalized) return undefined;

  const alias = TERM_ALIASES.get(normalized);
  if (alias) return alias;

  if (normalized.length <= 2 || STOP_WORDS.has(normalized) || EXPERIENCE_LEVELS.has(normalized)) {
    return undefined;
  }

  return toTitleCase(normalized);
}

function normalizeLanguage(value?: string): string | undefined {
  if (!value) return undefined;
  return LANGUAGE_ALIASES.get(sanitizeQuery(value));
}

function normalizeExperienceLevel(value?: string): ParsedIntent['experienceLevel'] {
  if (!value) return undefined;

  const normalized = sanitizeQuery(value);
  if (EXPERIENCE_LEVELS.has(normalized)) {
    return normalized as ParsedIntent['experienceLevel'];
  }

  return undefined;
}

function detectExperienceLevel(query: string): ParsedIntent['experienceLevel'] {
  const normalized = sanitizeQuery(query);

  if (/\b(advanced|expert|staff|senior|lead|principal|deep dive)\b/.test(normalized)) {
    return 'advanced';
  }

  if (/\b(intermediate|mid level|mid-level)\b/.test(normalized)) {
    return 'intermediate';
  }

  if (/\b(beginner|new to|starting|just starting|weak at|struggling with|need help|learn|improve|get better)\b/.test(normalized)) {
    return 'beginner';
  }

  return undefined;
}

function detectBudget(query: string): number | undefined {
  const normalized = sanitizeQuery(query);
  const match =
    normalized.match(/\b(?:under|below|less than|max|up to)\s*\$?(\d{2,4})\b/) ??
    normalized.match(/\$(\d{2,4})\b/);

  if (!match) return undefined;

  const maxRate = Number(match[1]);
  return Number.isFinite(maxRate) ? maxRate : undefined;
}

function detectLanguage(query: string): string | undefined {
  const normalized = sanitizeQuery(query);

  for (const [alias, language] of LANGUAGE_ALIASES.entries()) {
    if (new RegExp(`\\b${alias}\\b`, 'i').test(normalized)) {
      return language;
    }
  }

  return undefined;
}

export class MentorSearchService {
  private groq: GroqClient | null;
  private openrouter: OpenRouterClient | null;

  constructor() {
    this.groq = process.env.GROQ_API_KEY ? new GroqClient(process.env.GROQ_API_KEY) : null;
    this.openrouter = process.env.OPENROUTER_API_KEY ? new OpenRouterClient(process.env.OPENROUTER_API_KEY) : null;
  }

  private async callWithFallback(
    messages: LLMMessage[],
    feature: 'parse_intent' | 'rerank_results'
  ): Promise<LLMResponse> {
    const opts = { maxTokens: 512, temperature: 0 };
    const metadata = {
      feature,
      messageCount: messages.length,
      maxTokens: opts.maxTokens,
    };

    if (this.groq) {
      const startTime = Date.now();
      try {
        const res = await this.groq.chat(messages, opts);
        await serviceUsageService.recordSuccess({
          service: 'llm',
          provider: res.provider,
          operation: 'chat_completion',
          model: res.model,
          usageCount: 1,
          durationMs: Date.now() - startTime,
          promptTokens: res.tokens?.prompt,
          completionTokens: res.tokens?.completion,
          totalTokens: res.tokens?.total,
          metadata,
        });
        return res;
      } catch (error) {
        await serviceUsageService.recordFailure({
          service: 'llm',
          provider: 'groq',
          operation: 'chat_completion',
          usageCount: 1,
          durationMs: Date.now() - startTime,
          errorMessage: (error as Error).message,
          metadata,
        });
        logger.warn(`[MentorSearch] Groq failed, falling back to OpenRouter: ${(error as Error).message}`);
      }
    }

    if (this.openrouter) {
      const startTime = Date.now();
      try {
        const res = await this.openrouter.chat(messages, opts);
        await serviceUsageService.recordSuccess({
          service: 'llm',
          provider: res.provider,
          operation: 'chat_completion',
          model: res.model,
          usageCount: 1,
          durationMs: Date.now() - startTime,
          promptTokens: res.tokens?.prompt,
          completionTokens: res.tokens?.completion,
          totalTokens: res.tokens?.total,
          metadata,
        });
        return res;
      } catch (error) {
        await serviceUsageService.recordFailure({
          service: 'llm',
          provider: 'openrouter',
          operation: 'chat_completion',
          usageCount: 1,
          durationMs: Date.now() - startTime,
          errorMessage: (error as Error).message,
          metadata,
        });
        throw error;
      }
    }

    throw new Error('No LLM provider configured');
  }

  buildLocalIntent(query: string): ParsedIntent {
    const normalized = sanitizeQuery(query);
    const multiWordTerms = MULTI_WORD_TERMS
      .filter(term => normalized.includes(term))
      .map(term => canonicalizeTerm(term))
      .filter(Boolean) as string[];

    const tokenTerms = normalized
      .split(' ')
      .map(token => canonicalizeTerm(token))
      .filter(Boolean) as string[];

    const keywords = unique([...multiWordTerms, ...tokenTerms]).filter(term => {
      const lower = sanitizeQuery(term);
      return !STOP_WORDS.has(lower) && !EXPERIENCE_LEVELS.has(lower);
    });

    const topic = keywords[0];
    const experienceLevel = detectExperienceLevel(query);
    const language = detectLanguage(query);
    const maxRate = detectBudget(query);
    const semanticParts = unique([
      topic,
      ...keywords,
      experienceLevel,
      language,
      keywords.length > 0 ? 'mentor' : undefined,
    ]);

    return {
      experienceLevel,
      keywords,
      language,
      maxRate,
      queryVariants: unique([query, semanticParts.join(' '), ...keywords]),
      semanticQuery: unique([query, semanticParts.join(' ')]).join(' '),
      skills: keywords,
      topic,
    };
  }

  private mergeIntent(query: string, localIntent: ParsedIntent, parsed: any): ParsedIntent {
    const topic = canonicalizeTerm(parsed?.topic) ?? localIntent.topic;
    const skills = unique([
      ...(Array.isArray(parsed?.skills) ? parsed.skills.map((skill: string) => canonicalizeTerm(skill)) : []),
      ...localIntent.skills,
    ]);
    const keywords = unique([topic, ...skills, ...localIntent.keywords]);
    const experienceLevel = normalizeExperienceLevel(parsed?.experience_level) ?? localIntent.experienceLevel;
    const language = normalizeLanguage(parsed?.language) ?? localIntent.language;
    const maxRate =
      parsed?.budget?.max != null && Number.isFinite(Number(parsed.budget.max))
        ? Number(parsed.budget.max)
        : localIntent.maxRate;
    const semanticParts = unique([
      topic,
      ...skills,
      ...localIntent.keywords,
      experienceLevel,
      language,
      keywords.length > 0 ? 'mentor' : undefined,
    ]);

    return {
      experienceLevel,
      keywords,
      language,
      maxRate,
      queryVariants: unique([query, semanticParts.join(' '), ...keywords]),
      semanticQuery: unique([query, semanticParts.join(' ')]).join(' '),
      skills,
      topic,
    };
  }

  async parseIntent(query: string): Promise<ParsedIntent> {
    const localIntent = this.buildLocalIntent(query);

    try {
      const messages = buildSearchQueryParserPrompt(query);
      const content = (await this.callWithFallback(messages, 'parse_intent')).content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return localIntent;
      }

      return this.mergeIntent(query, localIntent, JSON.parse(jsonMatch[0]));
    } catch {
      return localIntent;
    }
  }

  async rerankAndExplain(query: string, mentors: MentorWithReason[]): Promise<MentorWithReason[]> {
    try {
      const messages = buildProviderRankingPrompt(query, mentors);
      const content = (await this.callWithFallback(messages, 'rerank_results')).content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        return mentors;
      }

      const rankings: Array<{ providerId: string; reason: string; score: number }> = JSON.parse(jsonMatch[0]);
      const rankMap = new Map(rankings.map(ranking => [ranking.providerId, ranking]));

      const enriched = mentors.map(mentor => {
        const rank = rankMap.get(mentor.id);
        return rank ? { ...mentor, matchReason: rank.reason } : mentor;
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

  applyStructuredFilters(
    mentors: MentorWithReason[],
    filters: { language?: string; maxRate?: number; minRating?: number }
  ): MentorWithReason[] {
    return mentors.filter(mentor => {
      if (filters.maxRate != null && mentor.hourlyRate != null && mentor.hourlyRate > filters.maxRate) {
        return false;
      }

      if (filters.minRating != null && (mentor.rating ?? 0) < filters.minRating) {
        return false;
      }

      if (filters.language) {
        const matchesLanguage = mentor.languages?.some(
          language => sanitizeQuery(language) === sanitizeQuery(filters.language!)
        );

        if (!matchesLanguage) {
          return false;
        }
      }

      return true;
    });
  }

  mergeResults(primary: MentorWithReason[], secondary: MentorWithReason[], limit: number): MentorWithReason[] {
    const merged = new Map<string, MentorWithReason>();

    for (const mentor of [...primary, ...secondary]) {
      const existing = merged.get(mentor.id);
      if (!existing) {
        merged.set(mentor.id, mentor);
        continue;
      }

      merged.set(mentor.id, {
        ...existing,
        ...mentor,
        matchReason: existing.matchReason ?? mentor.matchReason,
        matchScore: existing.matchScore ?? mentor.matchScore,
      });
    }

    return Array.from(merged.values()).slice(0, limit);
  }

  buildHeuristicMatchReason(mentor: MentorWithReason, intent: ParsedIntent): string {
    const searchableText = sanitizeQuery(
      [
        mentor.headline,
        mentor.bio,
        mentor.name,
        ...(mentor.specialties ?? []),
        ...(mentor.expertise ?? []),
      ]
        .filter(Boolean)
        .join(' ')
    );

    const matchedTopics = unique(
      [...intent.skills, ...intent.keywords].filter(term => searchableText.includes(sanitizeQuery(term)))
    );

    const mentorStrengths = mentor.specialties?.filter(specialty =>
      matchedTopics.some(term => sanitizeQuery(term) === sanitizeQuery(specialty))
    );

    const reasons: string[] = [];

    if (mentorStrengths && mentorStrengths.length > 0) {
      reasons.push(`Strong ${mentorStrengths.slice(0, 2).join(' and ')} coverage`);
    } else if (matchedTopics.length > 0) {
      reasons.push(`Relevant experience in ${matchedTopics.slice(0, 2).join(' and ')}`);
    }

    if (
      intent.experienceLevel === 'beginner' &&
      /\b(help|level up|pair programming|code review|interview prep|learn)\b/i.test(
        [mentor.headline, mentor.bio, ...(mentor.expertise ?? [])].filter(Boolean).join(' ')
      )
    ) {
      reasons.push('Good fit for getting unstuck and building fundamentals');
    }

    if (intent.language && mentor.languages?.some(language => sanitizeQuery(language) === sanitizeQuery(intent.language!))) {
      reasons.push(`${intent.language} sessions available`);
    }

    if (intent.maxRate != null && mentor.hourlyRate != null && mentor.hourlyRate <= intent.maxRate) {
      reasons.push('Within your budget');
    }

    return reasons[0] ?? 'Relevant mentor match for your search';
  }

  attachHeuristicReasons(mentors: MentorWithReason[], intent: ParsedIntent): MentorWithReason[] {
    return mentors.map(mentor =>
      mentor.matchReason
        ? mentor
        : {
            ...mentor,
            matchReason: this.buildHeuristicMatchReason(mentor, intent),
          }
    );
  }

  summarizeIntent(intent: ParsedIntent) {
    return {
      experienceLevel: intent.experienceLevel,
      focusTerms: unique([intent.topic, ...intent.skills]).slice(0, 6),
      language: intent.language,
      maxRate: intent.maxRate,
      semanticQuery: intent.semanticQuery,
      topic: intent.topic,
    };
  }

  buildKeywordQuery(intent: ParsedIntent): string {
    return unique([intent.topic, ...intent.skills, ...intent.keywords]).join(' ') || intent.semanticQuery;
  }
}
