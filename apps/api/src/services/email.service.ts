import nodemailer from 'nodemailer';
import { logger } from '@owl-mentors/utils';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    auth: {
      user: process.env.SMTP_USER || 'apikey',
      pass: process.env.SMTP_PASS,
    },
  });

  private static fromEmail = process.env.FROM_EMAIL || 'noreply@owlmentors.com';

  static async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      // In development, if credentials aren't set, just log it out.
      const pass = process.env.SMTP_PASS;
      if (!pass || pass === '' || pass === 'your_smtp_password_here' || pass.includes('dummy')) {
        logger.warn(`[Email Stub] Would have sent email to ${to} with subject: ${subject}`);
        // Log the HTML content safely without blowing up logs
        logger.warn(`[Email Content Stub] Length: ${html.length} chars`);
        return;
      }

      const info = await this.transporter.sendMail({
        from: `OWLMentors <${this.fromEmail}>`,
        to,
        subject,
        html,
      });

      logger.info(`Email sent: ${info.messageId}`);
    } catch (error) {
      logger.error('Failed to send email:', error as Error);
      throw error;
    }
  }

  static async sendOtp(to: string, otp: string): Promise<void> {
    const subject = 'Your OWLMentors Verification Code';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">Verification Code</h2>
        <p style="color: #475569; font-size: 16px;">
          Thank you for signing up for OWLMentors. Please use the following code to verify your email address. This code is valid for 10 minutes.
        </p>
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #0f172a;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
          If you did not request this code, please ignore this email.
        </p>
      </div>
    `;

    const transport = createTransport();

    if (!transport) {
      logger.info(`[OTP EMAIL] To: ${to} | Code: ${code} | Expires: 10 min`);
      return;
    }

    try {
      await transport.sendMail({ from, to, subject, html });
      logger.info(`[OTP EMAIL] Sent to ${to}`);
    } catch (error) {
      // SMTP failed — log the code so dev/staging can still verify
      logger.error(`[OTP EMAIL] SMTP failed to ${to}: ${(error as Error).message}`);
      logger.warn(`[OTP EMAIL FALLBACK] To: ${to} | Code: ${code} | Expires: 10 min`);
      // Don't re-throw — email failure should not block registration
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
