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

    return this.sendEmail(to, subject, html);
  }
}
