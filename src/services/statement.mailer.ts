import { sendEmail } from './mail.sercice';
import { CompanySettingsModel } from '../modules/companySettings/model/companySettings.model';
import { CustomerDocument } from '../modules/customer/model/customer.model';
import { StatementPdfService } from '../modules/customer/services/statementPdf.service';
import { statementCustomerTemplate } from './emailTemplates/statementCustomer.template';
import { config } from '../config';

export const sendStatementEmail = async (
    customer: CustomerDocument,
    transactions: any[],
    openingBalance: number,
    closingBalance: number,
    fromDate: Date,
    toDate: Date
) => {
    const companySettings = await CompanySettingsModel.findOne().lean();
    const companyName = (companySettings as any)?.companyName || 'Your Company';
    const logoPath = (companySettings as any)?.companyLogo;
    const companyLogo = logoPath
        ? (logoPath.startsWith('http') ? logoPath : `${config.apiUrl}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`)
        : undefined;

    // Generate PDF
    const pdfBuffer = await StatementPdfService.generateStatementPDF({
        customer,
        transactions,
        openingBalance,
        closingBalance,
        fromDate,
        toDate
    });

    const html = statementCustomerTemplate({
        customerName: customer.name,
        companyName,
        companyLogo,
        fromDate,
        toDate
    });

    if (!customer.email) {
        throw new Error('Customer email is missing');
    }

    await sendEmail({
        to: customer.email,
        subject: `Statement of Account: ${companyName}`,
        html,
        attachments: [
            {
                filename: `Statement-${fromDate.toISOString().split('T')[0]}-to-${toDate.toISOString().split('T')[0]}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
            },
        ],
    });
};
