import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { logger } from '@owl-mentors/utils';
import { createLLMClient, LLMMessage } from '@owl-mentors/llm';
import {
  MeetingModel,
  MeetingRepository,
  UserRepository,
  MentorRepository,
  TranscriptRepository,
} from '@owl-mentors/database';
import { DailyService } from '../services/daily.service';
import { WhisperService } from '../services/whisper.service';
import { EmailService } from '../services/email.service';
import { StripeService } from '../services/stripe.service';

const router: Router = Router();

const dailyService = new DailyService();
const whisperService = new WhisperService();
const transcriptRepo = new TranscriptRepository();
const meetingRepo = new MeetingRepository();
const userRepo = new UserRepository();
const mentorRepo = new MentorRepository();

interface DailyWebhookPayload {
  action: string;
  room_name?: string;
  recording_id?: string;
  duration?: number;
  [key: string]: unknown;
}

function buildSummaryPrompt(params: {
  transcript: string;
  durationSeconds: number;
  menteeName: string;
  mentorName: string;
}): LLMMessage[] {
  const durationMin = Math.round(params.durationSeconds / 60);
  return [
    {
      role: 'system',
      content: `You are a meeting summarizer. Given a mentoring session transcript, return ONLY valid JSON with this exact structure:
{
  "summary": "<2-4 sentence paragraph summarizing the session>",
  "actionItems": ["<action item 1>", "<action item 2>"],
  "keyTopics": ["<topic 1>", "<topic 2>", "<topic 3>"]
}
No markdown, no code fences, no extra keys — pure JSON only.`,
    },
    {
      role: 'user',
      content: `Mentoring session between mentee "${params.menteeName}" and mentor "${params.mentorName}".
Duration: ${durationMin} minutes.

Transcript:
${params.transcript}

Return the JSON summary now.`,
    },
  ];
}

async function handleDailyEvent(payload: DailyWebhookPayload): Promise<void> {
  if (payload.action !== 'recording.ready') return;

  const recordingId = payload.recording_id;
  const roomName = payload.room_name;

  if (!recordingId || !roomName) {
    logger.warn('[Webhook/Daily] recording.ready missing recording_id or room_name');
    return;
  }

  // Idempotency: skip if already processed
  const existing = await transcriptRepo.findByDailyRecordingId(recordingId);
  if (existing) {
    logger.info(`[Webhook/Daily] Recording ${recordingId} already processed — skipping`);
    return;
  }

  // Look up meeting by Daily room name
  const meetingDoc = await MeetingModel.findOne({ dailyRoomName: roomName });
  if (!meetingDoc) {
    logger.warn(`[Webhook/Daily] No meeting found for room: ${roomName}`);
    return;
  }

  const meetingId = meetingDoc._id.toString();
  const menteeId = meetingDoc.menteeId.toString();
  const mentorId = meetingDoc.mentorId.toString();
  const durationSeconds = payload.duration ?? meetingDoc.duration * 60;

  // Get audio download link
  logger.info(`[Webhook/Daily] Fetching download link for recording ${recordingId}`);
  const audioUrl = await dailyService.getRecordingDownloadLink(recordingId);

  // Transcribe with Whisper
  const rawText = await whisperService.transcribe(audioUrl);

  // Save raw transcript
  const transcript = await transcriptRepo.create({
    meetingId,
    menteeId,
    mentorId,
    dailyRecordingId: recordingId,
    dailyRoomName: roomName,
    rawText,
    durationSeconds: Number(durationSeconds),
  });

  // Load user/mentor details for LLM prompt and email
  const [mentee, mentor] = await Promise.all([
    userRepo.findById(menteeId),
    mentorRepo.findById(mentorId),
  ]);

  // LLM summary
  let summary = '';
  let actionItems: string[] = [];
  let keyTopics: string[] = [];
  let summaryStatus: 'summarized' | 'failed' = 'failed';

  try {
    const llm = createLLMClient();
    const messages = buildSummaryPrompt({
      transcript: rawText,
      durationSeconds: Number(durationSeconds),
      menteeName: mentee.name,
      mentorName: mentor.name,
    });
    const llmResponse = await llm.chat(messages, { temperature: 0.3, maxTokens: 800 });
    const parsed = JSON.parse(llmResponse.content);
    summary = parsed.summary ?? '';
    actionItems = parsed.actionItems ?? [];
    keyTopics = parsed.keyTopics ?? [];
    summaryStatus = 'summarized';
    logger.info(`[Webhook/Daily] LLM summary generated for meeting ${meetingId}`);
  } catch (err) {
    logger.error(`[Webhook/Daily] LLM summary failed for meeting ${meetingId}: ${(err as Error).message}`);
  }

  // Update transcript with summary
  await transcriptRepo.updateSummary(transcript._id.toString(), {
    summary,
    actionItems,
    keyTopics,
    status: summaryStatus,
  });

  // Update meeting: notes + status completed
  await meetingRepo.update(meetingId, { notes: summary, status: 'completed' } as any);

  // Email mentee
  try {
    await EmailService.sendSessionSummary({
      to: mentee.email,
      menteeName: mentee.name,
      mentorName: mentor.name,
      meetingId,
      scheduledAt: meetingDoc.scheduledAt,
      durationSeconds: Number(durationSeconds),
      summary,
      actionItems,
      keyTopics,
    });
  } catch (err) {
    logger.error(`[Webhook/Daily] Email failed for meeting ${meetingId}: ${(err as Error).message}`);
  }

  logger.info(`[Webhook/Daily] Pipeline complete for meeting ${meetingId}`);
}

// POST /api/webhooks/stripe
router.post('/stripe', (req: Request, res: Response) => {
  const rawBody = (req as any).rawBody as string | undefined;
  const signature = req.headers['stripe-signature'] as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!rawBody || !signature) {
    res.status(400).json({ error: 'Missing body or signature' });
    return;
  }

  if (!webhookSecret) {
    logger.warn('[Webhook/Stripe] STRIPE_WEBHOOK_SECRET not set — skipping verification');
    res.status(200).json({ received: true });
    return;
  }

  let event: Stripe.Event;
  try {
    const stripeService = new StripeService();
    event = stripeService.constructWebhookEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    logger.error(`[Webhook/Stripe] Signature verification failed: ${(err as Error).message}`);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  res.status(200).json({ received: true });

  handleStripeEvent(event).catch(err => {
    logger.error(`[Webhook/Stripe] Unhandled error: ${err.message}`, err);
  });
});

async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  if (event.type !== 'payment_intent.succeeded') return;

  const pi = event.data.object as Stripe.PaymentIntent;
  const { mentorId, menteeId, scheduledAt } = pi.metadata ?? {};

  logger.info(
    `[Webhook/Stripe] payment_intent.succeeded: PI=${pi.id} amount=${pi.amount} ` +
    `mentee=${menteeId} mentor=${mentorId} scheduledAt=${scheduledAt}`
  );

  if (!mentorId || !menteeId || !scheduledAt) {
    logger.warn(`[Webhook/Stripe] PI ${pi.id} missing booking metadata — cannot reconcile`);
    return;
  }

  // Check if the booking was already created via the synchronous flow
  const slotStart = new Date(scheduledAt);
  const slotEnd = new Date(slotStart.getTime() + 24 * 60 * 60 * 1000);
  const meetings = await MeetingModel.find({
    mentorId,
    menteeId,
    scheduledAt: { $gte: slotStart, $lte: slotEnd },
  }).lean();

  if (meetings.length > 0) {
    logger.info(`[Webhook/Stripe] PI ${pi.id} → booking already exists (meeting ${meetings[0]._id})`);
  } else {
    logger.warn(
      `[Webhook/Stripe] PI ${pi.id} succeeded but no booking found for mentee=${menteeId} ` +
      `mentor=${mentorId} at ${scheduledAt} — client may have dropped off after payment`
    );
  }
}

// POST /api/webhooks/daily
router.post('/daily', (req: Request, res: Response) => {
  const rawBody = (req as any).rawBody as string | undefined;
  const signature = req.headers['x-daily-signature'] as string | undefined;

  if (!rawBody || !signature) {
    res.status(401).json({ error: 'Missing body or signature' });
    return;
  }

  if (!dailyService.verifyWebhookSignature(rawBody, signature)) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  // Respond immediately, then process asynchronously
  res.status(200).json({ received: true });

  const payload = req.body as DailyWebhookPayload;
  handleDailyEvent(payload).catch(err => {
    logger.error(`[Webhook/Daily] Unhandled error in handleDailyEvent: ${err.message}`, err);
  });
});

export default router;
