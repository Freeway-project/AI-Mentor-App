import rateLimit from 'express-rate-limit';

const rateLimitMessage = {
  success: false,
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later',
  },
};

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

/**
 * Semantic search rate limit — applied to GET /mentor/ when a query is present.
 * Each search triggers an OpenAI Embeddings API call, so we guard against abuse.
 * 60 searches / minute per IP is generous for real users, tight enough to block scrapers.
 */
export const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'SEARCH_RATE_LIMIT_EXCEEDED',
      message: 'Too many searches. Please slow down and try again in a minute.',
    },
  },
});

/**
 * Resume upload rate limit — applied to POST /mentee/resume (future endpoint).
 * Each upload triggers OpenAI file processing + an LLM extraction call.
 * 10 uploads / hour per IP is generous: covers re-uploads and corrections.
 */
export const resumeUploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RESUME_RATE_LIMIT_EXCEEDED',
      message: 'Too many resume uploads. Please wait before trying again.',
    },
  },
});
