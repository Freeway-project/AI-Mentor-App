import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireEmailVerified } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { GoogleCalendarService } from '../services/google-calendar.service';
import { DailyService } from '../services/daily.service';
import { EmailService } from '../services/email.service';
import { StripeService } from '../services/stripe.service';
import { logger } from '@owl-mentors/utils';
import { generateSlots } from '../services/slot-generator.service';
import { maybeRefreshTokens } from './integrations.routes';
import {
  MentorRepository,
  MeetingRepository,
  PolicyRepository,
  CreditRepository,
  OfferRepository,
  UserRepository,
  UserIntegrationRepository,
  CalendarSettingsRepository,
} from '@owl-mentors/database';

const router: Router = Router();

const mentorRepo = new MentorRepository();
const meetingRepo = new MeetingRepository();
const policyRepo = new PolicyRepository();
const creditRepo = new CreditRepository();
const offerRepo = new OfferRepository();
const userRepo = new UserRepository();
const integrationRepo = new UserIntegrationRepository();
const calSettingsRepo = new CalendarSettingsRepository();
const gcalService = new GoogleCalendarService();
const dailyService = new DailyService();
const stripeService = new StripeService();

// GET /api/mentors/:coachId/offers (public — for booking flow)
router.get('/mentors/:coachId/offers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { coachId } = req.params;
    const mentor = await mentorRepo.findById(coachId);
    const offers = await offerRepo.findByMentorId(mentor.id);
    const activeOffers = offers.filter(o => o.isActive);
    res.json({ success: true, data: activeOffers });
  } catch (error) {
    next(error);
  }
});

// GET /api/mentors/:coachId/slots
router.get('/mentors/:coachId/slots', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { coachId } = req.params;
    const { from, to, duration } = req.query as { from?: string; to?: string; duration?: string };

    if (!from || !to) {
      throw new AppError(400, 'VALIDATION_ERROR', 'from and to query params are required');
    }

    const durationMin = Number(duration) || 30;
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid date format');
    }

    const mentor = await mentorRepo.findById(coachId);
    if (!mentor.availability?.schedule?.length) {
      return res.json({ success: true, data: { slots: [] } });
    }

    // Load policy for minNotice
    const policy = await policyRepo.findByMentorId(coachId);
    const minNoticeHours = policy?.cancellationHours ?? 1;

    // Load existing bookings in range (use mentor.id = Mentor doc _id, not userId)
    const existingMeetings = await meetingRepo.list(mentor.id, {
      startDate: fromDate.toISOString(),
      endDate: new Date(toDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      limit: 200,
      offset: 0,
    });

    // Only booked/confirmed meetings block slots
    const existingBookings = existingMeetings
      .filter(m => ['booked', 'confirmed', 'in_progress'].includes(m.status))
      .map(m => ({
        start: new Date(m.scheduledAt).toISOString(),
        end: new Date(new Date(m.scheduledAt).getTime() + m.duration * 60 * 1000).toISOString(),
      }));

    // Check Google Calendar integration
    let busyTimes: { start: string; end: string }[] = [];
    const integration = await integrationRepo.findByUser(mentor.userId, 'google');
    if (integration) {
      const calSettings = await calSettingsRepo.findByUser(mentor.userId, 'google');
      const calendarIds = calSettings?.selectedCalendarIds ?? [];
      if (calendarIds.length > 0) {
        try {
          const tokens = await maybeRefreshTokens(mentor.userId, integration);
          busyTimes = await gcalService.getBusyTimes(tokens, {
            calendarIds,
            timeMin: fromDate.toISOString(),
            timeMax: new Date(toDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          });
        } catch (_) {
          // Non-fatal: fall back to no Google busy times
        }
      }
    }

    const slots = generateSlots({
      mentorAvailability: mentor.availability,
      minNoticeHours,
      fromDate,
      toDate,
      durationMin,
      existingBookings,
      busyTimes,
    });

    res.json({ success: true, data: { slots } });
  } catch (error) {
    next(error);
  }
});

// POST /api/bookings — create booking
router.post('/bookings', authenticate, requireEmailVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mentorId, offerId, scheduledAt, duration, title, description, paymentIntentId } = req.body;

    if (!mentorId || !scheduledAt) {
      throw new AppError(400, 'VALIDATION_ERROR', 'mentorId and scheduledAt are required');
    }

    const durationMin = Number(duration) || 30;
    const slotStart = new Date(scheduledAt);
    const slotEnd = new Date(slotStart.getTime() + durationMin * 60 * 1000);

    if (isNaN(slotStart.getTime())) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid scheduledAt');
    }

    // Load mentor
    const mentor = await mentorRepo.findById(mentorId);

    // Load offer if provided (get creditCost)
    let creditCost = durationMin <= 30 ? 0.5 : 1.0;
    let offerTitle = title || 'Mentoring Session';
    if (offerId) {
      try {
        const offer = await offerRepo.findById(offerId);
        if (offer.mentorId !== mentorId) {
          throw new AppError(400, 'INVALID_OFFER', 'Offer does not belong to this mentor');
        }
        creditCost = offer.price;
        offerTitle = offer.title;
      } catch (e: any) {
        if (e instanceof AppError) throw e;
        throw new AppError(404, 'OFFER_NOT_FOUND', 'Offer not found');
      }
    }

    // Race condition guard: re-check the slot is free (use mentor.id = Mentor doc _id)
    const nearbyMeetings = await meetingRepo.list(mentor.id, {
      startDate: slotStart.toISOString(),
      endDate: slotEnd.toISOString(),
      limit: 50,
      offset: 0,
    });

    const conflict = nearbyMeetings.some(m => {
      if (!['booked', 'confirmed', 'in_progress'].includes(m.status)) return false;
      const mStart = new Date(m.scheduledAt).getTime();
      const mEnd = mStart + m.duration * 60 * 1000;
      return slotStart.getTime() < mEnd && slotEnd.getTime() > mStart;
    });

    if (conflict) {
      throw new AppError(409, 'SLOT_UNAVAILABLE', 'This time slot is no longer available');
    }

    // Payment verification: Stripe (preferred) or legacy credits
    if (paymentIntentId) {
      const pi = await stripeService.retrievePaymentIntent(paymentIntentId);
      if (pi.status !== 'succeeded') {
        throw new AppError(402, 'PAYMENT_NOT_CONFIRMED', 'Stripe payment has not been completed');
      }
      const expectedCents = Math.round(creditCost * 100);
      if (pi.amount !== expectedCents) {
        throw new AppError(400, 'PAYMENT_AMOUNT_MISMATCH', 'Payment amount does not match session price');
      }
    } else {
      // Legacy credit flow
      const account = await creditRepo.getBalance(req.userId!);
      if (account.balance < creditCost) {
        throw new AppError(402, 'INSUFFICIENT_CREDITS', 'Not enough credits to book this session');
      }
    }

    // Create meeting
    const meeting = await meetingRepo.create(req.userId!, {
      mentorId,
      title: offerTitle,
      description: description || '',
      scheduledAt: slotStart.toISOString(),
      duration: durationMin,
      offerId,
      creditCost,
    });

    // Hold credits (legacy flow only)
    if (!paymentIntentId) {
      await creditRepo.holdCredits(req.userId!, creditCost, meeting.id);
    }

    // Try to create Daily room (non-fatal)
    let dailyRoomUrl: string | undefined;
    try {
      const roomExpiry = new Date(slotEnd.getTime() + 2 * 60 * 60 * 1000); // 2h after session end
      const room = await dailyService.createRoom({ meetingId: meeting.id, expiresAt: roomExpiry });
      await meetingRepo.update(meeting.id, { dailyRoomUrl: room.url, dailyRoomName: room.name } as any);
      dailyRoomUrl = room.url;
    } catch (err) {
      logger.warn(`[Booking] Daily room creation failed: ${(err as Error).message}`);
    }

    // Try to create Google Calendar event
    let meetUrl: string | undefined;
    const integration = await integrationRepo.findByUser(mentor.userId, 'google');
    if (integration) {
      const calSettings = await calSettingsRepo.findByUser(mentor.userId, 'google');
      const writeCalendarId = calSettings?.writeCalendarId || 'primary';
      try {
        const tokens = await maybeRefreshTokens(mentor.userId, integration);
        const mentee = await userRepo.findById(req.userId!);
        const created = await gcalService.createEvent(tokens, {
          calendarId: writeCalendarId,
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          summary: offerTitle,
          attendees: [mentee.email],
          addMeet: true,
        });
        meetUrl = created.meetUrl;
        // Store eventId and meetUrl
        await meetingRepo.update(meeting.id, {
          meetingLink: meetUrl,
          googleEventId: created.eventId,
        } as any);
      } catch (_) {
        // Non-fatal: proceed without Meet link
      }
    }

    // Send booking confirmation email (non-fatal)
    try {
      const mentee = await userRepo.findById(req.userId!);
      await EmailService.sendBookingConfirmation({
        to: mentee.email,
        menteeName: mentee.name,
        mentorName: mentor.name,
        meetingId: meeting.id,
        title: offerTitle,
        scheduledAt: slotStart,
        durationMin,
        dailyRoomUrl,
        meetUrl,
      });
    } catch (err) {
      logger.warn(`[Booking] Confirmation email failed: ${(err as Error).message}`);
    }

    res.status(201).json({
      success: true,
      data: {
        ...meeting,
        meetUrl,
        dailyRoomUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/me
router.get('/bookings/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, startDate, endDate, limit, offset } = req.query as any;
    const meetings = await meetingRepo.list(req.userId!, {
      status,
      startDate,
      endDate,
      limit: Number(limit) || 20,
      offset: Number(offset) || 0,
    });
    res.json({ success: true, data: { meetings } });
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/:id
router.get('/bookings/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meeting = await meetingRepo.findById(req.params.id);
    // Only participants can view
    if (meeting.menteeId !== req.userId && meeting.mentorId !== req.userId) {
      const mentor = await mentorRepo.findById(meeting.mentorId);
      if (mentor.userId !== req.userId) {
        throw new AppError(403, 'FORBIDDEN', 'Access denied');
      }
    }
    res.json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
});

// POST /api/bookings/:id/cancel
router.post('/bookings/:id/cancel', authenticate, requireEmailVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const meeting = await meetingRepo.findById(req.params.id);

    if (!['booked', 'confirmed'].includes(meeting.status)) {
      throw new AppError(400, 'INVALID_STATUS', 'Meeting cannot be cancelled in its current state');
    }

    // Authorization: mentee or mentor's userId
    if (meeting.menteeId !== req.userId) {
      const mentor = await mentorRepo.findById(meeting.mentorId);
      if (mentor.userId !== req.userId) {
        throw new AppError(403, 'FORBIDDEN', 'Access denied');
      }
    }

    const cancelled = await meetingRepo.cancel(req.params.id, req.userId!, reason || 'Cancelled by user');

    // Return credits to mentee
    try {
      await creditRepo.returnHeldCredits(meeting.menteeId, meeting.creditCost, meeting.id);
    } catch (_) {
      // Non-fatal if credits already returned
    }

    // Delete Google Calendar event if present
    const googleEventId = (cancelled as any).googleEventId;
    if (googleEventId) {
      const mentor = await mentorRepo.findById(meeting.mentorId);
      const integration = await integrationRepo.findByUser(mentor.userId, 'google');
      if (integration) {
        const calSettings = await calSettingsRepo.findByUser(mentor.userId, 'google');
        const writeCalendarId = calSettings?.writeCalendarId || 'primary';
        try {
          const tokens = await maybeRefreshTokens(mentor.userId, integration);
          await gcalService.deleteEvent(tokens, { calendarId: writeCalendarId, eventId: googleEventId });
        } catch (_) {}
      }
    }

    res.json({ success: true, data: cancelled });
  } catch (error) {
    next(error);
  }
});

// POST /api/bookings/:id/reschedule
router.post('/bookings/:id/reschedule', authenticate, requireEmailVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scheduledAt } = req.body;
    if (!scheduledAt) {
      throw new AppError(400, 'VALIDATION_ERROR', 'scheduledAt is required');
    }

    const meeting = await meetingRepo.findById(req.params.id);

    if (!['booked', 'confirmed'].includes(meeting.status)) {
      throw new AppError(400, 'INVALID_STATUS', 'Meeting cannot be rescheduled in its current state');
    }

    if (meeting.menteeId !== req.userId) {
      const mentor = await mentorRepo.findById(meeting.mentorId);
      if (mentor.userId !== req.userId) {
        throw new AppError(403, 'FORBIDDEN', 'Access denied');
      }
    }

    const newStart = new Date(scheduledAt);
    const newEnd = new Date(newStart.getTime() + meeting.duration * 60 * 1000);

    const updated = await meetingRepo.update(meeting.id, {
      scheduledAt: newStart.toISOString(),
      status: 'booked',
      rescheduledFrom: meeting.scheduledAt.toISOString(),
      rescheduledAt: new Date().toISOString(),
    } as any);

    // Update Google Calendar event
    const googleEventId = (meeting as any).googleEventId;
    if (googleEventId) {
      const mentor = await mentorRepo.findById(meeting.mentorId);
      const integration = await integrationRepo.findByUser(mentor.userId, 'google');
      if (integration) {
        const calSettings = await calSettingsRepo.findByUser(mentor.userId, 'google');
        const writeCalendarId = calSettings?.writeCalendarId || 'primary';
        try {
          const tokens = await maybeRefreshTokens(mentor.userId, integration);
          await gcalService.updateEvent(tokens, {
            calendarId: writeCalendarId,
            eventId: googleEventId,
            start: newStart.toISOString(),
            end: newEnd.toISOString(),
          });
        } catch (_) {}
      }
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
