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
import type { WebhookEvent } from 'livekit-server-sdk';
import { EgressStatus } from 'livekit-server-sdk';
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

// Converts "s3://bucket/key" → "http://minio:9000/bucket/key"
// The API container and MinIO share a Docker network, so a direct HTTP fetch works
// without needing pre-signed URLs or AWS SDK credentials.
function s3LocationToHttpUrl(location: string): string {
  const endpoint = (process.env.AWS_S3_ENDPOINT ?? '').replace(/\/$/, '');
  if (!endpoint || !location.startsWith('s3://')) return location;
  const withoutProtocol = location.slice('s3://'.length); // "bucket/key"
  return `${endpoint}/${withoutProtocol}`;
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

async function handleLiveKitEvent(event: WebhookEvent): Promise<void> {
  const eventType = event.event;

  if (eventType === 'room_started') {
    const roomName = event.room?.name ?? '';
    if (!roomName) return;

    const meetingDoc = await MeetingModel.findOne({ livekitRoomName: roomName });
    if (!meetingDoc) return;

    const meetingId = meetingDoc._id.toString();
    await meetingRepo.updateStatus(meetingId, 'in_progress');
    logger.info(`[Webhook/LiveKit] Meeting ${meetingId} marked in_progress`);

    // Start egress (non-fatal — session continues even if recording fails)
    try {
      const egressId = await livekitService.startEgress(roomName, meetingId);
      if (egressId) {
        await meetingRepo.update(meetingId, { livekitEgressId: egressId } as any);
        logger.info(`[Webhook/LiveKit] Egress ${egressId} started for meeting ${meetingId}`);
      }
    } catch (err) {
      logger.warn(`[Webhook/LiveKit] Egress start failed for ${meetingId}: ${(err as Error).message}`);
    }
    return;
  }

  if (eventType === 'egress_ended') {
    const egressInfo = event.egressInfo;
    const egressId = egressInfo?.egressId ?? '';
    const roomName = egressInfo?.roomName ?? '';

    if (!egressId || egressInfo?.status !== EgressStatus.EGRESS_COMPLETE) {
      logger.warn(`[Webhook/LiveKit] Egress ${egressId} ended with status ${egressInfo?.status} — skipping`);
      return;
    }

    // Idempotency
    const existing = await transcriptRepo.findByLivekitEgressId(egressId);
    if (existing) {
      logger.info(`[Webhook/LiveKit] Egress ${egressId} already processed — skipping`);
      return;
    }

    const meetingDoc = await MeetingModel.findOne({ livekitRoomName: roomName });
    if (!meetingDoc) {
      logger.warn(`[Webhook/LiveKit] No meeting found for room: ${roomName}`);
      return;
    }

    const meetingId = meetingDoc._id.toString();
    const menteeId = meetingDoc.menteeId.toString();
    const mentorId = meetingDoc.mentorId.toString();

    const fileResult = egressInfo.fileResults[0];
    const rawLocation: string = fileResult?.location ?? '';
    if (!rawLocation) {
      logger.warn(`[Webhook/LiveKit] No file location in egress ${egressId}`);
      return;
    }
    const audioUrl = s3LocationToHttpUrl(rawLocation);

    // FileInfo.duration is int64/bigint nanoseconds; fall back to endedAt-startedAt, then meeting.duration
    const durationNs: bigint = fileResult?.duration
      || (egressInfo.endedAt > 0n ? egressInfo.endedAt - egressInfo.startedAt : 0n);
    const durationSeconds: number = durationNs > 0n
      ? Number(durationNs) / 1_000_000_000
      : meetingDoc.duration * 60;

    // Transcribe
    let rawText = '';
    try {
      rawText = await whisperService.transcribe(audioUrl);
    } catch (err) {
      logger.error(`[Webhook/LiveKit] Whisper failed for ${meetingId}: ${(err as Error).message}`);
      return;
    }

    const transcript = await transcriptRepo.create({
      meetingId,
      menteeId,
      mentorId,
      livekitEgressId: egressId,
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
      const llmStartTime = Date.now();
      const llmResponse = await llm.chat(messages, { temperature: 0.3, maxTokens: 800 });
      await serviceUsageService.recordSuccess({
        service: 'llm',
        provider: llmResponse.provider,
        operation: 'chat_completion',
        model: llmResponse.model,
        usageCount: 1,
        durationMs: Date.now() - llmStartTime,
        promptTokens: llmResponse.tokens?.prompt,
        completionTokens: llmResponse.tokens?.completion,
        totalTokens: llmResponse.tokens?.total,
        metadata: { feature: 'session_summary', meetingId, messageCount: messages.length },
      });
      const parsed = JSON.parse(llmResponse.content);
      summary = parsed.summary ?? '';
      actionItems = parsed.actionItems ?? [];
      keyTopics = parsed.keyTopics ?? [];
      summaryStatus = 'summarized';
      logger.info(`[Webhook/LiveKit] LLM summary generated for meeting ${meetingId}`);
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

    await meetingRepo.update(meetingId, { notes: summary, status: 'completed' } as any);

    try {
      await EmailService.sendSessionSummary({
        to: mentee.email,
        menteeName: mentee.name,
        mentorName: mentor.name,
        meetingId,
        scheduledAt: meetingDoc.scheduledAt,
        durationSeconds,
        summary, actionItems, keyTopics,
      });
    } catch (err) {
      logger.error(`[Webhook/LiveKit] Mentee email failed for ${meetingId}: ${(err as Error).message}`);
    }

    try {
      const mentorUser = await userRepo.findById(mentor.userId);
      await EmailService.sendSessionSummary({
        to: mentorUser.email,
        menteeName: mentee.name,
        mentorName: mentor.name,
        meetingId,
        scheduledAt: meetingDoc.scheduledAt,
        durationSeconds,
        summary, actionItems, keyTopics,
      });
    } catch (err) {
      logger.error(`[Webhook/LiveKit] Mentor email failed for ${meetingId}: ${(err as Error).message}`);
    }

    logger.info(`[Webhook/LiveKit] Pipeline complete for meeting ${meetingId}`);
  }
}

// POST /api/webhooks/livekit
router.post('/livekit', (req: Request, res: Response) => {
  const rawBody = (req as any).rawBody as string | undefined;
  const authHeader = req.headers['authorization'] as string | undefined;

  if (!rawBody) {
    res.status(400).json({ error: 'Missing body' });
    return;
  }

  res.status(200).json({ received: true });

  livekitService.verifyWebhook(rawBody, authHeader)
    .then(event => handleLiveKitEvent(event))
    .catch(err => {
      logger.error(`[Webhook/LiveKit] Verify/handle failed: ${err.message}`);
    });
});

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

  const slotStart = new Date(scheduledAt);
  const slotEnd = new Date(slotStart.getTime() + 24 * 60 * 60 * 1000);
  const meetings = await MeetingModel.find({
    mentorId, menteeId,
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

export default router;
