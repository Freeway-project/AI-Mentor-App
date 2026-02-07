import { LLMMessage } from '../types';

export function buildSearchQueryParserPrompt(query: string): LLMMessage[] {
  return [
    {
      role: 'system',
      content: `You are a search query parser. Extract structured information from natural language search queries for finding mentors/providers.

Extract:
- topic: main subject/expertise being searched
- skills: specific technical or soft skills
- availability: time preferences (morning, afternoon, evening, specific days)
- language: preferred language
- budget: price range or constraints
- experience_level: beginner, intermediate, advanced

Return JSON only, no explanation.`,
    },
    {
      role: 'user',
      content: `Parse this search query: "${query}"

Example format:
{
  "topic": "react",
  "skills": ["hooks", "typescript"],
  "availability": { "time": "evening", "days": ["wednesday", "friday"] },
  "language": "english",
  "budget": { "max": 100 },
  "experience_level": "intermediate"
}`,
    },
  ];
}

export function buildProviderRankingPrompt(query: string, providers: any[]): LLMMessage[] {
  return [
    {
      role: 'system',
      content: `You are a mentor matching assistant. Given a search query and list of providers, rank them and provide brief reasons for the ranking.

Focus on:
- Expertise match
- Availability alignment
- Language match
- Experience level fit

Return JSON array with: [{ "providerId": "id", "score": 0-100, "reason": "brief explanation" }]`,
    },
    {
      role: 'user',
      content: `Query: "${query}"

Providers:
${JSON.stringify(providers, null, 2)}

Rank these providers and explain why each is a good or poor match.`,
    },
  ];
}
