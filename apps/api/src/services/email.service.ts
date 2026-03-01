import nodemailer from 'nodemailer';
import { logger } from '@owl-mentors/utils';

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
    const fromName = process.env.SMTP_FROM_NAME || 'OWL Mentor';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@owlmentor.com';
    const from = `${fromName} <${fromEmail}>`;
    const subject = 'Your OWL Mentor verification code';
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
        <h2 style="color:#1e40af;font-size:24px;margin-bottom:8px">Verify your email</h2>
        <p style="color:#475569;margin-bottom:24px">
          Enter the 6-digit code below to verify your OWL Mentor account.
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
        await transport.sendMail({ from, to, subject, html });
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
      const info = await devTransport.sendMail({ from, to, subject, html });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logger.info(`[OTP EMAIL DEV] Code: ${code} | Preview: ${previewUrl}`);
    } catch (err) {
      // Last resort — just log the code
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
        await transport.sendMail({ from, to, subject, html });
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
      const info = await devTransport.sendMail({ from, to, subject, html });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logger.info(`[RESET EMAIL DEV] Preview: ${previewUrl}`);
    } catch (err) {
      // Last resort — just log the reset URL
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
      await transport.sendMail({ from, to: adminEmail, subject, html });
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
      await transport.sendMail({ from, to: adminEmail, subject, html });
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
        await transport.sendMail({ from, to: params.mentorEmail, subject, html });
        logger.info(`[REVIEW EMAIL] Sent to mentor ${params.mentorEmail}`);
        return;
      } catch (error) {
        logger.error(`[REVIEW EMAIL] SMTP failed to ${params.mentorEmail}: ${(error as Error).message}`);
        logger.warn('[REVIEW EMAIL] Falling back to Ethereal dev transport...');
      }
    }

    try {
      const devTransport = await getDevTransport();
      const info = await devTransport.sendMail({ from, to: params.mentorEmail, subject, html });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logger.info(`[REVIEW EMAIL DEV] Sent to ${params.mentorEmail} | Preview: ${previewUrl}`);
    } catch (err) {
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
        await transport.sendMail({ from, to: adminEmail, subject, html });
        logger.info(`[ADMIN REVIEW REPLY] Sent to ${adminEmail} for mentor ${params.mentorEmail}`);
        return;
      } catch (error) {
        logger.error(`[ADMIN REVIEW REPLY] SMTP failed: ${(error as Error).message}`);
        logger.warn('[ADMIN REVIEW REPLY] Falling back to Ethereal dev transport...');
      }
    }

    try {
      const devTransport = await getDevTransport();
      const info = await devTransport.sendMail({ from, to: adminEmail, subject, html });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logger.info(`[ADMIN REVIEW REPLY DEV] Sent to ${adminEmail} | Preview: ${previewUrl}`);
    } catch (err) {
      logger.warn(`[ADMIN REVIEW REPLY FALLBACK] Could not send to ${adminEmail}: ${(err as Error).message}`);
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
        await transport.sendMail({ from, to, subject, html });
        logger.info(`[MARKETING EMAIL] Sent to ${to}`);
        return;
      } catch (error) {
        logger.error(`[MARKETING EMAIL] SMTP failed to ${to}: ${(error as Error).message}`);
        logger.warn(`[MARKETING EMAIL] Falling back to Ethereal...`);
      }
    }

    try {
      const devTransport = await getDevTransport();
      const info = await devTransport.sendMail({ from, to, subject, html });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logger.info(`[MARKETING EMAIL DEV] Sent to ${to} | Preview: ${previewUrl}`);
    } catch (err) {
      logger.warn(`[MARKETING EMAIL FALLBACK] Could not send to ${to}: ${(err as Error).message}`);
    }
  },
};
