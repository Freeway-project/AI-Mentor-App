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
import { LiveKitService } from '../services/livekit.service';
import { WhisperService } from '../services/whisper.service';
import { EmailService } from '../services/email.service';
import { StripeService } from '../services/stripe.service';
import { serviceUsageService } from '../services/service-usage.service';

const router: Router = Router();

const livekitService = new LiveKitService();
const whisperService = new WhisperService();
const transcriptRepo = new TranscriptRepository();
const meetingRepo = new MeetingRepository();
const userRepo = new UserRepository();
const mentorRepo = new MentorRepository();

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

// POST /api/webhooks/livekit
router.post('/livekit', async (req: Request, res: Response) => {
  const rawBody = (req as any).rawBody as string | undefined;
  const authHeader = req.headers['authorization'] as string | undefined;

  if (!rawBody) {
    res.status(400).json({ error: 'Missing body' });
    return;
  }

  let event: any;
  try {
    event = await livekitService.verifyWebhook(rawBody, authHeader ?? '');
  } catch (err) {
    logger.error(`[Webhook/LiveKit] Signature verification failed: ${(err as Error).message}`);
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  res.status(200).json({ received: true });

  handleLiveKitEvent(event).catch(err => {
    logger.error(`[Webhook/LiveKit] Unhandled error: ${err.message}`, err);
  });
});

async function handleLiveKitEvent(event: any): Promise<void> {
  const eventType: string = event.event;
  logger.info(`[Webhook/LiveKit] Event received: ${eventType}`);

  // Room started → mark session in_progress + start egress recording
  if (eventType === 'room_started') {
    const roomName: string = event.room?.name ?? '';
    if (!roomName) return;
    const meetingDoc = await MeetingModel.findOne({ livekitRoomName: roomName });
    if (meetingDoc) {
      const meetingId = meetingDoc._id.toString();
      await meetingRepo.updateStatus(meetingId, 'in_progress');
      logger.info(`[Webhook/LiveKit] Meeting ${meetingId} marked in_progress`);

      // Start egress now that participants are present (non-fatal)
      try {
        const egressId = await livekitService.startEgress(roomName, meetingId);
        if (egressId) {
          await meetingRepo.update(meetingId, { livekitEgressId: egressId } as any);
          logger.info(`[Webhook/LiveKit] Egress ${egressId} started for meeting ${meetingId}`);
        }
      } catch (err) {
        logger.warn(`[Webhook/LiveKit] Egress start failed for ${meetingId}: ${(err as Error).message}`);
      }
    }
    return;
  }

  // Egress ended → download audio → transcribe → summarize → email
  if (eventType === 'egress_ended') {
    const egressId: string = event.egressInfo?.egressId ?? '';
    const roomName: string = event.egressInfo?.roomName ?? '';
    const status: string = event.egressInfo?.status ?? '';

    if (!egressId || status !== 'EGRESS_COMPLETE') {
      logger.warn(`[Webhook/LiveKit] Egress ${egressId} ended with status ${status} — skipping`);
      return;
    }

    // Idempotency
    const existing = await transcriptRepo.findByLivekitEgressId(egressId);
    if (existing) {
      logger.info(`[Webhook/LiveKit] Egress ${egressId} already processed — skipping`);
      return;
    }

    // Look up meeting
    const meetingDoc = await MeetingModel.findOne({ livekitRoomName: roomName });
    if (!meetingDoc) {
      logger.warn(`[Webhook/LiveKit] No meeting found for room: ${roomName}`);
      return;
    }

    const meetingId = meetingDoc._id.toString();
    const menteeId = meetingDoc.menteeId.toString();
    const mentorId = meetingDoc.mentorId.toString();

    // Get audio download URL from egress file results
    const fileResults: any[] = event.egressInfo?.fileResults ?? [];
    const audioUrl: string =
      fileResults[0]?.downloadUrl ??
      fileResults[0]?.location ??
      event.egressInfo?.file?.location ??
      '';
    if (!audioUrl) {
      logger.warn(`[Webhook/LiveKit] No download URL in egress ${egressId}`);
      return;
    }

    const durationSeconds: number = event.egressInfo?.duration
      ? Number(event.egressInfo.duration) / 1_000_000_000  // nanoseconds → seconds
      : meetingDoc.duration * 60;

    // Transcribe
    let rawText = '';
    try {
      rawText = await whisperService.transcribe(audioUrl);
    } catch (err) {
      logger.error(`[Webhook/LiveKit] Whisper transcription failed for ${meetingId}: ${(err as Error).message}`);
      return;
    }

    // Save raw transcript
    const transcript = await transcriptRepo.create({
      meetingId,
      menteeId,
      mentorId,
      livekitEgressId: egressId,
      livekitRoomName: roomName,
      rawText,
      durationSeconds,
    });

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
        durationSeconds,
        menteeName: mentee.name,
        mentorName: mentor.name,
      });
      const llmStart = Date.now();
      const llmResponse = await llm.chat(messages, { temperature: 0.3, maxTokens: 800 });
      await serviceUsageService.recordSuccess({
        service: 'llm',
        provider: llmResponse.provider,
        operation: 'chat_completion',
        model: llmResponse.model,
        usageCount: 1,
        durationMs: Date.now() - llmStart,
        promptTokens: llmResponse.tokens?.prompt,
        completionTokens: llmResponse.tokens?.completion,
        totalTokens: llmResponse.tokens?.total,
        metadata: { feature: 'session_summary', meetingId },
      });
      const parsed = JSON.parse(llmResponse.content);
      summary = parsed.summary ?? '';
      actionItems = parsed.actionItems ?? [];
      keyTopics = parsed.keyTopics ?? [];
      summaryStatus = 'summarized';
    } catch (err) {
      await serviceUsageService.recordFailure({
        service: 'llm',
        provider: process.env.LLM_PROVIDER || 'openrouter',
        operation: 'chat_completion',
        usageCount: 1,
        errorMessage: (err as Error).message,
        metadata: { feature: 'session_summary', meetingId },
      });
      logger.error(`[Webhook/LiveKit] LLM summary failed for ${meetingId}: ${(err as Error).message}`);
    }

    await transcriptRepo.updateSummary(transcript._id.toString(), {
      summary, actionItems, keyTopics, status: summaryStatus,
    });
    await meetingRepo.update(meetingId, {
      notes: summary,
      status: 'completed',
      livekitEgressId: egressId,
    } as any);

    // Email both parties
    const emailParams = {
      menteeName: mentee.name,
      mentorName: mentor.name,
      meetingId,
      scheduledAt: meetingDoc.scheduledAt,
      durationSeconds,
      summary,
      actionItems,
      keyTopics,
    };
    try {
      await EmailService.sendSessionSummary({ to: mentee.email, ...emailParams });
    } catch (err) {
      logger.error(`[Webhook/LiveKit] Mentee email failed: ${(err as Error).message}`);
    }
    try {
      const mentorUser = await userRepo.findById(mentor.userId);
      await EmailService.sendSessionSummary({ to: mentorUser.email, ...emailParams });
    } catch (err) {
      logger.error(`[Webhook/LiveKit] Mentor email failed: ${(err as Error).message}`);
    }

    logger.info(`[Webhook/LiveKit] Pipeline complete for meeting ${meetingId}`);
  }
}

export default router;
