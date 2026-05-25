import { logger } from '@owl-mentors/utils';
import { MeetingModel, UserRepository, MentorRepository } from '@owl-mentors/database';
import { EmailService } from '../services/email.service';

const userRepo = new UserRepository();
const mentorRepo = new MentorRepository();

async function sendReminderWindow(params: {
  minAheadMinutes: number;
  maxAheadMinutes: number;
  sentAtField: 'reminderSentAt' | 'reminder24hSentAt';
  reminderLeadHours?: number;
}): Promise<void> {
  const now = Date.now();
  const windowStart = new Date(now + params.minAheadMinutes * 60 * 1000);
  const windowEnd = new Date(now + params.maxAheadMinutes * 60 * 1000);

  const meetings = await MeetingModel.find({
    scheduledAt: { $gte: windowStart, $lte: windowEnd },
    status: { $in: ['booked', 'confirmed'] },
    [params.sentAtField]: { $exists: false },
  });

  if (!meetings.length) return;

  logger.info(`[ReminderJob] Found ${meetings.length} meeting(s) to remind`);

  for (const meeting of meetings) {
    try {
      // Mark as reminded first (prevents duplicate sends if the job overlaps)
      await MeetingModel.findByIdAndUpdate(meeting._id, { $set: { [params.sentAtField]: new Date() } });

      const menteeId = meeting.menteeId.toString();
      const mentorId = meeting.mentorId.toString();

      const [mentee, mentor] = await Promise.all([
        userRepo.findById(menteeId),
        mentorRepo.findById(mentorId),
      ]);

      const mentorUser = await userRepo.findById(mentor.userId);

      const sharedParams = {
        meetingId: meeting._id.toString(),
        title: meeting.title,
        scheduledAt: meeting.scheduledAt,
        durationMin: meeting.duration,
        reminderLeadHours: params.reminderLeadHours,
        mentorName: mentor.name,
        menteeName: mentee.name,
      };

      // Remind mentee
      await EmailService.sendSessionReminder({
        to: mentee.email,
        recipientName: mentee.name,
        ...sharedParams,
      });

      // Remind mentor
      await EmailService.sendSessionReminder({
        to: mentorUser.email,
        recipientName: mentor.name,
        ...sharedParams,
      });

      logger.info(`[ReminderJob] Reminders sent for meeting ${meeting._id}`);
    } catch (err) {
      logger.error(`[ReminderJob] Failed for meeting ${meeting._id}: ${(err as Error).message}`);
      // Unmark reminder field so it can retry next tick
      await MeetingModel.findByIdAndUpdate(meeting._id, { $unset: { [params.sentAtField]: 1 } }).catch(() => {});
    }
  }
}

// Find meetings for 24-hour and 5-minute reminder windows.
async function sendDueReminders(): Promise<void> {
  await sendReminderWindow({
    minAheadMinutes: 24 * 60 - 1,
    maxAheadMinutes: 24 * 60 + 1,
    sentAtField: 'reminder24hSentAt',
    reminderLeadHours: 24,
  });
  await sendReminderWindow({
    minAheadMinutes: 4,
    maxAheadMinutes: 6,
    sentAtField: 'reminderSentAt',
    reminderLeadHours: 0,
  });
}

let intervalHandle: ReturnType<typeof setInterval> | null = null;

export function startReminderJob(): void {
  if (intervalHandle) return;
  logger.info('[ReminderJob] Starting 5-minute reminder job (polling every 60s)');
  // Run immediately on start, then every 60 seconds
  sendDueReminders().catch(err => logger.error('[ReminderJob] Initial run error:', err));
  intervalHandle = setInterval(() => {
    sendDueReminders().catch(err => logger.error('[ReminderJob] Poll error:', err));
  }, 60 * 1000);
}

export function stopReminderJob(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
