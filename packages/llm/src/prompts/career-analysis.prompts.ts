import { CareerExtractedProfile, CareerGoalInput } from '@owl-mentors/types';
import { LLMMessage } from '../types';

function safeJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function buildCareerProfileExtractionPrompt(resumeText: string): LLMMessage[] {
  return [
    {
      role: 'system',
      content: `You extract structured career data from resume text.

Return JSON only with this shape:
{
  "summary": "short professional summary",
  "headline": "optional headline",
  "coreCapabilities": ["broad capability or skill"],
  "tools": ["tool"],
  "domains": ["domain"],
  "functionalSkills": ["functional capability"],
  "communicationSkills": ["communication capability"],
  "leadershipSignals": ["leadership or ownership signal"],
  "careerInterests": ["direction the person seems interested in"],
  "certifications": ["certification"],
  "projects": [{ "name": "project", "summary": "short summary", "capabilitiesUsed": ["capability"] }],
  "education": [{ "institution": "school", "degree": "degree", "fieldOfStudy": "field", "graduationYear": "year" }],
  "experienceTimeline": [{
    "title": "role title",
    "company": "company",
    "startDate": "YYYY-MM or YYYY",
    "endDate": "YYYY-MM or YYYY or Present",
    "isCurrent": false,
    "summary": "brief impact summary",
    "capabilitiesUsed": ["capability"]
  }],
  "seniorityEstimate": "entry-level|junior|mid-level|senior|staff|principal",
  "strengthSignals": ["strength"],
  "weakSignals": ["possible gap or missing signal"],
  "confidence": 0.0
}

Rules:
- Think across technical, domain, functional, communication, and leadership dimensions.
- coreCapabilities can include technical, domain, functional, or interpersonal strengths when they are clearly evidenced.
- If information is missing, return empty arrays or omit optional strings.
- Do not invent employers, dates, or degrees.
- weakSignals should describe missing evidence, not insults.
- confidence must be between 0 and 1.
- JSON only, no markdown.`,
    },
    {
      role: 'user',
      content: `Resume text:
${resumeText.slice(0, 18000)}`,
    },
  ];
}

export function buildCareerGoalNormalizationPrompt(params: {
  goalInput: CareerGoalInput;
  extractedProfile?: CareerExtractedProfile;
}): LLMMessage[] {
  return [
    {
      role: 'system',
      content: `You normalize messy career-goal input into a compact planning profile.

Return JSON only with this shape:
{
  "targetRole": "normalized target role",
  "goalType": "career_transition|skill_building|interview_prep|promotion_readiness|project_guidance|general_growth|broad_exploration",
  "timelineMonths": 6,
  "priorityAreas": ["priority area"],
  "inferredCurrentLevel": "entry-level|junior|mid-level|senior|staff|principal",
  "constraints": {
    "weeklyHours": 5,
    "maxBudget": 120,
    "preferredLanguage": "English"
  },
  "confidence": 0.0,
  "goalSummary": "1-2 sentence summary"
}

Rules:
- Respect explicit user constraints over inferred ones.
- Infer a targetRole only when the input is vague.
- priorityAreas can include domain depth, communication, leadership, portfolio, or exploratory themes.
- Prefer 2-4 priorityAreas.
- confidence must be between 0 and 1.
- JSON only.`,
    },
    {
      role: 'user',
  content: `Goal input:
${safeJson(params.goalInput)}

Career profile:
${safeJson({
  summary: params.extractedProfile?.summary,
  coreCapabilities: params.extractedProfile?.coreCapabilities,
  functionalSkills: params.extractedProfile?.functionalSkills,
  communicationSkills: params.extractedProfile?.communicationSkills,
  leadershipSignals: params.extractedProfile?.leadershipSignals,
  careerInterests: params.extractedProfile?.careerInterests,
  seniorityEstimate: params.extractedProfile?.seniorityEstimate,
  domains: params.extractedProfile?.domains,
  strengthSignals: params.extractedProfile?.strengthSignals,
})}`,
    },
  ];
}

export function buildCareerGapAnalysisPrompt(params: {
  extractedProfile: CareerExtractedProfile;
  goalProfile: {
    targetRole: string;
    goalType: string;
    timelineMonths?: number;
    priorityAreas: string[];
    inferredCurrentLevel?: string;
    constraints?: Record<string, unknown>;
    goalSummary: string;
  };
}): LLMMessage[] {
  return [
    {
      role: 'system',
      content: `You analyze a career profile against a target goal and return a short development plan.

Return JSON only with this shape:
{
  "currentLevelSummary": "2-3 sentence summary",
  "topStrengths": ["strength"],
  "primaryGaps": ["gap"],
  "recommendedFocusAreas": ["broad development area"],
  "recommendedLearningOrder": ["ordered learning step"],
  "explorationSuggestions": ["area to explore further"],
  "briefPlan": "short plan paragraph",
  "mentorSearchQuery": "compact mentor search query"
}

Rules:
- Cover more than technical skills when appropriate: domain depth, communication, leadership, portfolio, positioning, or exploratory learning are all valid.
- Keep recommendedFocusAreas focused and practical.
- primaryGaps should map to the target role or goal.
- If the user seems broadly curious, include explorationSuggestions that widen their options without diluting the main plan.
- mentorSearchQuery should be optimized for mentor discovery, not prose.
- JSON only.`,
    },
    {
      role: 'user',
      content: `Career profile:
${safeJson(params.extractedProfile)}

Goal profile:
${safeJson(params.goalProfile)}`,
    },
  ];
}
