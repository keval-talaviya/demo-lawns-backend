// src/services/invoice.mailer.ts
import { config } from '../config';
import { sendEmail } from './mail.sercice';
import { invoiceCustomerTemplate, InvoiceEmailData } from './emailTemplates/invoiceCustomer.template';
import { invoiceFranchiseTemplate, InvoiceFranchiseEmailData } from './emailTemplates/invoiceFranchise.template';
import { InvoicePdfService } from '../modules/invoice/services/invoicePdf.service';
import { InvoiceModel } from '../modules/invoice/model/invoice.model';
import { CompanySettingsModel } from '../modules/companySettings/model/companySettings.model';


/**
 * Send invoice emails to customer and franchise with PDF attachment
 * @param invoiceData - Invoice data for customer email
 * @param franchiseData - Franchise notification data
 */
export const sendInvoiceEmails = async (
    invoiceData: InvoiceEmailData,
    franchiseData: InvoiceFranchiseEmailData
) => {
    // Fetch company settings for dynamic logo and name
    const companySettings = await CompanySettingsModel.findOne().lean();
    const dbCompanyName = (companySettings as any)?.companyName || 'Lawn Care';
    const logoPath = (companySettings as any)?.companyLogo;
    const dbCompanyLogo = logoPath
        ? (logoPath.startsWith('http') ? logoPath : `${config.apiUrl}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`)
        : undefined;

    // Inject settings into email data
    invoiceData.companyName = invoiceData.companyName || dbCompanyName;
    invoiceData.companyLogo = dbCompanyLogo;

    franchiseData.companyName = franchiseData.companyName || dbCompanyName;
    franchiseData.companyLogo = dbCompanyLogo;

    const tasks: Promise<void>[] = [];

    // Send invoice to customer with PDF attachment
    if (franchiseData.customerEmail) {
        try {
            // Fetch the full invoice document from database
            const invoice = await InvoiceModel.findOne({ invoiceNumber: invoiceData.invoiceNumber })
                .populate('franchiseId')
                .populate('customerId')
                .lean();

            if (!invoice) {
                console.error(`Invoice not found: ${invoiceData.invoiceNumber}`);
                return;
            }

            // Generate PDF
            const pdfBuffer = await InvoicePdfService.generateInvoicePDF(invoice as any);

            const customerHtml = invoiceCustomerTemplate(invoiceData);
            const companyName = invoiceData.companyName || 'Lawn Care';

            tasks.push(
                sendEmail({
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
                })
            );
        } catch (pdfError) {
            console.error('Failed to generate invoice PDF:', pdfError);
            // Send email without PDF if generation fails
            const customerHtml = invoiceCustomerTemplate(invoiceData);
            const companyName = invoiceData.companyName || 'Lawn Care';
            tasks.push(
                sendEmail({
                    to: franchiseData.customerEmail,
                    subject: `${companyName} - ${invoiceData.customerName} - Invoice #${invoiceData.invoiceNumber}`,
                    html: customerHtml,
                }).catch((error) => {
                    console.error(`Failed to send invoice to customer ${franchiseData.customerEmail}:`, error);
                })
            );
        }
    }

    // Send confirmation to franchise
    if (franchiseData.franchiseName && process.env.FRANCHISE_EMAIL) {
        const franchiseHtml = invoiceFranchiseTemplate(franchiseData);
        tasks.push(
            sendEmail({
                to: process.env.FRANCHISE_EMAIL,
                subject: `Invoice Sent: #${franchiseData.invoiceNumber} to ${franchiseData.customerName}`,
                html: franchiseHtml,
            }).catch((error) => {
                console.error(`Failed to send franchise confirmation:`, error);
                // Don't throw - we want to continue
            })
        );
    }

    // Wait for all emails to be sent
    await Promise.allSettled(tasks);

    console.log(`✅ Invoice emails processed for invoice #${invoiceData.invoiceNumber}`);
};
