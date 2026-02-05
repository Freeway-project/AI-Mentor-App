import { z, ZodError } from 'zod';

/**
 * Validation utility functions
 */

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const validated = schema.parse(data);
    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return {
      success: false,
      errors: ['Validation failed'],
    };
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/\s+/g, ' ');
}
