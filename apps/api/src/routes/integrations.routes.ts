import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireEmailVerified } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { GoogleCalendarService } from '../services/google-calendar.service';
import {
  UserIntegrationRepository,
  CalendarSettingsRepository,
} from '@owl-mentors/database';

const router: Router = Router();

let integrationRepo: UserIntegrationRepository;
let calSettingsRepo: CalendarSettingsRepository;

function getIntegrationRepo() {
  if (!integrationRepo) integrationRepo = new UserIntegrationRepository();
  return integrationRepo;
}
function getCalSettingsRepo() {
  if (!calSettingsRepo) calSettingsRepo = new CalendarSettingsRepository();
  return calSettingsRepo;
}

const gcalService = new GoogleCalendarService();

// GET /api/integrations/google/start
// Redirects the authenticated user to Google OAuth consent screen
router.get('/google/start', authenticate, requireEmailVerified, (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = req.userId!;
    const url = gcalService.getAuthUrl(state);
    res.redirect(url);
  } catch (error) {
    next(error);
  }
});

// GET /api/integrations/google/callback
// Google redirects here after user grants consent
router.get('/google/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state: userId, error } = req.query as Record<string, string>;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (error || !code || !userId) {
      return res.redirect(`${frontendUrl}/mentor/dashboard/settings?calendarError=access_denied`);
    }

    const tokens = await gcalService.exchangeCode(code);

    await getIntegrationRepo().upsert({
      userId,
      provider: 'google',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiry: tokens.tokenExpiry,
    });

    res.redirect(`${frontendUrl}/mentor/dashboard/settings?calendarConnected=1`);
  } catch (err) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/mentor/dashboard/settings?calendarError=oauth_failed`);
  }
});

// GET /api/integrations/google/status
router.get('/google/status', authenticate, requireEmailVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const integration = await getIntegrationRepo().findByUser(req.userId!, 'google');
    res.json({ success: true, data: { connected: !!integration } });
  } catch (error) {
    next(error);
  }
});

// POST /api/integrations/google/disconnect
router.post('/google/disconnect', authenticate, requireEmailVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await getIntegrationRepo().delete(req.userId!, 'google');
    await getCalSettingsRepo().delete(req.userId!, 'google');
    res.json({ success: true, data: { disconnected: true } });
  } catch (error) {
    next(error);
  }
});

// GET /api/integrations/google/calendars
router.get('/google/calendars', authenticate, requireEmailVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const integration = await getIntegrationRepo().findByUser(req.userId!, 'google');
    if (!integration) {
      throw new AppError(404, 'NOT_CONNECTED', 'Google Calendar not connected');
    }

    const tokens = await maybeRefreshTokens(req.userId!, integration);
    const calendars = await gcalService.listCalendars(tokens);

    const settings = await getCalSettingsRepo().findByUser(req.userId!, 'google');

    res.json({
      success: true,
      data: {
        calendars,
        selectedCalendarIds: settings?.selectedCalendarIds ?? [],
        writeCalendarId: settings?.writeCalendarId ?? 'primary',
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/integrations/google/calendars/selected
router.post('/google/calendars/selected', authenticate, requireEmailVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { selectedCalendarIds, writeCalendarId } = req.body;

    if (!Array.isArray(selectedCalendarIds)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'selectedCalendarIds must be an array');
    }

    const settings = await getCalSettingsRepo().upsert({
      userId: req.userId!,
      provider: 'google',
      selectedCalendarIds,
      writeCalendarId: writeCalendarId ?? 'primary',
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

// Helper: refresh tokens if near expiry, return up-to-date TokenSet
async function maybeRefreshTokens(userId: string, integration: { accessToken: string; refreshToken: string; tokenExpiry: Date }) {
  const bufferMs = 5 * 60 * 1000; // 5 min buffer
  const isExpired = integration.tokenExpiry.getTime() - Date.now() < bufferMs;

  if (!isExpired) {
    return {
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken,
      tokenExpiry: integration.tokenExpiry,
    };
  }

  const refreshed = await gcalService.refreshAccessToken(integration.refreshToken);
  await getIntegrationRepo().updateTokens({
    userId,
    provider: 'google',
    accessToken: refreshed.accessToken,
    tokenExpiry: refreshed.tokenExpiry,
  });

  return {
    accessToken: refreshed.accessToken,
    refreshToken: integration.refreshToken,
    tokenExpiry: refreshed.tokenExpiry,
  };
}

export { maybeRefreshTokens };
export default router;
