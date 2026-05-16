import dotenv from 'dotenv';
import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

// Load environment variables
dotenv.config({ path: './.env' });

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

/**
 * Helper: log with timestamp
 */
const log = (message: string, ...args: any[]) => {
  const time = new Date().toISOString();
  console.log(`[${time}] ${message}`, ...args);
};

/**
 * Display loaded environment variables (safe)
 */
// SMTP ENVIRONMENT CONFIG log removed

/**
 * Create transporter
 */
const transporter: Transporter<SMTPTransport.SentMessageInfo> =
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    // secure: Number(process.env.SMTP_PORT) === 465, // true for SSL (465), false for TLS (587)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    logger: false,
    debug: false,
  } as SMTPTransport.Options);

/**
 * Verify connection on startup
 */
(async () => {
  try {
    await transporter.verify();
  } catch (err) {
    console.error('❌ SMTP connection verification failed:', err);
  }
})();

/**
 * Send email helper with full logs
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('Missing SMTP credentials in environment variables');
    }

    const mailOptions = {
      from: `"Lawn Care" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    };

    await transporter.sendMail(mailOptions);
  } catch (error: any) {
    console.error('❌ ERROR sending email:', error.message);
    throw new Error('Email sending failed - check console for details');
  }
};
