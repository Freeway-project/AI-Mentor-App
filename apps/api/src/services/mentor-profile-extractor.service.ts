import {
  buildMentorProfileExtractionPrompt,
  MentorExtractedFields,
  GroqClient,
  LLMMessage,
  LLMResponse,
  OpenRouterClient,
} from '@owl-mentors/llm';
import { logger } from '@owl-mentors/utils';
import { serviceUsageService } from './service-usage.service';

const FEATURE = 'mentor_profile_extract';

export class MentorProfileExtractorService {
  private groq: GroqClient | null;
  private openrouter: OpenRouterClient | null;

  constructor() {
    this.groq = process.env.GROQ_API_KEY ? new GroqClient(process.env.GROQ_API_KEY) : null;
    this.openrouter = process.env.OPENROUTER_API_KEY ? new OpenRouterClient(process.env.OPENROUTER_API_KEY) : null;
  }

  private extractJson(content: string): unknown {
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (!objectMatch) throw new Error('No JSON object found in LLM response');
    return JSON.parse(objectMatch[0]);
  }

  private async callWithFallback(messages: LLMMessage[]): Promise<LLMResponse> {
    const opts = { maxTokens: 1400, temperature: 0.2 };
    const metadata = { feature: FEATURE, messageCount: messages.length, maxTokens: opts.maxTokens };

    if (this.groq) {
      const startTime = Date.now();
      try {
        const res = await this.groq.chat(messages, opts);
        await serviceUsageService.recordSuccess({
          service: 'llm',
          provider: res.provider,
          operation: FEATURE,
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
          operation: FEATURE,
          usageCount: 1,
          durationMs: Date.now() - startTime,
          errorMessage: (error as Error).message,
          metadata,
        });
        logger.warn(`[MentorExtractor] Groq failed, falling back: ${(error as Error).message}`);
      }
    }

    if (this.openrouter) {
      const startTime = Date.now();
      try {
        const res = await this.openrouter.chat(messages, opts);
        await serviceUsageService.recordSuccess({
          service: 'llm',
          provider: res.provider,
          operation: FEATURE,
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
          operation: FEATURE,
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

  private buildFallback(rawText: string): MentorExtractedFields {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const commonSkills = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'AWS', 'Docker',
      'SQL', 'MongoDB', 'Next.js', 'System Design', 'Machine Learning', 'Git',
      'Product Strategy', 'Leadership', 'Mentoring', 'Data Analysis', 'Agile', 'Scrum',
    ];
    const detectedSkills = commonSkills.filter(skill =>
      new RegExp(skill.replace('.', '\\.'), 'i').test(rawText)
    );

    const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return {
      name: lines[0]?.slice(0, 100) || '',
      email: emailMatch?.[0] || '',
      headline: lines[1]?.slice(0, 120) || '',
      bio: lines.slice(0, 3).join(' ').slice(0, 400) || '',
      specialties: detectedSkills.slice(0, 3),
      expertise: detectedSkills.slice(0, 8),
      languages: ['English'],
      certificationNames: [],
    };
  }

  async extractMentorFields(resumeText: string): Promise<MentorExtractedFields> {
    if (!resumeText || resumeText.trim().length < 50) {
      return this.buildFallback(resumeText);
    }

    try {
      const messages = buildMentorProfileExtractionPrompt(resumeText);
      const res = await this.callWithFallback(messages);
      const raw = this.extractJson(res.content) as any;

      return {
        name: typeof raw.name === 'string' ? raw.name : '',
        email: typeof raw.email === 'string' ? raw.email.trim() : '',
        headline: typeof raw.headline === 'string' ? raw.headline.slice(0, 120) : '',
        bio: typeof raw.bio === 'string' ? raw.bio.slice(0, 1000) : '',
        specialties: Array.isArray(raw.specialties) ? raw.specialties.slice(0, 6) : [],
        expertise: Array.isArray(raw.expertise) ? raw.expertise.slice(0, 12) : [],
        languages: Array.isArray(raw.languages) && raw.languages.length > 0 ? raw.languages : ['English'],
        certificationNames: Array.isArray(raw.certificationNames) ? raw.certificationNames : [],
      };
    } catch (error) {
      logger.warn(`[MentorExtractor] LLM extraction failed, using fallback: ${(error as Error).message}`);
      return this.buildFallback(resumeText);
    }
  }
}
