import { LLMMessage } from '../types';

export interface MentorExtractedFields {
  name: string;
  headline: string;
  bio: string;
  specialties: string[];
  expertise: string[];
  languages: string[];
  certificationNames: string[];
}

export function buildMentorProfileExtractionPrompt(resumeText: string): LLMMessage[] {
  return [
    {
      role: 'system',
      content: `You extract structured mentor/coach profile data from resume text.

Return JSON only with this shape:
{
  "name": "full name of the person",
  "headline": "professional headline or current title, max 120 chars",
  "bio": "2-3 sentence professional summary written in third person, suitable for a mentor profile page",
  "specialties": ["broad area of expertise, e.g. 'Career Coaching', 'Software Engineering', 'Product Management'"],
  "expertise": ["specific skill or topic, e.g. 'React', 'System Design', 'Interview Prep', 'Leadership'"],
  "languages": ["language the person speaks or works in"],
  "certificationNames": ["name of certification or credential, e.g. 'PMP', 'AWS Solutions Architect', 'CFA'"]
}

Rules:
- specialties are broad categories (max 5).
- expertise are specific skills or topics (max 10).
- bio should be written in third person, professional and concise, highlighting key strengths and experience.
- If the resume does not mention languages, default to ["English"].
- certificationNames are names only, not file references or descriptions.
- If a field cannot be inferred, return an empty array or an empty string.
- JSON only, no markdown fences.`,
    },
    {
      role: 'user',
      content: `Resume text:\n${resumeText.slice(0, 18000)}`,
    },
  ];
}
