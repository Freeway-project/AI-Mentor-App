import { logger } from '@owl-mentors/utils';
import { MeetingModel, UserRepository, MentorRepository } from '@owl-mentors/database';
import { EmailService } from '../services/email.service';

const userRepo = new UserRepository();
const mentorRepo = new MentorRepository();

type WindowKind = '1d' | '30m';

// One window per reminder kind. The poll cadence (60s) is small enough that any
// meeting that crosses the lead-time mark inside one poll interval will be found.
const WINDOWS: Record<WindowKind, { leadMs: number; widthMs: number; flag: string }> = {
  '1d':  { leadMs: 24 * 60 * 60 * 1000, widthMs: 5 * 60 * 1000, flag: 'reminder1dSentAt' },
  '30m': { leadMs: 30 * 60 * 1000,      widthMs: 5 * 60 * 1000, flag: 'reminder30mSentAt' },
};

async function sendDueReminders(kind: WindowKind): Promise<void> {
  const { leadMs, widthMs, flag } = WINDOWS[kind];
  const center = Date.now() + leadMs;
  const windowStart = new Date(center - widthMs / 2);
  const windowEnd = new Date(center + widthMs / 2);

  const meetings = await MeetingModel.find({
    scheduledAt: { $gte: windowStart, $lte: windowEnd },
    status: { $in: ['booked', 'confirmed'] },
    [flag]: { $exists: false },
  });

  if (!meetings.length) return;

  logger.info(`[ReminderJob] Found ${meetings.length} meeting(s) for ${kind} reminder`);

  for (const meeting of meetings) {
    try {
      // Mark first to avoid duplicate sends if polls overlap.
      await MeetingModel.findByIdAndUpdate(meeting._id, { $set: { [flag]: new Date() } });

      const [mentee, mentor] = await Promise.all([
        userRepo.findById(meeting.menteeId.toString()),
        mentorRepo.findById(meeting.mentorId.toString()),
      ]);
      const mentorUser = await userRepo.findById(mentor.userId);

      const meetingId = meeting._id.toString();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://owlmentors.com';
      const meetingLink = meeting.meetingLink || `${appUrl}/video/${meetingId}`;

      const sharedParams = {
        meetingId,
        title: meeting.title,
        scheduledAt: meeting.scheduledAt,
        durationMin: meeting.duration,
        dailyRoomUrl: meeting.dailyRoomUrl,
        meetUrl: meetingLink,
        mentorName: mentor.name,
        menteeName: mentee.name,
        leadLabel: kind === '1d' ? 'tomorrow' : 'in 30 minutes',
      } as const;

      await EmailService.sendSessionReminder({ to: mentee.email, recipientName: mentee.name, ...sharedParams });
      await EmailService.sendSessionReminder({ to: mentorUser.email, recipientName: mentor.name, ...sharedParams });

      logger.info(`[ReminderJob] ${kind} reminders sent for meeting ${meetingId}`);
    } catch (err) {
      logger.error(`[ReminderJob] ${kind} failed for meeting ${meeting._id}: ${(err as Error).message}`);
      await MeetingModel.findByIdAndUpdate(meeting._id, { $unset: { [flag]: 1 } }).catch(() => {});
    }
  }
}

let intervalHandle: ReturnType<typeof setInterval> | null = null;

export function startReminderJob(): void {
  if (intervalHandle) return;
  logger.info('[ReminderJob] Starting reminders (1d and 30m, polling every 60s)');
  const tick = async () => {
    await sendDueReminders('1d').catch(err => logger.error('[ReminderJob] 1d error:', err));
    await sendDueReminders('30m').catch(err => logger.error('[ReminderJob] 30m error:', err));
  };
  tick();
  intervalHandle = setInterval(tick, 60 * 1000);
}

export function stopReminderJob(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
