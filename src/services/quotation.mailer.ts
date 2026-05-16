import { config } from '../config';
import { sendEmail } from './mail.sercice';
import { QuotationDocument } from '../modules/quotation/interfaces/quotation.interface';
import { quotationCustomerTemplate } from './emailTemplates/quotationCustomer.template';
import { quotationFranchiseTemplate } from './emailTemplates/quotationFranchise.template';
import { CompanySettingsModel } from '../modules/companySettings/model/companySettings.model';
import { UserModel } from '../modules/user/model/user.model';
import { QuotationPdfService } from '../modules/quotation/services/quotationPdf.service';

export const sendQuotationEmails = async (quotation: QuotationDocument) => {
  const customerEmail = quotation.customerEmail;

  // Fetch company settings and franchise data
  const [companySettings, franchise] = await Promise.all([
    CompanySettingsModel.findOne().lean(),
    quotation.franchiseId ? UserModel.findById(quotation.franchiseId).lean() : null,
  ]);

  const companyName = (companySettings as any)?.companyName || 'Lawn Care';
  const logoPath = (companySettings as any)?.companyLogo;
  const companyLogo = logoPath
    ? (logoPath.startsWith('http') ? logoPath : `${config.apiUrl}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`)
    : undefined;

  const gstRate = (companySettings as any)?.gstRate || 15;
  const franchiseName = (franchise as any)?.name || companyName;
  const franchiseAddress = (franchise as any)?.address || '';


  const tasks: Promise<void>[] = [];

  if (customerEmail) {
    // Generate PDF
    const pdfBuffer = await QuotationPdfService.generateQuotationPDF(quotation);

    const html = quotationCustomerTemplate({
      quotation,
      companyName,
      companyLogo,
      franchiseName,
      franchiseAddress,
      gstRate,
    });
    tasks.push(
      sendEmail({
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
      })
    );
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
