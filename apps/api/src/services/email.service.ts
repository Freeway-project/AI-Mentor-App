import nodemailer from 'nodemailer';
import { logger } from '@owl-mentors/utils';

function createTransport() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        // Dev fallback: log to console
        return null;
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
}

export const EmailService = {
    async sendOtp(to: string, code: string): Promise<void> {
        const from = process.env.SMTP_FROM || 'OWLMentors <noreply@owlmentors.com>';
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

        const transport = createTransport();

        if (!transport) {
            logger.info(`[OTP EMAIL] To: ${to} | Code: ${code} | Expires: 10 min`);
            return;
        }

        try {
            await transport.sendMail({ from, to, subject, html });
            logger.info(`[OTP EMAIL] Sent to ${to}`);
        } catch (error) {
            logger.error(`[OTP EMAIL] Failed to send to ${to}: ${(error as Error).message}`);
            throw error;
        }
    },
};
