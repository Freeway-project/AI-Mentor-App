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

export const EmailService = {
  async sendOtp(to: string, code: string): Promise<void> {
    const fromName = process.env.SMTP_FROM_NAME || 'OWLMentors';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@owlmentors.com';
    const from = `${fromName} <${fromEmail}>`;
    const subject = 'Your OWLMentors verification code';
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
        <h2 style="color:#1e40af;font-size:24px;margin-bottom:8px">Verify your email</h2>
        <p style="color:#475569;margin-bottom:24px">
          Enter the 6-digit code below to verify your OWLMentors account.
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
    const fromName = process.env.SMTP_FROM_NAME || 'OWLMentors';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@owlmentors.com';
    const from = `${fromName} <${fromEmail}>`;
    const subject = 'Reset your OWLMentors password';
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
        <h2 style="color:#1e40af;font-size:24px;margin-bottom:8px">Reset your password</h2>
        <p style="color:#475569;margin-bottom:24px">
          Click the button below to reset your OWLMentors password.
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

  async notifyAdminNewMentor(mentor: { name: string; email: string }): Promise<void> {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!adminEmail) {
      logger.info(`[ADMIN NOTIFY] New mentor signup: ${mentor.name} <${mentor.email}>`);
      return;
    }

    const fromName = process.env.SMTP_FROM_NAME || 'OWLMentors';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@owlmentors.com';
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
          This is an automated notification from OWLMentors.
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
};
