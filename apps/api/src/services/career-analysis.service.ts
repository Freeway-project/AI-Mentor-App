import {
  CareerAnalysis,
  CareerExtractedProfile,
  CareerGoalInput,
  CareerGoalProfile,
  CareerMentorRecommendation,
  careerAnalysisSchema,
  careerExtractedProfileSchema,
  careerGoalProfileSchema,
  Mentor,
} from '@owl-mentors/types';
import {
  buildCareerGapAnalysisPrompt,
  buildCareerGoalNormalizationPrompt,
  buildCareerProfileExtractionPrompt,
  GroqClient,
  LLMMessage,
  LLMResponse,
  OpenRouterClient,
} from '@owl-mentors/llm';
import { logger } from '@owl-mentors/utils';
import { MentorRepository } from '@owl-mentors/database';
import { serviceUsageService } from './service-usage.service';
import { EmbeddingService } from './embedding.service';
import { MentorSearchService, MentorWithReason, ParsedIntent } from './mentor-search.service';

type CareerFeature = 'career_profile_extract' | 'career_goal_normalize' | 'career_gap_analysis';

export class CareerAnalysisService {
  private groq: GroqClient | null;
  private openrouter: OpenRouterClient | null;
  private embeddingService: EmbeddingService;
  private mentorSearchService: MentorSearchService;
  private mentorRepo: MentorRepository;

  constructor() {
    this.groq = process.env.GROQ_API_KEY ? new GroqClient(process.env.GROQ_API_KEY) : null;
    this.openrouter = process.env.OPENROUTER_API_KEY ? new OpenRouterClient(process.env.OPENROUTER_API_KEY) : null;
    this.embeddingService = new EmbeddingService();
    this.mentorSearchService = new MentorSearchService();
    this.mentorRepo = new MentorRepository();
  }

  private extractJson(content: string): unknown {
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (!objectMatch) {
      throw new Error('No JSON object found in LLM response');
    }

    return JSON.parse(objectMatch[0]);
  }

  private async callWithFallback(messages: LLMMessage[], feature: CareerFeature): Promise<LLMResponse> {
    const opts = { maxTokens: 1400, temperature: 0.2 };
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
          operation: feature,
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
          operation: feature,
          usageCount: 1,
          durationMs: Date.now() - startTime,
          errorMessage: (error as Error).message,
          metadata,
        });
        logger.warn(`[CareerAnalysis] Groq failed for ${feature}, falling back: ${(error as Error).message}`);
      }
    }

    if (this.openrouter) {
      const startTime = Date.now();
      try {
        const res = await this.openrouter.chat(messages, opts);
        await serviceUsageService.recordSuccess({
          service: 'llm',
          provider: res.provider,
          operation: feature,
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
          operation: feature,
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

  private buildFallbackExtractedProfile(rawText: string): CareerExtractedProfile {
    const lines = rawText
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    const commonCapabilities = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'AWS', 'Docker', 'SQL',
      'MongoDB', 'PostgreSQL', 'Next.js', 'System Design', 'Machine Learning', 'Git',
      'Product Strategy', 'Stakeholder Management', 'Leadership', 'Mentoring', 'Data Analysis',
    ];
    const detectedCapabilities = commonCapabilities.filter(skill => new RegExp(skill.replace('.', '\\.'), 'i').test(rawText));
    const summary = lines.slice(0, 4).join(' ').slice(0, 320) || 'Resume uploaded and parsed.';

    return {
      summary,
      headline: lines[0]?.slice(0, 120),
      coreCapabilities: detectedCapabilities,
      tools: detectedCapabilities.filter(skill => ['AWS', 'Docker', 'Git', 'MongoDB', 'PostgreSQL'].includes(skill)),
      domains: [],
      functionalSkills: detectedCapabilities.filter(skill => ['System Design', 'Product Strategy', 'Data Analysis'].includes(skill)),
      communicationSkills: detectedCapabilities.filter(skill => ['Stakeholder Management', 'Mentoring'].includes(skill)),
      leadershipSignals: detectedCapabilities.filter(skill => ['Leadership', 'Mentoring'].includes(skill)),
      careerInterests: [],
      certifications: [],
      projects: [],
      education: [],
      experienceTimeline: [],
      seniorityEstimate: 'mid-level',
      strengthSignals: detectedCapabilities.slice(0, 4),
      weakSignals: detectedCapabilities.length === 0 ? ['Limited structured evidence extracted from resume text'] : [],
      confidence: 0.25,
    };
  }

  private buildFallbackGoalProfile(goalInput: CareerGoalInput, extractedProfile?: CareerExtractedProfile): CareerGoalProfile {
    const inferredCurrentLevel = extractedProfile?.seniorityEstimate;
    const fallbackPriorities = [
      ...(extractedProfile?.careerInterests.slice(0, 2) ?? []),
      ...(extractedProfile?.weakSignals.slice(0, 2) ?? []),
    ].slice(0, 4);
    const targetRole =
      goalInput.targetRole?.trim() ||
      goalInput.careerStageGoal?.trim() ||
      extractedProfile?.headline ||
      'Career Growth';

    return {
      targetRole,
      goalType: goalInput.targetRole ? 'career_transition' : goalInput.focusAreas?.length ? 'skill_building' : 'broad_exploration',
      timelineMonths: goalInput.timelineMonths,
      priorityAreas: goalInput.focusAreas?.slice(0, 4) ?? fallbackPriorities,
      inferredCurrentLevel,
      constraints: {
        weeklyHours: goalInput.weeklyHours,
        maxBudget: goalInput.maxBudget,
        preferredLanguage: goalInput.preferredLanguage,
      },
      confidence: 0.4,
      goalSummary: goalInput.freeformGoal?.trim() || `Growth plan focused on ${targetRole}.`,
    };
  }

  private buildFallbackAnalysis(extractedProfile: CareerExtractedProfile, goalProfile: CareerGoalProfile): CareerAnalysis {
    const primaryGaps = extractedProfile.weakSignals.slice(0, 4);
    const recommendedFocusAreas = goalProfile.priorityAreas.length > 0
      ? goalProfile.priorityAreas.slice(0, 5)
      : primaryGaps.slice(0, 5);
    const mentorSearchQuery = [
      goalProfile.targetRole,
      ...goalProfile.priorityAreas,
      ...recommendedFocusAreas,
      goalProfile.inferredCurrentLevel,
      'mentor',
    ]
      .filter(Boolean)
      .join(' ');

    const recommendedCourses = recommendedFocusAreas.flatMap((area) => {
      const normalized = area.toLowerCase();
      if (normalized.includes('admin') || normalized.includes('office')) {
        return ['Microsoft Excel (Advanced)', 'Business Communication', 'Administrative Professional Certificate'];
      }
      if (normalized.includes('hr') || normalized.includes('human resource') || normalized.includes('recruit')) {
        return ['HR Fundamentals', 'Recruitment & Talent Acquisition', 'Employment Law Basics'];
      }
      if (normalized.includes('marketing') || normalized.includes('seo') || normalized.includes('social media')) {
        return ['Digital Marketing Fundamentals', 'Search Engine Optimization (SEO)', 'Content Marketing'];
      }
      if (normalized.includes('supply chain') || normalized.includes('logistics') || normalized.includes('inventory')) {
        return ['Supply Chain Management', 'Logistics & Transportation', 'Inventory Management'];
      }
      if (normalized.includes('beauty') || normalized.includes('esthet') || normalized.includes('spa')) {
        return ['Medical Esthetics', 'Advanced Skin Care', 'Spa Management'];
      }
      if (normalized.includes('customer') || normalized.includes('client service') || normalized.includes('support')) {
        return ['Customer Experience (CX)', 'Conflict Resolution', 'CRM Platforms'];
      }
      if (normalized.includes('react') || normalized.includes('javascript') || normalized.includes('typescript')) {
        return ['Modern React Patterns', 'Advanced TypeScript', 'System Design Fundamentals'];
      }
      if (normalized.includes('system design')) {
        return ['Designing Data-Intensive Applications (study group)', 'System Design Interview Prep'];
      }
      if (normalized.includes('product')) {
        return ['Product Management Foundations', 'Stakeholder Management', 'Roadmap & Prioritisation'];
      }
      return [`Foundations of ${area}`, `Applied ${area}`];
    }).slice(0, 8);
    const dedupedCourses = Array.from(new Set(recommendedCourses));

    const recommendedCertifications = [
      'Microsoft Excel Advanced',
      'Customer Service Certificate',
      'Digital Marketing Certificate',
    ].filter((cert) => recommendedFocusAreas.some((area) => {
      const a = area.toLowerCase();
      return (
        (cert.includes('Excel') && (a.includes('admin') || a.includes('office') || a.includes('data') || a.includes('logistics'))) ||
        (cert.includes('Customer Service') && (a.includes('customer') || a.includes('support') || a.includes('client'))) ||
        (cert.includes('Digital Marketing') && (a.includes('marketing') || a.includes('seo') || a.includes('social')))
      );
    }));

    return {
      currentLevelSummary: extractedProfile.summary,
      topStrengths: extractedProfile.strengthSignals.slice(0, 5),
      primaryGaps,
      recommendedFocusAreas,
      recommendedLearningOrder: recommendedFocusAreas,
      recommendedCourses: dedupedCourses,
      recommendedCertifications,
      explorationSuggestions: extractedProfile.careerInterests.slice(0, 3),
      briefPlan: goalProfile.goalSummary,
      mentorSearchQuery,
      generatedAt: new Date(),
    };
  }

  async extractCareerProfile(rawText: string): Promise<CareerExtractedProfile> {
    try {
      const messages = buildCareerProfileExtractionPrompt(rawText);
      const content = (await this.callWithFallback(messages, 'career_profile_extract')).content;
      return careerExtractedProfileSchema.parse(this.extractJson(content));
    } catch (error) {
      logger.warn(`[CareerAnalysis] Falling back to local profile extraction: ${(error as Error).message}`);
      return this.buildFallbackExtractedProfile(rawText);
    }
  }

  async normalizeGoal(
    goalInput: CareerGoalInput,
    extractedProfile?: CareerExtractedProfile
  ): Promise<CareerGoalProfile> {
    const hasMeaningfulInput = Boolean(
      goalInput.targetRole ||
      goalInput.careerStageGoal ||
      goalInput.timelineMonths ||
      goalInput.focusAreas?.length ||
      goalInput.weeklyHours ||
      goalInput.maxBudget ||
      goalInput.preferredLanguage ||
      goalInput.freeformGoal
    );

    if (!hasMeaningfulInput) {
      return this.buildFallbackGoalProfile(goalInput, extractedProfile);
    }

    try {
      const messages = buildCareerGoalNormalizationPrompt({ goalInput, extractedProfile });
      const content = (await this.callWithFallback(messages, 'career_goal_normalize')).content;
      return careerGoalProfileSchema.parse(this.extractJson(content));
    } catch (error) {
      logger.warn(`[CareerAnalysis] Falling back to local goal normalization: ${(error as Error).message}`);
      return this.buildFallbackGoalProfile(goalInput, extractedProfile);
    }
  }

  async analyzeCareerProfile(
    extractedProfile: CareerExtractedProfile,
    goalProfile: CareerGoalProfile
  ): Promise<CareerAnalysis> {
    try {
      const messages = buildCareerGapAnalysisPrompt({ extractedProfile, goalProfile });
      const content = (await this.callWithFallback(messages, 'career_gap_analysis')).content;
      const parsed = careerAnalysisSchema.omit({ generatedAt: true }).parse(this.extractJson(content));
      return {
        ...parsed,
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.warn(`[CareerAnalysis] Falling back to local gap analysis: ${(error as Error).message}`);
      return this.buildFallbackAnalysis(extractedProfile, goalProfile);
    }
  }

  private async searchMentors(query: string, maxBudget?: number, preferredLanguage?: string): Promise<MentorWithReason[]> {
    const limit = 6;
    const parsedIntent: ParsedIntent = await this.mentorSearchService.parseIntent(query)
      .catch(() => this.mentorSearchService.buildLocalIntent(query));

    const structuredFilters = {
      maxRate: maxBudget ?? parsedIntent.maxRate,
      language: preferredLanguage ?? parsedIntent.language,
      minRating: undefined,
    };

    let vectorMentors: MentorWithReason[] = [];
    try {
      const raw = await this.embeddingService.searchMentors(parsedIntent.semanticQuery, limit);
      vectorMentors = this.mentorSearchService.applyStructuredFilters(raw, structuredFilters);
    } catch (error) {
      logger.warn(`[CareerAnalysis] Vector search fallback triggered: ${(error as Error).message}`);
    }

    let keywordMentors: MentorWithReason[] = [];
    try {
      const raw = await this.mentorRepo.search({
        limit,
        offset: 0,
        maxRate: structuredFilters.maxRate,
        languages: structuredFilters.language ? [structuredFilters.language] : undefined,
        query: this.mentorSearchService.buildKeywordQuery(parsedIntent),
      });
      keywordMentors = this.mentorSearchService.attachHeuristicReasons(
        this.mentorSearchService.applyStructuredFilters(raw, structuredFilters),
        parsedIntent
      );
    } catch (error) {
      logger.warn(`[CareerAnalysis] Keyword search failed: ${(error as Error).message}`);
    }

    let mentors = this.mentorSearchService.mergeResults(vectorMentors, keywordMentors, limit);

    if (mentors.length > 0) {
      mentors = await this.mentorSearchService.rerankAndExplain(query, mentors);
    }

    return this.mentorSearchService.attachHeuristicReasons(mentors, parsedIntent);
  }

  async recommendMentors(
    analysis: CareerAnalysis,
    goalProfile: CareerGoalProfile
  ): Promise<CareerMentorRecommendation[]> {
    const mentors = await this.searchMentors(
      analysis.mentorSearchQuery,
      goalProfile.constraints.maxBudget,
      goalProfile.constraints.preferredLanguage
    );

    return mentors.map((mentor: Mentor & { matchScore?: number; matchReason?: string }) => ({
      mentorId: mentor.id,
      name: mentor.name,
      headline: mentor.headline,
      hourlyRate: mentor.hourlyRate,
      specialties: mentor.specialties ?? [],
      matchScore: mentor.matchScore,
      matchReason: mentor.matchReason,
    }));
  }
}
