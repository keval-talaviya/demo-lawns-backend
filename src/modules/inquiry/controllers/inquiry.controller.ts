import { Request, Response } from 'express';
import { sendEmail } from '../../../services/mail.sercice';
import { successResponse, errorResponse } from '../../../common/response';
import fs from 'fs';
import path from 'path';
import { SERVICE_LIST } from '../../../common';
import { config } from '../../../config';

// Load template synchronously once
let contactTemplate = '';
try {
  const tplPath = path.join(__dirname, '../../../services/emailTemplates/contact-form.template.html');
  contactTemplate = fs.readFileSync(tplPath, 'utf8');
} catch (e) {
  console.warn('Could not load contact email template:', e);
}

const renderTemplate = (template: string, vars: Record<string, string>) => {
  let out = template;
  Object.keys(vars).forEach((k) => {
    const re = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
    out = out.replace(re, vars[k] || '');
  });
  return out;
};

export const sendInquiry = async (req: Request, res: Response) => {
  try {
    const name = (req.body.name || '').toString().trim();
    const email = (req.body.email || '').toString().trim();
    const phone = (req.body.phone || '').toString().trim();
    const service = (req.body.service || '').toString().trim();
    const message = (req.body.message || '').toString().trim();

    if (!name || !email || !message) {
      return errorResponse(res, 400, 'Name, email and message are required');
    }

    const receiver = process.env.DEFAULT_FRANCHISE_EMAIL

    const now = new Date();
    const submission_date = now.toLocaleDateString();
    const submission_time = now.toLocaleTimeString();

    const serviceLabel = SERVICE_LIST.find(s => s.id === service)?.label || service;

    // Fetch company settings for branding
    const companySettings = await import('../../companySettings/model/companySettings.model').then(m => m.CompanySettingsModel.findOne().lean());
    const companyName = (companySettings as any)?.companyName || 'Your Company';
    const logoPath = (companySettings as any)?.companyLogo;
    const companyLogo = logoPath
      ? (logoPath.startsWith('http') ? logoPath : `${config.apiUrl}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`)
      : undefined;

    const currentYear = new Date().getFullYear().toString();

    const logoHtml = companyLogo
      ? `<img src="${companyLogo}" alt="${companyName}" style="max-height: 80px; max-width: 200px; display: block; margin: 0 auto;" />`
      : `<h1>${companyName}</h1>`;
    // Let's refine the logoHtml to be generic, the template will handle the container style.
    // For now, I'll pass company_logo_url and company_name separately if I can, or a combined block.
    // The previous planner thought about {{header_branding}}.

    const vars: Record<string, string> = {
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      service_selected: serviceLabel,
      customer_message: message,
      submission_date,
      submission_time,
      company_name: companyName,
      current_year: currentYear,
      header_branding: companyLogo ? `<img src="${companyLogo}" alt="${companyName}" style="max-width: 200px; max-height: 80px;" />` : `<h1>${companyName}</h1>`
    };

    const subject = `New Inquiry from ${name}`;

    const html = contactTemplate ? renderTemplate(contactTemplate, vars) : `
      <h3>New inquiry received</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Service Interested In:</strong> ${service}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br/>')}</p>
      <hr/>
      <small>&copy; ${currentYear} ${companyName}</small>
    `;

    // Send to configured receiver
    if (receiver) {
      await sendEmail({ to: receiver, subject, html, text: message });
    }

    // Optionally send a confirmation to the user
    try {
      if (email) {
        const userHtml = `<p>Hi ${name},</p><p>Thanks for contacting us. We have received your message and will respond within 24 hours.</p><hr/>${html}`;
        const userText = `Hi ${name},\n\nThanks for contacting us. We have received your message and will respond within 24 hours.\n\nMessage:\n${message}`;
        await sendEmail({ to: email, subject: 'We received your inquiry', html: userHtml, text: userText });
      }
    } catch (e) {
      // don't fail the whole request if confirmation mail fails
      console.warn('Failed to send confirmation email to user', e);
    }

    return successResponse(res, { message: 'Inquiry sent successfully' }, 'Inquiry sent');
  } catch (err: any) {
    console.error('Inquiry send error:', err);
    return errorResponse(res, 500, 'Failed to send inquiry');
  }
};
