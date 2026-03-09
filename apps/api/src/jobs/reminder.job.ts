import { logger } from '@owl-mentors/utils';
import { MeetingModel, UserRepository, MentorRepository } from '@owl-mentors/database';
import { EmailService } from '../services/email.service';

const userRepo = new UserRepository();
const mentorRepo = new MentorRepository();

// Find meetings starting in the 4–6 minute window that haven't been reminded yet
async function sendDueReminders(): Promise<void> {
  const now = Date.now();
  const windowStart = new Date(now + 4 * 60 * 1000); // 4 min from now
  const windowEnd = new Date(now + 6 * 60 * 1000);   // 6 min from now

  const meetings = await MeetingModel.find({
    scheduledAt: { $gte: windowStart, $lte: windowEnd },
    status: { $in: ['booked', 'confirmed'] },
    reminderSentAt: { $exists: false },
  });

  if (!meetings.length) return;

  logger.info(`[ReminderJob] Found ${meetings.length} meeting(s) to remind`);

  for (const meeting of meetings) {
    try {
      // Mark as reminded first (prevents duplicate sends if the job overlaps)
      await MeetingModel.findByIdAndUpdate(meeting._id, { $set: { reminderSentAt: new Date() } });

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
        dailyRoomUrl: meeting.dailyRoomUrl,
        meetUrl: meeting.meetingLink,
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
      // Unmark reminderSentAt so it can retry next tick
      await MeetingModel.findByIdAndUpdate(meeting._id, { $unset: { reminderSentAt: 1 } }).catch(() => {});
    }
  }
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
