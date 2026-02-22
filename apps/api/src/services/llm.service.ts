import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { logger } from '@owl-mentors/utils';

// OpenRouter uses the OpenAI SDK format
const openRouter = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    defaultHeaders: {
        'HTTP-Referer': process.env.PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'OWLMentors',
    },
});

// Groq SDK
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || '',
});

export const LlmService = {
    /**
     * Simple function to hit OpenRouter
     * OpenRouter is great for accessing models like Claude 3.5, Llama 3, or Gemini
     */
    async generateOpenRouterResponse(messages: any[], model = 'meta-llama/llama-3-8b-instruct:free') {
        if (!process.env.OPENROUTER_API_KEY) {
            logger.warn('[LlmService] OPENROUTER_API_KEY missing');
            return null;
        }

        try {
            const completion = await openRouter.chat.completions.create({
                model,
                messages,
            });
            return completion.choices[0]?.message?.content || '';
        } catch (error: any) {
            logger.error('[LlmService] OpenRouter Error:', error);
            throw new Error('Failed to fetch from OpenRouter');
        }
    },

    /**
     * Simple function to hit Groq
     * Groq is great for ultra-fast, low-latency Llama and Mixtral inference
     */
    async generateGroqResponse(messages: any[], model = 'llama3-8b-8192') {
        if (!process.env.GROQ_API_KEY) {
            logger.warn('[LlmService] GROQ_API_KEY missing');
            return null;
        }

        try {
            const completion = await groq.chat.completions.create({
                messages,
                model,
                temperature: 0.7,
                max_tokens: 1024,
            });
            return completion.choices[0]?.message?.content || '';
        } catch (error: any) {
            logger.error('[LlmService] Groq Error:', error);
            throw new Error('Failed to fetch from Groq');
        }
    }
};
