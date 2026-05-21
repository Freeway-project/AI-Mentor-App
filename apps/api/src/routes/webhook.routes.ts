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
import { WhisperService } from '../services/whisper.service';
import { EmailService } from '../services/email.service';
import { StripeService } from '../services/stripe.service';
import { serviceUsageService } from '../services/service-usage.service';
import { LiveKitService } from '../services/livekit.service';

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

async function processCompletedRecording(params: {
  meetingId: string;
  mentorId: string;
  menteeId: string;
  recordingId: string;
  audioUrl: string;
  durationSeconds: number;
}): Promise<void> {
  const existing = await transcriptRepo.findByLivekitEgressId(params.recordingId);
  if (existing) {
    logger.info(`[Webhook/LiveKit] Recording ${params.recordingId} already processed — skipping`);
    return;
  }

  const rawText = await whisperService.transcribe(params.audioUrl);

  const transcript = await transcriptRepo.create({
    meetingId: params.meetingId,
    menteeId: params.menteeId,
    mentorId: params.mentorId,
    livekitEgressId: params.recordingId,
    rawText,
    durationSeconds: params.durationSeconds,
  });

  const [mentee, mentor] = await Promise.all([
    userRepo.findById(params.menteeId),
    mentorRepo.findById(params.mentorId),
  ]);

  let summary = '';
  let actionItems: string[] = [];
  let keyTopics: string[] = [];
  let summaryStatus: 'summarized' | 'failed' = 'failed';

  try {
    const llm = createLLMClient();
    const messages = buildSummaryPrompt({
      transcript: rawText,
      durationSeconds: params.durationSeconds,
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
      metadata: { feature: 'session_summary', meetingId: params.meetingId, messageCount: messages.length },
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
      metadata: { feature: 'session_summary', meetingId: params.meetingId },
    });
    logger.error(`[Webhook/LiveKit] LLM summary failed for meeting ${params.meetingId}: ${(err as Error).message}`);
  }

  await transcriptRepo.updateSummary(transcript._id.toString(), {
    summary,
    actionItems,
    keyTopics,
    status: summaryStatus,
  });

  await meetingRepo.update(params.meetingId, { notes: summary, status: 'completed' } as any);

  try {
    await EmailService.sendSessionSummary({
      to: mentee.email,
      menteeName: mentee.name,
      mentorName: mentor.name,
      meetingId: params.meetingId,
      scheduledAt: new Date(),
      durationSeconds: params.durationSeconds,
      summary,
      actionItems,
      keyTopics,
    });

    const mentorUser = await userRepo.findById(mentor.userId);
    await EmailService.sendSessionSummary({
      to: mentorUser.email,
      menteeName: mentee.name,
      mentorName: mentor.name,
      meetingId: params.meetingId,
      scheduledAt: new Date(),
      durationSeconds: params.durationSeconds,
      summary,
      actionItems,
      keyTopics,
    });
  } catch (err) {
    logger.error(`[Webhook/LiveKit] Summary email failed for meeting ${params.meetingId}: ${(err as Error).message}`);
  }
}

async function handleLiveKitEvent(decoded: any): Promise<void> {
  const eventType = decoded?.event || decoded?.eventType;

  if (eventType === 'room_finished') {
    const roomName = decoded?.room?.name;
    if (!roomName) return;
    const meeting = await MeetingModel.findOne({ livekitRoomName: roomName });
    if (!meeting) return;

    if ((meeting as any).livekitEgressId) {
      try {
        await livekitService.stopEgress((meeting as any).livekitEgressId);
      } catch (err) {
        logger.warn(`[Webhook/LiveKit] stopEgress failed: ${(err as Error).message}`);
      }
    }
    return;
  }

  if (eventType !== 'egress_ended') return;

  const egressInfo = decoded?.egressInfo || decoded?.egress_info;
  const egressId = egressInfo?.egressId || egressInfo?.egress_id;
  if (!egressId) return;

  const existing = await transcriptRepo.findByLivekitEgressId(egressId);
  if (existing) return;

  const meeting = await MeetingModel.findOne({
    $or: [
      { livekitEgressId: egressId },
      ...(egressInfo?.roomName ? [{ livekitRoomName: egressInfo.roomName }] : []),
    ],
  });

  if (!meeting) {
    logger.warn(`[Webhook/LiveKit] No meeting found for egress ${egressId}`);
    return;
  }

  const fileResults = egressInfo?.fileResults || egressInfo?.file_results || [];
  const audioOnly = fileResults.find((f: any) => f?.filename?.includes('audio') || f?.filepath?.includes('audio'));
  const candidate = audioOnly || fileResults[0];
  const audioUrl = candidate?.location || candidate?.downloadUrl || candidate?.url;

  if (!audioUrl) {
    logger.warn(`[Webhook/LiveKit] egress_ended missing file URL for ${egressId}`);
    return;
  }

  await processCompletedRecording({
    meetingId: meeting._id.toString(),
    menteeId: meeting.menteeId.toString(),
    mentorId: meeting.mentorId.toString(),
    recordingId: egressId,
    audioUrl,
    durationSeconds: (meeting.duration || 30) * 60,
  });
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
router.post('/livekit', (req: Request, res: Response) => {
  const rawBody = (req as any).rawBody as string | undefined;
  const authHeader = req.headers.authorization as string | undefined;

  if (!rawBody) {
    res.status(400).json({ error: 'Missing body' });
    return;
  }

  let decoded: any;
  try {
    decoded = livekitService.verifyAndDecodeWebhook(rawBody, authHeader);
  } catch (err) {
    logger.error(`[Webhook/LiveKit] Signature verification failed: ${(err as Error).message}`);
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  res.status(200).json({ received: true });

  handleLiveKitEvent(decoded).catch(err => {
    logger.error(`[Webhook/LiveKit] Unhandled error: ${err.message}`, err);
  });
});

export default router;
