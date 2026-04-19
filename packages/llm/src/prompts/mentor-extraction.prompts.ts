import { LLMMessage } from '../types';

export interface MentorExtractedFields {
  name: string;
  email: string;
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

Before writing the bio, internally reason through: (1) the person's most impressive career achievement or defining experience, (2) the unique combination of skills or background that sets them apart, (3) the type of mentee who would benefit most from them. Use this reasoning to write a compelling, specific bio — not a generic one.

Return JSON only with this shape:
{
  "name": "full name of the person",
  "email": "email address found in the resume, or empty string if not found",
  "headline": "punchy professional headline — their current or most recent title plus company, or a concise statement of their expertise, max 120 chars",
  "bio": "3-4 sentence professional bio written in third person. Open with their most distinctive strength or background. Include years of experience or a standout credential. Close with what they bring to mentees. Make it compelling and specific — never generic. Max 600 chars.",
  "specialties": ["broad coaching/domain area, e.g. 'Career Coaching', 'Software Engineering', 'Product Management', 'Leadership'"],
  "expertise": ["specific skill, tool, or topic, e.g. 'React', 'System Design', 'Interview Prep', 'Go-to-Market Strategy'"],
  "languages": ["language the person speaks or works in"],
  "certificationNames": ["name of certification or credential only, e.g. 'PMP', 'AWS Solutions Architect', 'CFA'"]
}

Rules:
- specialties: broad categories, max 6.
- expertise: specific skills/tools/topics, max 12.
- bio: written in third person, specific and compelling, NOT a generic summary. 3-4 sentences, max 600 chars.
- email: extract verbatim from the resume if present; otherwise return empty string.
- If resume does not mention languages, default to ["English"].
- certificationNames: names only, no descriptions or file references.
- If a field cannot be inferred, return an empty array or empty string.
- JSON only, no markdown fences, no commentary outside the JSON.`,
    },
    {
      role: 'user',
      content: `Resume text:\n${resumeText.slice(0, 20000)}`,
    },
  ];
}
