import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireEmailVerified } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { GoogleCalendarService } from '../services/google-calendar.service';
import { EmailService } from '../services/email.service';
import { StripeService } from '../services/stripe.service';
import { LiveKitService } from '../services/livekit.service';
import { logger } from '@owl-mentors/utils';
import { generateSlots } from '../services/slot-generator.service';
import { maybeRefreshTokens } from './integrations.routes';
import {
  MentorRepository,
  MeetingRepository,
  PolicyRepository,
  OfferRepository,
  UserRepository,
  UserIntegrationRepository,
  CalendarSettingsRepository,
  TranscriptRepository,
  NotificationRepository,
} from '@owl-mentors/database';

const router: Router = Router();

const mentorRepo = new MentorRepository();
const meetingRepo = new MeetingRepository();
const policyRepo = new PolicyRepository();
const offerRepo = new OfferRepository();
const userRepo = new UserRepository();
const integrationRepo = new UserIntegrationRepository();
const calSettingsRepo = new CalendarSettingsRepository();
const transcriptRepo = new TranscriptRepository();
const notifRepo = new NotificationRepository();
const gcalService = new GoogleCalendarService();
const stripeService = new StripeService();
const livekitService = new LiveKitService();

// GET /api/mentors/:coachId/offers (public — for booking flow)
router.get('/mentors/:coachId/offers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { coachId } = req.params;
    const mentor = await mentorRepo.findById(coachId);
    const offers = await offerRepo.findByMentorId(mentor.id);
    const activeOffers = offers.filter(o => o.isActive);
    logger.info('[Booking] Mentor offers fetched', {
      requestId: req.requestId,
      coachId,
      mentorId: mentor.id,
      activeOffers: activeOffers.length,
    });
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
    logger.info('[Booking] Slot query received', {
      requestId: req.requestId,
      coachId,
      from,
      to,
      durationMin,
    });

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
          logger.warn('[Booking] Google busy time lookup failed', {
            requestId: req.requestId,
            coachId,
            mentorUserId: mentor.userId,
          });
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
    logger.info('[Booking] Slot query completed', {
      requestId: req.requestId,
      coachId,
      durationMin,
      existingBookings: existingBookings.length,
      busyTimes: busyTimes.length,
      slots: slots.length,
    });

    res.json({ success: true, data: { slots } });
  } catch (error) {
    next(error);
  }
});

// POST /api/bookings — create booking
router.post('/bookings', authenticate, requireEmailVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mentorId, offerId, scheduledAt, duration, title, description, paymentIntentId, calBookingUid } = req.body;

    if (!mentorId || !scheduledAt) {
      throw new AppError(400, 'VALIDATION_ERROR', 'mentorId and scheduledAt are required');
    }
    logger.info('[Booking] Booking create started', {
      requestId: req.requestId,
      userId: req.userId,
      mentorId,
      offerId,
      scheduledAt,
      hasPaymentIntent: Boolean(paymentIntentId),
      hasCalBookingUid: Boolean(calBookingUid),
    });

    const durationMin = Number(duration) || 30;
    const slotStart = new Date(scheduledAt);
    const slotEnd = new Date(slotStart.getTime() + durationMin * 60 * 1000);

    if (isNaN(slotStart.getTime())) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid scheduledAt');
    }

    // Load mentor
    const mentor = await mentorRepo.findById(mentorId);

    // Load offer if provided
    const fallbackRate = mentor.hourlyRate ?? 50;
    let sessionPriceUsd = durationMin <= 30 ? fallbackRate / 2 : fallbackRate;
    let offerTitle = title || 'Mentoring Session';
    if (offerId) {
      try {
        const offer = await offerRepo.findById(offerId);
        if (offer.mentorId !== mentorId) {
          throw new AppError(400, 'INVALID_OFFER', 'Offer does not belong to this mentor');
        }
        sessionPriceUsd = offer.price;
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
      logger.warn('[Booking] Slot conflict detected', {
        requestId: req.requestId,
        userId: req.userId,
        mentorId,
        scheduledAt: slotStart.toISOString(),
        durationMin,
      });
      throw new AppError(409, 'SLOT_UNAVAILABLE', 'This time slot is no longer available');
    }

    // Fetch mentee early (used for menteeName on meeting + emails below)
    const mentee = await userRepo.findById(req.userId!);

    // Payment verification — Stripe required
    if (!paymentIntentId) {
      throw new AppError(402, 'PAYMENT_REQUIRED', 'A Stripe payment is required to book a session');
    }
    const pi = await stripeService.retrievePaymentIntent(paymentIntentId);
    if (pi.status !== 'succeeded') {
      throw new AppError(402, 'PAYMENT_NOT_CONFIRMED', 'Stripe payment has not been completed');
    }
    const expectedCents = Math.round(sessionPriceUsd * 100);
    if (pi.amount !== expectedCents) {
      throw new AppError(400, 'PAYMENT_AMOUNT_MISMATCH', 'Payment amount does not match session price');
    }
    const amountPaid = pi.amount / 100;
    logger.info('[Booking] Stripe payment verified', {
      requestId: req.requestId,
      userId: req.userId,
      mentorId,
      paymentIntentId,
      amountPaid,
    });

    // Create meeting
    const meeting = await meetingRepo.create(req.userId!, {
      mentorId,
      title: offerTitle,
      description: description || '',
      scheduledAt: slotStart.toISOString(),
      duration: durationMin,
      offerId,
      paymentIntentId,
      amountPaid,
      menteeName: mentee.name,
      calBookingUid: calBookingUid || undefined,
    });

    // Create/store LiveKit room metadata for this meeting.
    const roomName = livekitService.createRoomName(meeting.id);
    await meetingRepo.update(meeting.id, { livekitRoomName: roomName } as any);

    // Try to create Google Calendar event
    let meetUrl: string | undefined;
    const integration = await integrationRepo.findByUser(mentor.userId, 'google');
    if (integration) {
      const calSettings = await calSettingsRepo.findByUser(mentor.userId, 'google');
      const writeCalendarId = calSettings?.writeCalendarId || 'primary';
      try {
        const tokens = await maybeRefreshTokens(mentor.userId, integration);
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

    // Send booking confirmation emails to mentee and mentor (non-fatal)
    try {
      const mentorUser = await userRepo.findById(mentor.userId);
      const sharedEmailParams = {
        menteeName: mentee.name,
        mentorName: mentor.name,
        meetingId: meeting.id,
        title: offerTitle,
        scheduledAt: slotStart,
        durationMin,
        meetUrl,
      };
      await Promise.all([
        EmailService.sendBookingConfirmation({ to: mentee.email, ...sharedEmailParams }),
        EmailService.sendBookingConfirmation({
          to: mentorUser.email,
          ...sharedEmailParams,
          dashboardPath: '/mentor/dashboard',
        }),
      ]);
    } catch (err) {
      logger.warn(`[Booking] Confirmation email failed: ${(err as Error).message}`);
    }

    // In-app notifications (non-fatal)
    try {
      const dateStr = slotStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      await Promise.all([
        notifRepo.create({ userId: req.userId!, type: 'meeting_confirmed', channel: 'in_app', title: 'Session booked!', message: `${offerTitle} on ${dateStr}`, scheduledAt: new Date().toISOString() } as any),
        notifRepo.create({ userId: mentor.userId, type: 'meeting_confirmed', channel: 'in_app', title: 'New session booked', message: `${mentee.name} booked ${offerTitle}`, scheduledAt: new Date().toISOString() } as any),
      ]);
    } catch (err) {
      logger.warn(`[Booking] In-app notification failed: ${(err as Error).message}`);
    }

    res.status(201).json({
      success: true,
      data: {
        ...meeting,
        meetUrl,
        livekitRoomName: roomName,
      },
    });
    logger.info('[Booking] Booking create completed', {
      requestId: req.requestId,
      userId: req.userId,
      mentorId,
      meetingId: meeting.id,
      durationMin,
      amountPaid,
      hasMeetUrl: Boolean(meetUrl),
      hasLiveKitRoom: Boolean(roomName),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/me
router.get('/bookings/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, startDate, endDate, limit, offset } = req.query as any;
    const mentorProfile = await mentorRepo.findByUserId(req.userId!);
    const meetings = await meetingRepo.list(req.userId!, {
      status,
      startDate,
      endDate,
      limit: Number(limit) || 20,
      offset: Number(offset) || 0,
      mentorProfileId: mentorProfile?.id,
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

// GET /api/bookings/:id/token — generate LiveKit JWT for joining the session room
router.get('/bookings/:id/token', authenticate, requireEmailVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meeting = await meetingRepo.findById(req.params.id);

    const isMentee = meeting.menteeId === req.userId;
    let isMentor = meeting.mentorId === req.userId;
    if (!isMentor) {
      const mentor = await mentorRepo.findById(meeting.mentorId);
      isMentor = mentor.userId === req.userId;
    }
    if (!isMentee && !isMentor) {
      throw new AppError(403, 'FORBIDDEN', 'You are not a participant of this session');
    }

    const roomName = (meeting as any).livekitRoomName || livekitService.createRoomName(meeting.id);
    if (!(meeting as any).livekitRoomName) {
      await meetingRepo.update(meeting.id, { livekitRoomName: roomName } as any);
    }

    const user = await userRepo.findById(req.userId!);
    const token = livekitService.generateToken({
      roomName,
      participantIdentity: req.userId!,
      participantName: user.name || 'Participant',
      isHost: isMentor,
    });

    res.json({
      success: true,
      data: {
        token,
        serverUrl: livekitService.getServerUrl(),
        roomName,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/:id/transcript
router.get('/bookings/:id/transcript', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meeting = await meetingRepo.findById(req.params.id);
    // Only participants can view
    if (meeting.menteeId !== req.userId && meeting.mentorId !== req.userId) {
      const mentor = await mentorRepo.findById(meeting.mentorId);
      if (mentor.userId !== req.userId) {
        throw new AppError(403, 'FORBIDDEN', 'Access denied');
      }
    }
    const transcript = await transcriptRepo.findByMeetingId(req.params.id);
    if (!transcript) {
      throw new AppError(404, 'NOT_FOUND', 'Transcript not available yet');
    }
    res.json({
      success: true,
      data: {
        summary: transcript.summary,
        actionItems: transcript.actionItems,
        keyTopics: transcript.keyTopics,
        status: transcript.status,
        durationSeconds: transcript.durationSeconds,
      },
    });
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
    logger.info('[Booking] Booking cancelled', {
      requestId: req.requestId,
      meetingId: req.params.id,
      actorUserId: req.userId,
      reason: reason || 'Cancelled by user',
    });

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
        } catch (_) {
          logger.warn('[Booking] Google Calendar delete failed during cancellation', {
            requestId: req.requestId,
            meetingId: req.params.id,
            googleEventId,
          });
        }
      }
    }

    // In-app notification for the other party (non-fatal)
    try {
      const isMentee = meeting.menteeId === req.userId;
      const mentor = isMentee ? await mentorRepo.findById(meeting.mentorId) : null;
      const otherUserId = isMentee ? mentor!.userId : meeting.menteeId;
      await notifRepo.create({ userId: otherUserId, type: 'meeting_cancelled', channel: 'in_app', title: 'Session cancelled', message: `${meeting.title} was cancelled`, scheduledAt: new Date().toISOString() } as any);
    } catch (err) {
      logger.warn(`[Booking] Cancellation in-app notification failed: ${(err as Error).message}`);
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
    logger.info('[Booking] Booking rescheduled', {
      requestId: req.requestId,
      meetingId: req.params.id,
      actorUserId: req.userId,
      previousStart: meeting.scheduledAt,
      newStart: newStart.toISOString(),
    });

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
        } catch (_) {
          logger.warn('[Booking] Google Calendar update failed during reschedule', {
            requestId: req.requestId,
            meetingId: req.params.id,
            googleEventId,
          });
        }
      }
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// POST /api/bookings/:id/review
router.post('/bookings/:id/review', authenticate, requireEmailVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rating, review } = req.body;

    if (!rating || typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new AppError(400, 'VALIDATION_ERROR', 'rating must be an integer between 1 and 5');
    }

    const meeting = await meetingRepo.findById(req.params.id);

    if (meeting.status !== 'completed') {
      throw new AppError(400, 'INVALID_STATUS', 'Only completed sessions can be reviewed');
    }
    if (meeting.menteeId !== req.userId) {
      throw new AppError(403, 'FORBIDDEN', 'Only the mentee can leave a review');
    }
    if (meeting.rating != null) {
      throw new AppError(409, 'ALREADY_REVIEWED', 'This session has already been reviewed');
    }

    const rated = await meetingRepo.rate(req.params.id, rating, review || undefined);

    // Recompute mentor aggregate rating
    const ratingStats = await meetingRepo.getAverageRatingForMentor(meeting.mentorId);
    if (ratingStats) {
      await mentorRepo.updateRating(meeting.mentorId, Math.round(ratingStats.avg * 10) / 10, ratingStats.count);
    }

    logger.info('[Booking] Session rated', {
      requestId: req.requestId,
      meetingId: req.params.id,
      userId: req.userId,
      rating,
    });

    // Notify mentor (non-fatal)
    try {
      const mentor = await mentorRepo.findById(meeting.mentorId);
      await notifRepo.create({ userId: mentor.userId, type: 'review_request', channel: 'in_app', title: 'New review received', message: `You received a ${rating}-star review for ${meeting.title}`, scheduledAt: new Date().toISOString() } as any);
    } catch (_) {}

    res.json({ success: true, data: rated });
  } catch (error) {
    next(error);
  }
});

export default router;
