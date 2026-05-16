"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInquiry = void 0;
const mail_sercice_1 = require("../../../services/mail.sercice");
const response_1 = require("../../../common/response");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const common_1 = require("../../../common");
const config_1 = require("../../../config");
// Load template synchronously once
let contactTemplate = '';
try {
    const tplPath = path_1.default.join(__dirname, '../../../services/emailTemplates/contact-form.template.html');
    contactTemplate = fs_1.default.readFileSync(tplPath, 'utf8');
}
catch (e) {
    console.warn('Could not load contact email template:', e);
}
const renderTemplate = (template, vars) => {
    let out = template;
    Object.keys(vars).forEach((k) => {
        const re = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
        out = out.replace(re, vars[k] || '');
    });
    return out;
};
const sendInquiry = async (req, res) => {
    try {
        const name = (req.body.name || '').toString().trim();
        const email = (req.body.email || '').toString().trim();
        const phone = (req.body.phone || '').toString().trim();
        const service = (req.body.service || '').toString().trim();
        const message = (req.body.message || '').toString().trim();
        if (!name || !email || !message) {
            return (0, response_1.errorResponse)(res, 400, 'Name, email and message are required');
        }
        const receiver = process.env.DEFAULT_FRANCHISE_EMAIL;
        const now = new Date();
        const submission_date = now.toLocaleDateString();
        const submission_time = now.toLocaleTimeString();
        const serviceLabel = common_1.SERVICE_LIST.find(s => s.id === service)?.label || service;
        // Fetch company settings for branding
        const companySettings = await Promise.resolve().then(() => __importStar(require('../../companySettings/model/companySettings.model'))).then(m => m.CompanySettingsModel.findOne().lean());
        const companyName = companySettings?.companyName || 'AB Lawns & Garden Care';
        const logoPath = companySettings?.companyLogo;
        const companyLogo = logoPath
            ? (logoPath.startsWith('http') ? logoPath : `${config_1.config.apiUrl}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`)
            : undefined;
        const currentYear = new Date().getFullYear().toString();
        const logoHtml = companyLogo
            ? `<img src="${companyLogo}" alt="${companyName}" style="max-height: 80px; max-width: 200px; display: block; margin: 0 auto;" />`
            : `<h1>${companyName}</h1>`;
        // Let's refine the logoHtml to be generic, the template will handle the container style.
        // For now, I'll pass company_logo_url and company_name separately if I can, or a combined block.
        // The previous planner thought about {{header_branding}}.
        const vars = {
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
            await (0, mail_sercice_1.sendEmail)({ to: receiver, subject, html, text: message });
        }
        // Optionally send a confirmation to the user
        try {
            if (email) {
                const userHtml = `<p>Hi ${name},</p><p>Thanks for contacting us. We have received your message and will respond within 24 hours.</p><hr/>${html}`;
                const userText = `Hi ${name},\n\nThanks for contacting us. We have received your message and will respond within 24 hours.\n\nMessage:\n${message}`;
                await (0, mail_sercice_1.sendEmail)({ to: email, subject: 'We received your inquiry', html: userHtml, text: userText });
            }
        }
        catch (e) {
            // don't fail the whole request if confirmation mail fails
            console.warn('Failed to send confirmation email to user', e);
        }
        return (0, response_1.successResponse)(res, { message: 'Inquiry sent successfully' }, 'Inquiry sent');
    }
    catch (err) {
        console.error('Inquiry send error:', err);
        return (0, response_1.errorResponse)(res, 500, 'Failed to send inquiry');
    }
};
exports.sendInquiry = sendInquiry;
//# sourceMappingURL=inquiry.controller.js.map