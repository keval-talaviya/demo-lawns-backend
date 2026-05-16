"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInvoiceEmails = void 0;
// src/services/invoice.mailer.ts
const config_1 = require("../config");
const mail_sercice_1 = require("./mail.sercice");
const invoiceCustomer_template_1 = require("./emailTemplates/invoiceCustomer.template");
const invoiceFranchise_template_1 = require("./emailTemplates/invoiceFranchise.template");
const invoicePdf_service_1 = require("../modules/invoice/services/invoicePdf.service");
const invoice_model_1 = require("../modules/invoice/model/invoice.model");
const companySettings_model_1 = require("../modules/companySettings/model/companySettings.model");
/**
 * Send invoice emails to customer and franchise with PDF attachment
 * @param invoiceData - Invoice data for customer email
 * @param franchiseData - Franchise notification data
 */
const sendInvoiceEmails = async (invoiceData, franchiseData) => {
    // Fetch company settings for dynamic logo and name
    const companySettings = await companySettings_model_1.CompanySettingsModel.findOne().lean();
    const dbCompanyName = companySettings?.companyName || 'Your Company';
    const logoPath = companySettings?.companyLogo;
    const dbCompanyLogo = logoPath
        ? (logoPath.startsWith('http') ? logoPath : `${config_1.config.apiUrl}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`)
        : undefined;
    // Inject settings into email data
    invoiceData.companyName = invoiceData.companyName || dbCompanyName;
    invoiceData.companyLogo = dbCompanyLogo;
    franchiseData.companyName = franchiseData.companyName || dbCompanyName;
    franchiseData.companyLogo = dbCompanyLogo;
    const tasks = [];
    // Send invoice to customer with PDF attachment
    if (franchiseData.customerEmail) {
        try {
            // Fetch the full invoice document from database
            const invoice = await invoice_model_1.InvoiceModel.findOne({ invoiceNumber: invoiceData.invoiceNumber })
                .populate('franchiseId')
                .populate('customerId')
                .lean();
            if (!invoice) {
                console.error(`Invoice not found: ${invoiceData.invoiceNumber}`);
                return;
            }
            // Generate PDF
            const pdfBuffer = await invoicePdf_service_1.InvoicePdfService.generateInvoicePDF(invoice);
            const customerHtml = (0, invoiceCustomer_template_1.invoiceCustomerTemplate)(invoiceData);
            const companyName = invoiceData.companyName || 'Your Company';
            tasks.push((0, mail_sercice_1.sendEmail)({
                to: franchiseData.customerEmail,
                subject: `${companyName} - ${invoiceData.customerName} - Invoice #${invoiceData.invoiceNumber}`,
                html: customerHtml,
                attachments: [
                    {
                        filename: `Invoice-${invoiceData.invoiceNumber}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf',
                    },
                ],
            }).catch((error) => {
                console.error(`Failed to send invoice to customer ${franchiseData.customerEmail}:`, error);
                // Don't throw - we want to continue sending other emails
            }));
        }
        catch (pdfError) {
            console.error('Failed to generate invoice PDF:', pdfError);
            // Send email without PDF if generation fails
            const customerHtml = (0, invoiceCustomer_template_1.invoiceCustomerTemplate)(invoiceData);
            const companyName = invoiceData.companyName || 'Your Company';
            tasks.push((0, mail_sercice_1.sendEmail)({
                to: franchiseData.customerEmail,
                subject: `${companyName} - ${invoiceData.customerName} - Invoice #${invoiceData.invoiceNumber}`,
                html: customerHtml,
            }).catch((error) => {
                console.error(`Failed to send invoice to customer ${franchiseData.customerEmail}:`, error);
            }));
        }
    }
    // Send confirmation to franchise
    if (franchiseData.franchiseName && process.env.FRANCHISE_EMAIL) {
        const franchiseHtml = (0, invoiceFranchise_template_1.invoiceFranchiseTemplate)(franchiseData);
        tasks.push((0, mail_sercice_1.sendEmail)({
            to: process.env.FRANCHISE_EMAIL,
            subject: `Invoice Sent: #${franchiseData.invoiceNumber} to ${franchiseData.customerName}`,
            html: franchiseHtml,
        }).catch((error) => {
            console.error(`Failed to send franchise confirmation:`, error);
            // Don't throw - we want to continue
        }));
    }
    // Wait for all emails to be sent
    await Promise.allSettled(tasks);
    console.log(`✅ Invoice emails processed for invoice #${invoiceData.invoiceNumber}`);
};
exports.sendInvoiceEmails = sendInvoiceEmails;
//# sourceMappingURL=invoice.mailer.js.map