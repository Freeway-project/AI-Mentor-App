import { google } from 'googleapis';
import { logger } from '@owl-mentors/utils';
import { serviceUsageService } from './service-usage.service';

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
}

export interface BusyTime {
  start: string;
  end: string;
}

export interface CalendarInfo {
  id: string;
  summary: string;
}

export interface CreatedEvent {
  eventId: string;
  meetUrl?: string;
}

function makeOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth env vars not configured');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function clientWithTokens(tokens: TokenSet) {
  const client = makeOAuth2Client();
  client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.tokenExpiry.getTime(),
  });
  return client;
}

export class GoogleCalendarService {
  getAuthUrl(state: string): string {
    const client = makeOAuth2Client();
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
      state,
    });
  }

  async exchangeCode(code: string): Promise<TokenSet> {
    const startTime = Date.now();
    try {
      const client = makeOAuth2Client();
      const { tokens } = await client.getToken(code);

      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Google OAuth: missing tokens in exchange response');
      }

      await serviceUsageService.recordSuccess({
        service: 'calendar',
        provider: 'google',
        operation: 'exchange_code',
        usageCount: 1,
        durationMs: Date.now() - startTime,
      });

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
      };
    } catch (error) {
      await serviceUsageService.recordFailure({
        service: 'calendar',
        provider: 'google',
        operation: 'exchange_code',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        errorMessage: (error as Error).message,
      });
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; tokenExpiry: Date }> {
    const startTime = Date.now();
    try {
      const client = makeOAuth2Client();
      client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await client.refreshAccessToken();

      await serviceUsageService.recordSuccess({
        service: 'calendar',
        provider: 'google',
        operation: 'refresh_access_token',
        usageCount: 1,
        durationMs: Date.now() - startTime,
      });

      return {
        accessToken: credentials.access_token!,
        tokenExpiry: new Date(credentials.expiry_date ?? Date.now() + 3600 * 1000),
      };
    } catch (error) {
      await serviceUsageService.recordFailure({
        service: 'calendar',
        provider: 'google',
        operation: 'refresh_access_token',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        errorMessage: (error as Error).message,
      });
      throw error;
    }
  }

  async listCalendars(tokens: TokenSet): Promise<CalendarInfo[]> {
    const startTime = Date.now();
    try {
      const auth = clientWithTokens(tokens);
      const calendar = google.calendar({ version: 'v3', auth });

      const res = await calendar.calendarList.list({ minAccessRole: 'freeBusyReader' });
      const calendars = (res.data.items ?? []).map(item => ({
        id: item.id ?? '',
        summary: item.summary ?? item.id ?? '',
      }));

      await serviceUsageService.recordSuccess({
        service: 'calendar',
        provider: 'google',
        operation: 'list_calendars',
        usageCount: calendars.length || 1,
        durationMs: Date.now() - startTime,
        metadata: { calendarCount: calendars.length },
      });

      return calendars;
    } catch (error) {
      await serviceUsageService.recordFailure({
        service: 'calendar',
        provider: 'google',
        operation: 'list_calendars',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        errorMessage: (error as Error).message,
      });
      throw error;
    }
  }

  async getBusyTimes(
    tokens: TokenSet,
    params: { calendarIds: string[]; timeMin: string; timeMax: string }
  ): Promise<BusyTime[]> {
    if (!params.calendarIds.length) return [];

    const startTime = Date.now();
    try {
      const auth = clientWithTokens(tokens);
      const calendar = google.calendar({ version: 'v3', auth });

      const res = await calendar.freebusy.query({
        requestBody: {
          timeMin: params.timeMin,
          timeMax: params.timeMax,
          items: params.calendarIds.map(id => ({ id })),
        },
      });

      const busy: BusyTime[] = [];
      for (const calId of params.calendarIds) {
        const periods = res.data.calendars?.[calId]?.busy ?? [];
        for (const p of periods) {
          if (p.start && p.end) {
            busy.push({ start: p.start, end: p.end });
          }
        }
      }

      await serviceUsageService.recordSuccess({
        service: 'calendar',
        provider: 'google',
        operation: 'get_busy_times',
        usageCount: params.calendarIds.length,
        durationMs: Date.now() - startTime,
        metadata: {
          calendarCount: params.calendarIds.length,
          busyPeriodCount: busy.length,
        },
      });

      return busy;
    } catch (error) {
      await serviceUsageService.recordFailure({
        service: 'calendar',
        provider: 'google',
        operation: 'get_busy_times',
        usageCount: params.calendarIds.length,
        durationMs: Date.now() - startTime,
        errorMessage: (error as Error).message,
        metadata: { calendarCount: params.calendarIds.length },
      });
      throw error;
    }
  }

  async createEvent(
    tokens: TokenSet,
    params: {
      calendarId: string;
      start: string;
      end: string;
      summary: string;
      attendees?: string[];
      addMeet?: boolean;
    }
  ): Promise<CreatedEvent> {
    const startTime = Date.now();
    try {
      const auth = clientWithTokens(tokens);
      const calendar = google.calendar({ version: 'v3', auth });

      const conferenceData = params.addMeet
        ? {
            createRequest: {
              requestId: `meet-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          }
        : undefined;

      const res = await calendar.events.insert({
        calendarId: params.calendarId,
        conferenceDataVersion: params.addMeet ? 1 : 0,
        requestBody: {
          summary: params.summary,
          start: { dateTime: params.start, timeZone: 'UTC' },
          end: { dateTime: params.end, timeZone: 'UTC' },
          attendees: (params.attendees ?? []).map(email => ({ email })),
          conferenceData,
        },
      });

      const eventId = res.data.id ?? '';
      const meetUrl = res.data.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri;

      await serviceUsageService.recordSuccess({
        service: 'calendar',
        provider: 'google',
        operation: 'create_event',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        metadata: {
          calendarId: params.calendarId,
          attendeeCount: params.attendees?.length ?? 0,
          hasMeet: Boolean(meetUrl),
          eventId,
        },
      });

      return { eventId, meetUrl };
    } catch (error) {
      await serviceUsageService.recordFailure({
        service: 'calendar',
        provider: 'google',
        operation: 'create_event',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        errorMessage: (error as Error).message,
        metadata: {
          calendarId: params.calendarId,
          attendeeCount: params.attendees?.length ?? 0,
        },
      });
      throw error;
    }
  }

  async updateEvent(
    tokens: TokenSet,
    params: { calendarId: string; eventId: string; start: string; end: string }
  ): Promise<void> {
    const startTime = Date.now();
    try {
      const auth = clientWithTokens(tokens);
      const calendar = google.calendar({ version: 'v3', auth });

      await calendar.events.patch({
        calendarId: params.calendarId,
        eventId: params.eventId,
        requestBody: {
          start: { dateTime: params.start, timeZone: 'UTC' },
          end: { dateTime: params.end, timeZone: 'UTC' },
        },
      });

      await serviceUsageService.recordSuccess({
        service: 'calendar',
        provider: 'google',
        operation: 'update_event',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        metadata: {
          calendarId: params.calendarId,
          eventId: params.eventId,
        },
      });
    } catch (error) {
      await serviceUsageService.recordFailure({
        service: 'calendar',
        provider: 'google',
        operation: 'update_event',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        errorMessage: (error as Error).message,
        metadata: {
          calendarId: params.calendarId,
          eventId: params.eventId,
        },
      });
      throw error;
    }
  }

  async deleteEvent(
    tokens: TokenSet,
    params: { calendarId: string; eventId: string }
  ): Promise<void> {
    const startTime = Date.now();
    const metadata = {
      calendarId: params.calendarId,
      eventId: params.eventId,
    };

    try {
      const auth = clientWithTokens(tokens);
      const calendar = google.calendar({ version: 'v3', auth });

      try {
        await calendar.events.delete({ calendarId: params.calendarId, eventId: params.eventId });
      } catch (err: any) {
        // 410 Gone = already deleted; treat as success
        if (err?.code !== 410 && err?.status !== 410) {
          logger.error('[GoogleCalendar] deleteEvent failed:', err);
          throw err;
        }
      }

      await serviceUsageService.recordSuccess({
        service: 'calendar',
        provider: 'google',
        operation: 'delete_event',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        metadata,
      });
    } catch (error) {
      await serviceUsageService.recordFailure({
        service: 'calendar',
        provider: 'google',
        operation: 'delete_event',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        errorMessage: (error as Error).message,
        metadata,
      });
      throw error;
    }
  }
}
