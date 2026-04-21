import nodemailer from 'nodemailer';
import { logger } from '@owl-mentors/utils';
import { serviceUsageService } from './service-usage.service';

let _devTransport: nodemailer.Transporter | null = null;

async function getDevTransport(): Promise<nodemailer.Transporter> {
  if (_devTransport) return _devTransport;
  const testAccount = await nodemailer.createTestAccount();
  _devTransport = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  logger.info(`[EMAIL DEV] Ethereal SMTP ready — preview emails at https://ethereal.email/messages`);
  logger.info(`[EMAIL DEV] Login: ${testAccount.user} / ${testAccount.pass}`);
  return _devTransport;
}

function createTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

function getRecipientCount(to: nodemailer.SendMailOptions['to']): number {
  if (!to) return 1;
  if (Array.isArray(to)) return to.length || 1;
  if (typeof to === 'string') return to.split(',').map(value => value.trim()).filter(Boolean).length || 1;
  return 1;
}

async function sendTrackedMail(params: {
  transport: nodemailer.Transporter;
  provider: 'smtp' | 'ethereal';
  operation: string;
  mailOptions: nodemailer.SendMailOptions;
  metadata?: Record<string, unknown>;
}) {
  const startTime = Date.now();

  try {
    const info = await params.transport.sendMail(params.mailOptions);
    await serviceUsageService.recordSuccess({
      service: 'email',
      provider: params.provider,
      operation: params.operation,
      usageCount: getRecipientCount(params.mailOptions.to),
      durationMs: Date.now() - startTime,
      metadata: params.metadata,
    });
    return info;
  } catch (error) {
    await serviceUsageService.recordFailure({
      service: 'email',
      provider: params.provider,
      operation: params.operation,
      usageCount: getRecipientCount(params.mailOptions.to),
      durationMs: Date.now() - startTime,
      errorMessage: (error as Error).message,
      metadata: params.metadata,
    });
    throw error;
  }
}

async function recordEmailFallbackFailure(operation: string, errorMessage: string, metadata?: Record<string, unknown>) {
  await serviceUsageService.recordFailure({
    service: 'email',
    provider: 'fallback',
    operation,
    usageCount: 1,
    errorMessage,
    metadata,
  });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const EmailService = {
  async sendOtp(to: string, code: string): Promise<void> {
    const fromName = process.env.SMTP_FROM_NAME || 'Owl Mentors';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@owlmentors.com';
    const from = `${fromName} <${fromEmail}>`;
    const subject = 'Your Owl Mentors verification code';
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
        <h2 style="color:#1e40af;font-size:24px;margin-bottom:8px">Verify your email</h2>
        <p style="color:#475569;margin-bottom:24px">
          Enter the 6-digit code below to verify your Owl Mentors account.
          This code expires in <strong>10 minutes</strong>.
        </p>
        <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;letter-spacing:12px;font-size:36px;font-weight:700;color:#0f172a">
          ${code}
        </div>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `;

    // Try real SMTP first
    const transport = createTransport();
    if (transport) {
      try {
        await sendTrackedMail({
          transport,
          provider: 'smtp',
          operation: 'send_otp',
          mailOptions: { from, to, subject, html },
          metadata: { emailType: 'otp' },
        });
        logger.info(`[OTP EMAIL] Sent to ${to}`);
        return;
      } catch (error) {
        logger.error(`[OTP EMAIL] SMTP failed to ${to}: ${(error as Error).message}`);
        logger.warn(`[OTP EMAIL] Falling back to Ethereal dev transport...`);
      }
    }

    // Fallback: Ethereal (dev only — captures email, viewable in browser)
    try {
      const devTransport = await getDevTransport();
      const info = await sendTrackedMail({
        transport: devTransport,
        provider: 'ethereal',
        operation: 'send_otp',
        mailOptions: { from, to, subject, html },
        metadata: { emailType: 'otp' },
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logger.info(`[OTP EMAIL DEV] Code: ${code} | Preview: ${previewUrl}`);
    } catch (err) {
      // Last resort — just log the code
      await recordEmailFallbackFailure('send_otp', 'Logged OTP fallback only', { emailType: 'otp' });
      logger.warn(`[OTP EMAIL FALLBACK] To: ${to} | Code: ${code} | Expires: 10 min`);
    }
  },


  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const fromName = process.env.SMTP_FROM_NAME || 'OWL Mentor';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@owlmentor.com';
    const from = `${fromName} <${fromEmail}>`;
    const subject = 'Reset your OWL Mentor password';
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
        <h2 style="color:#1e40af;font-size:24px;margin-bottom:8px">Reset your password</h2>
        <p style="color:#475569;margin-bottom:24px">
          Click the button below to reset your OWL Mentor password.
          This link expires in <strong>1 hour</strong>.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Reset password →
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `;

    // Try real SMTP first
    const transport = createTransport();
    if (transport) {
      try {
        await sendTrackedMail({
          transport,
          provider: 'smtp',
          operation: 'send_password_reset',
          mailOptions: { from, to, subject, html },
          metadata: { emailType: 'password_reset' },
        });
        logger.info(`[RESET EMAIL] Sent to ${to}`);
        return;
      } catch (error) {
        logger.error(`[RESET EMAIL] SMTP failed to ${to}: ${(error as Error).message}`);
        logger.warn(`[RESET EMAIL] Falling back to Ethereal dev transport...`);
      }
    }

    // Fallback: Ethereal (dev only)
    try {
      const devTransport = await getDevTransport();
      const info = await sendTrackedMail({
        transport: devTransport,
        provider: 'ethereal',
        operation: 'send_password_reset',
        mailOptions: { from, to, subject, html },
        metadata: { emailType: 'password_reset' },
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logger.info(`[RESET EMAIL DEV] Preview: ${previewUrl}`);
    } catch (err) {
      // Last resort — just log the reset URL
      await recordEmailFallbackFailure('send_password_reset', 'Logged password reset fallback only', {
        emailType: 'password_reset',
      });
      logger.warn(`[RESET EMAIL FALLBACK] To: ${to} | URL: ${resetUrl}`);
    }
  },

  async notifyAdminProfileComplete(mentor: { name: string; email: string; mentorId: string }): Promise<void> {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!adminEmail) {
      logger.info(`[ADMIN NOTIFY] Mentor profile complete: ${mentor.name} <${mentor.email}>`);
      return;
    }

    const fromName = process.env.SMTP_FROM_NAME || 'OWL Mentor';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@owlmentor.com';
    const from = `${fromName} <${fromEmail}>`;
    const adminUrl = process.env.ADMIN_URL || 'http://localhost:3000/admin';
    const reviewUrl = `${adminUrl}/coaches/${mentor.mentorId}`;

    const subject = `Mentor profile ready for review: ${mentor.name}`;
    const html = `
      <div style="font-family:sans-serif;max-width:540px;margin:auto;padding:32px">
        <h2 style="color:#0f172a;font-size:22px;margin-bottom:4px">Mentor profile completed</h2>
        <p style="color:#64748b;margin-bottom:24px">
          A mentor has filled in all required details and submitted their profile for approval.
        </p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr>
            <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;width:110px;font-size:13px">Name</td>
            <td style="padding:10px 12px;background:#fff;border:1px solid #e2e8f0;color:#0f172a;font-weight:600;font-size:13px">${mentor.name}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;font-size:13px">Email</td>
            <td style="padding:10px 12px;background:#fff;border:1px solid #e2e8f0;color:#0f172a;font-size:13px">${mentor.email}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;font-size:13px">Submitted</td>
            <td style="padding:10px 12px;background:#fff;border:1px solid #e2e8f0;color:#0f172a;font-size:13px">${new Date().toUTCString()}</td>
          </tr>
        </table>
        <a href="${reviewUrl}"
           style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Review profile →
        </a>
        <p style="color:#94a3b8;font-size:11px;margin-top:24px">
          This is an automated notification from OWL Mentor.
        </p>
      </div>
    `;

    const transport = createTransport();
    if (!transport) {
      logger.info(`[ADMIN NOTIFY] Profile complete: ${mentor.name} <${mentor.email}> (SMTP not configured)`);
      return;
    }

    try {
      await sendTrackedMail({
        transport,
        provider: 'smtp',
        operation: 'notify_admin_profile_complete',
        mailOptions: { from, to: adminEmail, subject, html },
        metadata: { emailType: 'admin_profile_complete', mentorId: mentor.mentorId },
      });
      logger.info(`[ADMIN NOTIFY] Profile-complete email sent to ${adminEmail} for mentor ${mentor.email}`);
    } catch (error) {
      logger.error(`[ADMIN NOTIFY] Failed to send profile-complete email: ${(error as Error).message}`);
    }
  },

  async notifyAdminNewMentor(mentor: { name: string; email: string }): Promise<void> {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!adminEmail) {
      logger.info(`[ADMIN NOTIFY] New mentor signup: ${mentor.name} <${mentor.email}>`);
      return;
    }

    const fromName = process.env.SMTP_FROM_NAME || 'OWL Mentor';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@owlmentor.com';
    const from = `${fromName} <${fromEmail}>`;
    const adminUrl = process.env.ADMIN_URL || 'http://localhost:3000/admin';

    const subject = `New mentor signup: ${mentor.name}`;
    const html = `
      <div style="font-family:sans-serif;max-width:540px;margin:auto;padding:32px">
        <h2 style="color:#0f172a;font-size:22px;margin-bottom:4px">New mentor application</h2>
        <p style="color:#64748b;margin-bottom:24px">A new mentor has registered and is awaiting approval.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr>
            <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;width:110px;font-size:13px">Name</td>
            <td style="padding:10px 12px;background:#fff;border:1px solid #e2e8f0;color:#0f172a;font-weight:600;font-size:13px">${mentor.name}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;font-size:13px">Email</td>
            <td style="padding:10px 12px;background:#fff;border:1px solid #e2e8f0;color:#0f172a;font-size:13px">${mentor.email}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;font-size:13px">Signed up</td>
            <td style="padding:10px 12px;background:#fff;border:1px solid #e2e8f0;color:#0f172a;font-size:13px">${new Date().toUTCString()}</td>
          </tr>
        </table>
        <a href="${adminUrl}/coaches"
           style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Review in Admin Panel →
        </a>
        <p style="color:#94a3b8;font-size:11px;margin-top:24px">
          This is an automated notification from OWL Mentor.
        </p>
      </div>
    `;

    const transport = createTransport();
    if (!transport) {
      logger.info(`[ADMIN NOTIFY] New mentor signup: ${mentor.name} <${mentor.email}> (SMTP not configured)`);
      return;
    }

    try {
      await sendTrackedMail({
        transport,
        provider: 'smtp',
        operation: 'notify_admin_new_mentor',
        mailOptions: { from, to: adminEmail, subject, html },
        metadata: { emailType: 'admin_new_mentor' },
      });
      logger.info(`[ADMIN NOTIFY] Sent to ${adminEmail} for mentor ${mentor.email}`);
    } catch (error) {
      logger.error(`[ADMIN NOTIFY] Failed: ${(error as Error).message}`);
      // non-blocking
    }
  },

  async notifyMentorReviewMessage(params: {
    mentorName: string;
    mentorEmail: string;
    mentorId: string;
    message: string;
  }): Promise<void> {
    const fromName = process.env.SMTP_FROM_NAME || 'OWL Mentor';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@owlmentor.com';
    const from = `${fromName} <${fromEmail}>`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const profileUrl = `${appUrl}/mentor/dashboard/profile`;
    const messagePreview = escapeHtml(params.message.trim()).slice(0, 280);

    const subject = 'Admin left feedback on your mentor profile';
    const html = `
      <div style="font-family:sans-serif;max-width:540px;margin:auto;padding:32px">
        <h2 style="color:#0f172a;font-size:22px;margin-bottom:6px">You have new profile feedback</h2>
        <p style="color:#475569;margin-bottom:18px">
          Hi ${escapeHtml(params.mentorName)}, an OWL Mentor admin sent a review message about your mentor profile.
        </p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin-bottom:20px">
          <p style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin:0 0 8px">Admin message</p>
          <p style="color:#0f172a;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap">${messagePreview}</p>
        </div>
        <a href="${profileUrl}"
          style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Open profile review chat →
        </a>
        <p style="color:#94a3b8;font-size:11px;margin-top:20px">
          Mentor ID: ${escapeHtml(params.mentorId)}
        </p>
      </div>
    `;

    const transport = createTransport();
    if (transport) {
      try {
        await sendTrackedMail({
          transport,
          provider: 'smtp',
          operation: 'notify_mentor_review_message',
          mailOptions: { from, to: params.mentorEmail, subject, html },
          metadata: { emailType: 'mentor_review_message', mentorId: params.mentorId },
        });
        logger.info(`[REVIEW EMAIL] Sent to mentor ${params.mentorEmail}`);
        return;
      } catch (error) {
        logger.error(`[REVIEW EMAIL] SMTP failed to ${params.mentorEmail}: ${(error as Error).message}`);
        logger.warn('[REVIEW EMAIL] Falling back to Ethereal dev transport...');
      }
    }

    try {
      const devTransport = await getDevTransport();
      const info = await sendTrackedMail({
        transport: devTransport,
        provider: 'ethereal',
        operation: 'notify_mentor_review_message',
        mailOptions: { from, to: params.mentorEmail, subject, html },
        metadata: { emailType: 'mentor_review_message', mentorId: params.mentorId },
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logger.info(`[REVIEW EMAIL DEV] Sent to ${params.mentorEmail} | Preview: ${previewUrl}`);
    } catch (err) {
      await recordEmailFallbackFailure('notify_mentor_review_message', (err as Error).message, {
        emailType: 'mentor_review_message',
        mentorId: params.mentorId,
      });
      logger.warn(`[REVIEW EMAIL FALLBACK] Could not send to ${params.mentorEmail}: ${(err as Error).message}`);
    }
  },

  async notifyAdminReviewReply(params: {
    mentorName: string;
    mentorEmail: string;
    mentorId: string;
    message: string;
  }): Promise<void> {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!adminEmail) {
      logger.info(`[ADMIN REVIEW REPLY] ${params.mentorName} <${params.mentorEmail}> replied (no admin email configured)`);
      return;
    }

    const fromName = process.env.SMTP_FROM_NAME || 'OWL Mentor';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@owlmentor.com';
    const from = `${fromName} <${fromEmail}>`;
    const adminUrl = process.env.ADMIN_URL || 'http://localhost:3000/admin';
    const reviewUrl = `${adminUrl}/coaches/${params.mentorId}`;
    const messagePreview = escapeHtml(params.message.trim()).slice(0, 280);

    const subject = `Mentor replied in review chat: ${params.mentorName}`;
    const html = `
      <div style="font-family:sans-serif;max-width:540px;margin:auto;padding:32px">
        <h2 style="color:#0f172a;font-size:22px;margin-bottom:6px">Mentor replied to review feedback</h2>
        <p style="color:#475569;margin-bottom:18px">
          <strong>${escapeHtml(params.mentorName)}</strong> (${escapeHtml(params.mentorEmail)}) sent a new message in the profile review chat.
        </p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin-bottom:20px">
          <p style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin:0 0 8px">Mentor message</p>
          <p style="color:#0f172a;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap">${messagePreview}</p>
        </div>
        <a href="${reviewUrl}"
          style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Open admin review page →
        </a>
      </div>
    `;

    const transport = createTransport();
    if (transport) {
      try {
        await sendTrackedMail({
          transport,
          provider: 'smtp',
          operation: 'notify_admin_review_reply',
          mailOptions: { from, to: adminEmail, subject, html },
          metadata: { emailType: 'admin_review_reply', mentorId: params.mentorId },
        });
        logger.info(`[ADMIN REVIEW REPLY] Sent to ${adminEmail} for mentor ${params.mentorEmail}`);
        return;
      } catch (error) {
        logger.error(`[ADMIN REVIEW REPLY] SMTP failed: ${(error as Error).message}`);
        logger.warn('[ADMIN REVIEW REPLY] Falling back to Ethereal dev transport...');
      }
    }

    try {
      const devTransport = await getDevTransport();
      const info = await sendTrackedMail({
        transport: devTransport,
        provider: 'ethereal',
        operation: 'notify_admin_review_reply',
        mailOptions: { from, to: adminEmail, subject, html },
        metadata: { emailType: 'admin_review_reply', mentorId: params.mentorId },
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logger.info(`[ADMIN REVIEW REPLY DEV] Sent to ${adminEmail} | Preview: ${previewUrl}`);
    } catch (err) {
      await recordEmailFallbackFailure('notify_admin_review_reply', (err as Error).message, {
        emailType: 'admin_review_reply',
        mentorId: params.mentorId,
      });
      logger.warn(`[ADMIN REVIEW REPLY FALLBACK] Could not send to ${adminEmail}: ${(err as Error).message}`);
    }
  },

  async sendBookingConfirmation(params: {
    to: string;
    menteeName: string;
    mentorName: string;
    meetingId: string;
    title: string;
    scheduledAt: Date;
    durationMin: number;
    dailyRoomUrl?: string;
    meetUrl?: string;
    dashboardPath?: string;
  }): Promise<void> {
    const fromName = process.env.SMTP_FROM_NAME || 'OWL Mentor';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@owlmentor.com';
    const from = `${fromName} <${fromEmail}>`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const sessionUrl = `${appUrl}${params.dashboardPath ?? '/mentee/dashboard'}`;
    const callUrl = params.dailyRoomUrl || params.meetUrl;

    const dateStr = params.scheduledAt.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const timeStr = params.scheduledAt.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });

    const callButton = callUrl
      ? `<a href="${callUrl}" style="display:inline-block;padding:12px 28px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;margin-right:12px">Join session →</a>`
      : '';

    const subject = `Booking confirmed: ${params.title} with ${params.mentorName}`;
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;background:#fff;border-radius:12px">
        <div style="background:#7c3aed;border-radius:10px;padding:20px 24px;margin-bottom:24px">
          <p style="color:#fff;font-size:18px;font-weight:700;margin:0">Session Confirmed</p>
          <p style="color:#ede9fe;font-size:13px;margin:4px 0 0">Your mentoring session is booked</p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr>
            <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;font-size:13px;width:90px">Session</td>
            <td style="padding:10px 12px;background:#fff;border:1px solid #e2e8f0;color:#0f172a;font-weight:600;font-size:13px">${escapeHtml(params.title)}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;font-size:13px">Mentor</td>
            <td style="padding:10px 12px;background:#fff;border:1px solid #e2e8f0;color:#0f172a;font-size:13px">${escapeHtml(params.mentorName)}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;font-size:13px">Date</td>
            <td style="padding:10px 12px;background:#fff;border:1px solid #e2e8f0;color:#0f172a;font-size:13px">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;font-size:13px">Time</td>
            <td style="padding:10px 12px;background:#fff;border:1px solid #e2e8f0;color:#0f172a;font-size:13px">${timeStr}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;font-size:13px">Duration</td>
            <td style="padding:10px 12px;background:#fff;border:1px solid #e2e8f0;color:#0f172a;font-size:13px">${params.durationMin} minutes</td>
          </tr>
        </table>

        <div style="margin-bottom:24px">
          ${callButton}
          <a href="${sessionUrl}" style="display:inline-block;padding:12px 28px;background:#f1f5f9;color:#334155;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View booking</a>
        </div>

        ${callUrl ? `<p style="color:#64748b;font-size:12px;margin-bottom:24px">Call link: <a href="${callUrl}" style="color:#7c3aed">${callUrl}</a></p>` : ''}

        <p style="color:#94a3b8;font-size:11px;margin-top:16px">
          OWL Mentor &bull; <a href="${appUrl}" style="color:#7c3aed;text-decoration:none">owlmentor.com</a>
        </p>
      </div>
    `;

    const transport = createTransport();
    if (transport) {
      try {
        await sendTrackedMail({
          transport,
          provider: 'smtp',
          operation: 'send_booking_confirmation',
          mailOptions: { from, to: params.to, subject, html },
          metadata: { emailType: 'booking_confirmation', meetingId: params.meetingId },
        });
        logger.info(`[BOOKING CONFIRM EMAIL] Sent to ${params.to}`);
        return;
      } catch (error) {
        logger.error(`[BOOKING CONFIRM EMAIL] SMTP failed to ${params.to}: ${(error as Error).message}`);
        logger.warn('[BOOKING CONFIRM EMAIL] Falling back to Ethereal...');
      }
    }

    try {
      const devTransport = await getDevTransport();
      const info = await sendTrackedMail({
        transport: devTransport,
        provider: 'ethereal',
        operation: 'send_booking_confirmation',
        mailOptions: { from, to: params.to, subject, html },
        metadata: { emailType: 'booking_confirmation', meetingId: params.meetingId },
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logger.info(`[BOOKING CONFIRM EMAIL DEV] Sent to ${params.to} | Preview: ${previewUrl}`);
    } catch (err) {
      await recordEmailFallbackFailure('send_booking_confirmation', (err as Error).message, {
        emailType: 'booking_confirmation',
        meetingId: params.meetingId,
      });
      logger.warn(`[BOOKING CONFIRM EMAIL FALLBACK] Could not send to ${params.to}: ${(err as Error).message}`);
    }
  },

  async sendSessionReminder(params: {
    to: string;
    recipientName: string;
    mentorName: string;
    menteeName: string;
    meetingId: string;
    title: string;
    scheduledAt: Date;
    durationMin: number;
    dailyRoomUrl?: string;
    meetUrl?: string;
  }): Promise<void> {
    const fromName = process.env.SMTP_FROM_NAME || 'OWL Mentor';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@owlmentor.com';
    const from = `${fromName} <${fromEmail}>`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callUrl = params.dailyRoomUrl || params.meetUrl;

    const timeStr = params.scheduledAt.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });

    const subject = `Your session starts in 5 minutes — ${params.title}`;
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;background:#fff;border-radius:12px">
        <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:10px;padding:20px 24px;margin-bottom:24px;text-align:center">
          <p style="color:#fff;font-size:28px;font-weight:800;margin:0">⏰ 5 Minutes!</p>
          <p style="color:#ede9fe;font-size:14px;margin:6px 0 0">Your mentoring session is about to start</p>
        </div>

        <p style="color:#0f172a;font-size:15px;margin-bottom:20px">
          Hi <strong>${escapeHtml(params.recipientName)}</strong>, your session <strong>"${escapeHtml(params.title)}"</strong> with ${escapeHtml(params.mentorName === params.recipientName ? params.menteeName : params.mentorName)} starts at <strong>${timeStr}</strong> (${params.durationMin} min).
        </p>

        ${callUrl ? `
        <div style="text-align:center;margin-bottom:24px">
          <a href="${callUrl}"
             style="display:inline-block;padding:16px 40px;background:#7c3aed;color:#fff;border-radius:10px;text-decoration:none;font-weight:800;font-size:17px;letter-spacing:-0.3px">
            Join Now →
          </a>
        </div>
        <p style="color:#64748b;font-size:12px;text-align:center;margin-bottom:24px">
          <a href="${callUrl}" style="color:#7c3aed">${callUrl}</a>
        </p>` : `
        <p style="color:#ef4444;font-size:13px;margin-bottom:24px">No call link found — check your booking in the dashboard.</p>
        <div style="text-align:center;margin-bottom:24px">
          <a href="${appUrl}/dashboard/sessions/${params.meetingId}"
             style="display:inline-block;padding:14px 32px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
            Open Session →
          </a>
        </div>`}

        <p style="color:#94a3b8;font-size:11px;text-align:center">
          OWL Mentor &bull; <a href="${appUrl}" style="color:#7c3aed;text-decoration:none">owlmentor.com</a>
        </p>
      </div>
    `;

    const transport = createTransport();
    if (transport) {
      try {
        await sendTrackedMail({
          transport,
          provider: 'smtp',
          operation: 'send_session_reminder',
          mailOptions: { from, to: params.to, subject, html },
          metadata: { emailType: 'session_reminder', meetingId: params.meetingId },
        });
        logger.info(`[REMINDER EMAIL] Sent to ${params.to}`);
        return;
      } catch (error) {
        logger.error(`[REMINDER EMAIL] SMTP failed to ${params.to}: ${(error as Error).message}`);
        logger.warn('[REMINDER EMAIL] Falling back to Ethereal...');
      }
    }

    try {
      const devTransport = await getDevTransport();
      const info = await sendTrackedMail({
        transport: devTransport,
        provider: 'ethereal',
        operation: 'send_session_reminder',
        mailOptions: { from, to: params.to, subject, html },
        metadata: { emailType: 'session_reminder', meetingId: params.meetingId },
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logger.info(`[REMINDER EMAIL DEV] Sent to ${params.to} | Preview: ${previewUrl}`);
    } catch (err) {
      await recordEmailFallbackFailure('send_session_reminder', (err as Error).message, {
        emailType: 'session_reminder',
        meetingId: params.meetingId,
      });
      logger.warn(`[REMINDER EMAIL FALLBACK] Could not send to ${params.to}: ${(err as Error).message}`);
    }
  },

  async sendSessionSummary(params: {
    to: string;
    menteeName: string;
    mentorName: string;
    meetingId: string;
    scheduledAt: Date;
    durationSeconds: number;
    summary: string;
    actionItems: string[];
    keyTopics: string[];
  }): Promise<void> {
    const fromName = process.env.SMTP_FROM_NAME || 'OWL Mentor';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@owlmentor.com';
    const from = `${fromName} <${fromEmail}>`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const sessionUrl = `${appUrl}/mentee/dashboard`;

    const durationMin = Math.round(params.durationSeconds / 60);
    const sessionDate = params.scheduledAt.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const topicPills = params.keyTopics
      .map(t => `<span style="display:inline-block;background:#ede9fe;color:#6d28d9;border-radius:20px;padding:3px 12px;font-size:12px;font-weight:600;margin:2px 4px 2px 0">${escapeHtml(t)}</span>`)
      .join('');

    const actionList = params.actionItems
      .map(item => `<li style="margin-bottom:8px;color:#334155">${escapeHtml(item)}</li>`)
      .join('');

    const subject = `Your session summary with ${params.mentorName}`;
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;background:#fff;border-radius:12px">
        <h2 style="color:#0f172a;font-size:22px;margin-bottom:4px">Session Summary</h2>
        <p style="color:#64748b;font-size:14px;margin-bottom:24px">
          ${sessionDate} &bull; ${durationMin} min &bull; with <strong>${escapeHtml(params.mentorName)}</strong>
        </p>

        ${topicPills ? `<div style="margin-bottom:20px">${topicPills}</div>` : ''}

        ${params.summary ? `
        <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:20px">
          <p style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin:0 0 8px">Summary</p>
          <p style="color:#0f172a;font-size:14px;line-height:1.7;margin:0">${escapeHtml(params.summary)}</p>
        </div>` : ''}

        ${actionList ? `
        <div style="margin-bottom:24px">
          <p style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin:0 0 10px">Action Items</p>
          <ul style="margin:0;padding-left:20px">${actionList}</ul>
        </div>` : ''}

        <a href="${sessionUrl}"
           style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          View full session →
        </a>

        <p style="color:#94a3b8;font-size:11px;margin-top:28px">
          OWL Mentor &bull; <a href="${appUrl}" style="color:#7c3aed;text-decoration:none">owlmentor.com</a>
        </p>
      </div>
    `;

    const transport = createTransport();
    if (transport) {
      try {
        await sendTrackedMail({
          transport,
          provider: 'smtp',
          operation: 'send_session_summary',
          mailOptions: { from, to: params.to, subject, html },
          metadata: { emailType: 'session_summary', meetingId: params.meetingId },
        });
        logger.info(`[SESSION SUMMARY EMAIL] Sent to ${params.to}`);
        return;
      } catch (error) {
        logger.error(`[SESSION SUMMARY EMAIL] SMTP failed to ${params.to}: ${(error as Error).message}`);
        logger.warn('[SESSION SUMMARY EMAIL] Falling back to Ethereal dev transport...');
      }
    }

    try {
      const devTransport = await getDevTransport();
      const info = await sendTrackedMail({
        transport: devTransport,
        provider: 'ethereal',
        operation: 'send_session_summary',
        mailOptions: { from, to: params.to, subject, html },
        metadata: { emailType: 'session_summary', meetingId: params.meetingId },
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logger.info(`[SESSION SUMMARY EMAIL DEV] Sent to ${params.to} | Preview: ${previewUrl}`);
    } catch (err) {
      await recordEmailFallbackFailure('send_session_summary', (err as Error).message, {
        emailType: 'session_summary',
        meetingId: params.meetingId,
      });
      logger.warn(`[SESSION SUMMARY EMAIL FALLBACK] Could not send to ${params.to}: ${(err as Error).message}`);
    }
  },

  /**
   * Send a marketing email to a recipient, wrapping the body in a mandatory
   * professional header + footer with CTA buttons for mentor/mentee signup.
   */
  async sendMarketing(to: string, recipientName: string, subject: string, bodyHtml: string): Promise<void> {
    const fromName = process.env.SMTP_FROM_NAME || 'OWL Mentor';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@owlmentor.com';
    const from = `${fromName} <${fromEmail}>`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const mentorSignupUrl = `${appUrl}/register?role=mentor`;
    const menteeSignupUrl = `${appUrl}/register?role=mentee`;

    const header = `
      <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,0.06);">
        <div style="background:linear-gradient(135deg,#0a0a1a 0%,#0f0b1e 100%);padding:28px 36px;text-align:center;">
          <p style="color:#f59e0b;font-size:22px;font-weight:800;letter-spacing:-0.5px;margin:0;">🦉 OWL Mentor</p>
          <p style="color:#94a3b8;font-size:12px;margin:6px 0 0;">Connect. Learn. Grow.</p>
        </div>
        <div style="padding:32px 36px 0;">
          <p style="color:#0f172a;font-size:16px;margin:0 0 4px;">Hi${recipientName ? ' ' + recipientName : ''},</p>
        </div>
        <div style="padding:16px 36px 0;color:#334155;font-size:15px;line-height:1.7;">
    `;

    const footer = `
        </div>
        <div style="padding:28px 36px;text-align:center;border-top:1px solid #f1f5f9;margin-top:28px;">
          <p style="color:#64748b;font-size:13px;margin:0 0 16px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Get started today</p>
          <a href="${mentorSignupUrl}" style="display:inline-block;padding:12px 28px;background:#7c3aed;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin:0 8px 12px;">🎓 Join as Mentor</a>
          <a href="${menteeSignupUrl}" style="display:inline-block;padding:12px 28px;background:#f59e0b;color:#000000;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin:0 8px 12px;">🚀 Join as Mentee</a>
        </div>
        <div style="background:#f8fafc;padding:18px 36px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.6;">
            © ${new Date().getFullYear()} OWL Mentor by Jaddpi &nbsp;|&nbsp;
            <a href="${appUrl}" style="color:#7c3aed;text-decoration:none;">Visit our website</a><br/>
            You are receiving this email because your contact was provided to OWL Mentor for outreach.
          </p>
        </div>
      </div>
    `;

    const html = header + bodyHtml + footer;

    const transport = createTransport();
    if (transport) {
      try {
        await sendTrackedMail({
          transport,
          provider: 'smtp',
          operation: 'send_marketing_email',
          mailOptions: { from, to, subject, html },
          metadata: { emailType: 'marketing' },
        });
        logger.info(`[MARKETING EMAIL] Sent to ${to}`);
        return;
      } catch (error) {
        logger.error(`[MARKETING EMAIL] SMTP failed to ${to}: ${(error as Error).message}`);
        logger.warn(`[MARKETING EMAIL] Falling back to Ethereal...`);
      }
    }

    try {
      const devTransport = await getDevTransport();
      const info = await sendTrackedMail({
        transport: devTransport,
        provider: 'ethereal',
        operation: 'send_marketing_email',
        mailOptions: { from, to, subject, html },
        metadata: { emailType: 'marketing' },
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logger.info(`[MARKETING EMAIL DEV] Sent to ${to} | Preview: ${previewUrl}`);
    } catch (err) {
      await recordEmailFallbackFailure('send_marketing_email', (err as Error).message, {
        emailType: 'marketing',
      });
      logger.warn(`[MARKETING EMAIL FALLBACK] Could not send to ${to}: ${(err as Error).message}`);
    }
  },
};
