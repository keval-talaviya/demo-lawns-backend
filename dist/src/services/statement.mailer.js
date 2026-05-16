"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendStatementEmail = void 0;
const mail_sercice_1 = require("./mail.sercice");
const companySettings_model_1 = require("../modules/companySettings/model/companySettings.model");
const statementPdf_service_1 = require("../modules/customer/services/statementPdf.service");
const statementCustomer_template_1 = require("./emailTemplates/statementCustomer.template");
const config_1 = require("../config");
const sendStatementEmail = async (customer, transactions, openingBalance, closingBalance, fromDate, toDate) => {
    const companySettings = await companySettings_model_1.CompanySettingsModel.findOne().lean();
    const companyName = companySettings?.companyName || 'Your Company';
    const logoPath = companySettings?.companyLogo;
    const companyLogo = logoPath
        ? (logoPath.startsWith('http') ? logoPath : `${config_1.config.apiUrl}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`)
        : undefined;
    // Generate PDF
    const pdfBuffer = await statementPdf_service_1.StatementPdfService.generateStatementPDF({
        customer,
        transactions,
        openingBalance,
        closingBalance,
        fromDate,
        toDate
    });
    const html = (0, statementCustomer_template_1.statementCustomerTemplate)({
        customerName: customer.name,
        companyName,
        companyLogo,
        fromDate,
        toDate
    });
    if (!customer.email) {
        throw new Error('Customer email is missing');
    }
    await (0, mail_sercice_1.sendEmail)({
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
exports.sendStatementEmail = sendStatementEmail;
//# sourceMappingURL=statement.mailer.js.map