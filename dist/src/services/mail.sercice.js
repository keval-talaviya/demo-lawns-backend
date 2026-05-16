"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const nodemailer_1 = __importDefault(require("nodemailer"));
// Load environment variables
dotenv_1.default.config({ path: './.env' });
/**
 * Helper: log with timestamp
 */
const log = (message, ...args) => {
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
const transporter = nodemailer_1.default.createTransport({
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
});
/**
 * Verify connection on startup
 */
(async () => {
    try {
        await transporter.verify();
    }
    catch (err) {
        console.error('❌ SMTP connection verification failed:', err);
    }
})();
/**
 * Send email helper with full logs
 */
const sendEmail = async (options) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            throw new Error('Missing SMTP credentials in environment variables');
        }
        const mailOptions = {
            from: `"Your Company" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
            attachments: options.attachments,
        };
        await transporter.sendMail(mailOptions);
    }
    catch (error) {
        console.error('❌ ERROR sending email:', error.message);
        throw new Error('Email sending failed - check console for details');
    }
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=mail.sercice.js.map