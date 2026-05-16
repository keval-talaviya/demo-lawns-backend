"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendQuotationEmails = void 0;
const config_1 = require("../config");
const mail_sercice_1 = require("./mail.sercice");
const quotationCustomer_template_1 = require("./emailTemplates/quotationCustomer.template");
const companySettings_model_1 = require("../modules/companySettings/model/companySettings.model");
const user_model_1 = require("../modules/user/model/user.model");
const quotationPdf_service_1 = require("../modules/quotation/services/quotationPdf.service");
const sendQuotationEmails = async (quotation) => {
    const customerEmail = quotation.customerEmail;
    // Fetch company settings and franchise data
    const [companySettings, franchise] = await Promise.all([
        companySettings_model_1.CompanySettingsModel.findOne().lean(),
        quotation.franchiseId ? user_model_1.UserModel.findById(quotation.franchiseId).lean() : null,
    ]);
    const companyName = companySettings?.companyName || 'Lawn Care';
    const logoPath = companySettings?.companyLogo;
    const companyLogo = logoPath
        ? (logoPath.startsWith('http') ? logoPath : `${config_1.config.apiUrl}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`)
        : undefined;
    const gstRate = companySettings?.gstRate || 15;
    const franchiseName = franchise?.name || companyName;
    const franchiseAddress = franchise?.address || '';
    const tasks = [];
    if (customerEmail) {
        // Generate PDF
        const pdfBuffer = await quotationPdf_service_1.QuotationPdfService.generateQuotationPDF(quotation);
        const html = (0, quotationCustomer_template_1.quotationCustomerTemplate)({
            quotation,
            companyName,
            companyLogo,
            franchiseName,
            franchiseAddress,
            gstRate,
        });
        tasks.push((0, mail_sercice_1.sendEmail)({
            to: customerEmail,
            subject: `Your Quotation #${quotation.uniqueCode || quotation._id} from ${companyName}`,
            html,
            attachments: [
                {
                    filename: `Quotation-${quotation.uniqueCode || quotation._id}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
            ],
        }));
    }
    // Franchise email removed as per requirement
    /*
    if (franchiseEmail) {
      const html = quotationFranchiseTemplate(quotation);
      tasks.push(
        sendEmail({
          to: franchiseEmail,
          subject: `New Quotation Created #${quotation.uniqueCode || quotation._id}`,
          html,
        })
      );
    }
    */
    await Promise.all(tasks);
};
exports.sendQuotationEmails = sendQuotationEmails;
//# sourceMappingURL=quotation.mailer.js.map