import { Router, Request, Response, NextFunction } from 'express';
import { ProviderRepository } from '@owl-mentors/database';
import { createProviderSchema, searchProvidersSchema } from '@owl-mentors/types';
import { validate, validateQuery } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { createLLMClient, buildProviderRankingPrompt } from '@owl-mentors/llm';
import { logger } from '@owl-mentors/utils';

const router = Router();

let providerRepo: ProviderRepository;
function getProviderRepo() {
  if (!providerRepo) {
    providerRepo = new ProviderRepository();
  }
  return providerRepo;
}

// Create provider profile (protected)
router.post('/', authenticate, validate(createProviderSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = await getProviderRepo().create({
      ...req.body,
      userId: req.userId!,
    });

    res.status(201).json({
      success: true,
      data: provider,
    });
  } catch (error) {
    next(error);
  }
});

// Get provider by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = await getProviderRepo().findById(req.params.id);

    res.json({
      success: true,
      data: provider,
    });
  } catch (error) {
    next(error);
  }
});

// Search providers with AI ranking
router.get('/', validateQuery(searchProvidersSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = req.query as any;

    // Get providers from database
    const providers = await getProviderRepo().search(params);

    // If there's a text query, use LLM to rank and provide reasons
    if (params.query && providers.length > 0) {
      try {
        const llm = createLLMClient();
        const messages = buildProviderRankingPrompt(params.query, providers);

        const response = await llm.chat(messages, {
          temperature: 0.3,
          maxTokens: 1000,
        });

        // Parse LLM response to get ranking
        const ranking = JSON.parse(response.content);

        // Merge ranking with providers
        const rankedProviders = providers
          .map((provider) => {
            const rank = ranking.find((r: any) => r.providerId === provider.id);
            return {
              ...provider,
              aiScore: rank?.score || 0,
              aiReason: rank?.reason,
            };
          })
          .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));

        res.json({
          success: true,
          data: {
            providers: rankedProviders,
            total: providers.length,
            query: params.query,
          },
        });
      } catch (llmError) {
        // If LLM fails, return providers without ranking
        logger.error('LLM ranking failed, returning unranked results', llmError as Error);
        res.json({
          success: true,
          data: {
            providers,
            total: providers.length,
            query: params.query,
          },
        });
      }
    } else {
      // No query, return providers as-is
      res.json({
        success: true,
        data: {
          providers,
          total: providers.length,
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
