// This file is deprecated. Use mentor.schema.ts instead.
// Re-exporting for backwards compatibility during migration.
export * from './mentor.schema';

// Legacy type aliases
export type { Mentor as Provider } from './mentor.schema';
export type { CreateMentorInput as CreateProviderInput } from './mentor.schema';
export type { UpdateMentorInput as UpdateProviderInput } from './mentor.schema';
export type { SearchMentorsInput as SearchProvidersInput } from './mentor.schema';
