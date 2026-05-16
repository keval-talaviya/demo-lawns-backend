import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { InvoiceDocument } from '../interfaces/invoice.interface';
import { UserModel } from '../../user/model/user.model';
import { CustomerModel } from '../../customer/model/customer.model';
import { CompanySettingsModel } from '../../companySettings/model/companySettings.model';
import { logger } from '../../../common/logger';

export class InvoicePdfService {
  static async generateInvoicePDF(invoice: InvoiceDocument): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const [franchise, customer, companySettings] = await Promise.all([
          UserModel.findById(invoice.franchiseId).lean(),
          CustomerModel.findById(invoice.customerId).lean(),
          CompanySettingsModel.findOne().lean(),
        ]);

        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const primaryColor = '#000000';
        const secondaryColor = '#666666';
        const borderColor = '#E0E0E0';
        const accentColor = '#2E7D32';

        // Header - TAX INVOICE title only
        doc.fontSize(20).fillColor(primaryColor).text('TAX INVOICE', 50, 50);

        const companyName = (companySettings as any)?.companyName || 'Your Company';
        const gstNumber = (companySettings as any)?.gstNumber || '';

        // Logo
        let logoBottomY = 50;
        const logoPath = (companySettings as any)?.companyLogo;
        if (logoPath) {
          try {
            const filename = path.basename(logoPath);
            const cleanPath = logoPath.startsWith('/') || logoPath.startsWith('\\') ? logoPath.slice(1) : logoPath;

            const possiblePaths = [
              path.join(process.cwd(), cleanPath),
              path.join(process.cwd(), 'uploads', filename),
              logoPath
            ];

            for (const p of possiblePaths) {
              if (fs.existsSync(p)) {
                doc.image(p, 450, 40, { width: 100 });
                logoBottomY = 100;
                break;
              }
            }
          } catch (error) {
            logger.warn('Failed to load logo', { error });
          }
        }

        let contentY = 130;

        // Customer info (left side)
        doc.fontSize(9).fillColor(secondaryColor).text('Customer', 50, contentY);
        const customerName = (customer as any)?.name || '';
        const customerAddress = (customer as any)?.address || '';

        doc.fontSize(10).fillColor(primaryColor).text(customerName, 50, contentY + 15);
        if (customerAddress) {
          doc.fontSize(9).fillColor(primaryColor).text(customerAddress, 50, contentY + 30, { width: 200 });
        }

        // Invoice metadata (center)
        const metaLabelX = 280;
        const metaValueX = 280;
        let metaY = contentY;

        doc.fontSize(9).fillColor(secondaryColor).text('Invoice Date', metaLabelX, metaY, { width: 100 });
        doc.fillColor(primaryColor).text(
          invoice.issuedDate ? new Date(invoice.issuedDate).toLocaleDateString('en-NZ', {
            day: '2-digit', month: 'short', year: 'numeric'
          }) : new Date().toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' }),
          metaValueX, metaY + 15, { width: 100 }
        );
        metaY += 35;

        doc.fillColor(secondaryColor).text('Invoice Number', metaLabelX, metaY, { width: 100 });
        doc.fillColor(primaryColor).text(invoice.invoiceNumber || '', metaValueX, metaY + 15, { width: 100 });
        metaY += 35;

        if (gstNumber) {
          doc.fillColor(secondaryColor).text('GST Number', metaLabelX, metaY, { width: 100 });
          doc.fillColor(primaryColor).text(gstNumber, metaValueX, metaY + 15, { width: 100 });
        }

        // Franchise info (far right side)
        let rightY = contentY;
        const franchiseName = "Ahir Brothers Group Limited";
        const franchiseAddress = (franchise as any)?.address || '';
        const franchisePhone = (franchise as any)?.phoneNumber || '';

        doc.fontSize(10).fillColor(primaryColor).text(franchiseName, 400, rightY, { width: 150, align: 'right' });
        rightY += 15;

        if (franchiseAddress) {
          doc.fontSize(9).fillColor(primaryColor).text(franchiseAddress, 400, rightY, { width: 150, align: 'right' });
          rightY += 25;
        }

        if (franchisePhone) {
          doc.text(String(franchisePhone), 400, rightY, { width: 150, align: 'right' });
        }


        const tableTop = 250;
        doc.fontSize(9).fillColor(primaryColor);
        doc.font('Helvetica-Bold');
        doc.text('Description', 50, tableTop + 5);
        doc.text('Quantity', 350, tableTop + 5, { width: 50, align: 'center' });
        doc.text('Unit Price', 410, tableTop + 5, { width: 60, align: 'right' });
        doc.text('Amount NZD', 480, tableTop + 5, { width: 70, align: 'right' });
        doc.font('Helvetica');

        doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).strokeColor(borderColor).stroke();

        let currentY = tableTop + 30;
        invoice.items.forEach((item) => {
          const description = item.description ? `${item.name}\n${item.description}` : item.name;

          doc.fontSize(9).fillColor(primaryColor).text(description, 50, currentY, { width: 280 });
          doc.text(String(item.quantity), 350, currentY, { width: 50, align: 'center' });
          doc.text(item.unitPrice.toFixed(2), 410, currentY, { width: 60, align: 'right' });
          doc.text(item.price.toFixed(2), 480, currentY, { width: 70, align: 'right' });

          currentY += item.description ? 35 : 25;
        });

        doc.moveTo(50, currentY).lineTo(550, currentY).strokeColor(borderColor).stroke();

        const summaryY = currentY + 10;
        const labelX = 350;
        const valX = 480;

        doc.fontSize(9).fillColor(primaryColor);

        const gstRate = (companySettings as any)?.gstRate || 15;
        // GST-inclusive: extract GST already embedded in the price
        const totalAmount = invoice.totalAmount;
        const subtotal = Number((totalAmount / (1 + gstRate / 100)).toFixed(2));
        const tax = Number((totalAmount - subtotal).toFixed(2));

        doc.text('Subtotal', labelX, summaryY, { align: 'right', width: 120 });
        doc.text(subtotal.toFixed(2), valX, summaryY, { align: 'right', width: 70 });

        doc.text(`TOTAL GST @ ${gstRate}%`, labelX, summaryY + 15, { align: 'right', width: 120 });
        doc.text(tax.toFixed(2), valX, summaryY + 15, { align: 'right', width: 70 });

        doc.moveTo(labelX, summaryY + 30).lineTo(550, summaryY + 30).strokeColor(borderColor).stroke();

        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('TOTAL NZD', labelX, summaryY + 35, { align: 'right', width: 120 });
        doc.text(invoice.totalAmount.toFixed(2), valX, summaryY + 35, { align: 'right', width: 70 });
        doc.font('Helvetica');

        const paymentInfoY = summaryY + 70;

        const dueDate = new Date(invoice.createdAt);
        dueDate.setDate(dueDate.getDate() + 7);
        const dueDateStr = invoice.issuedDate
          ? new Date(invoice.issuedDate).toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' })
          : new Date().toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' });

        doc.font('Helvetica-Bold').fontSize(9).text(`Due Date: ${dueDateStr}`, 50, paymentInfoY);
        doc.font('Helvetica');

        const accountNumber = (franchise as any)?.accountNumber || process.env.BANK_ACCOUNT_NUMBER || '';

        doc.fontSize(9).fillColor(secondaryColor);
        doc.text(`Account Number: ${accountNumber}`, 50, paymentInfoY + 15);
        doc.text(`Particulars: ${companyName}`, 50, paymentInfoY + 30);
        doc.text(`Code: Address`, 50, paymentInfoY + 45);
        doc.text(`Reference: ${invoice.invoiceNumber}`, 50, paymentInfoY + 60);

        const pageBottom = 750;
        const adviceTop = 600;

        doc.moveTo(50, adviceTop).lineTo(550, adviceTop).dash(5, { space: 5 }).strokeColor(borderColor).stroke();
        doc.undash();

        doc.fontSize(14).fillColor(primaryColor).text('PAYMENT ADVICE', 50, adviceTop + 20);

        doc.fontSize(9).fillColor(secondaryColor);
        doc.text('To:', 50, adviceTop + 50);
        doc.fillColor(primaryColor).text(`Ahir Brothers Group Limited`, 50, adviceTop + 65);
        doc.fillColor(secondaryColor).text(`(Trading as ${companyName})`, 50, adviceTop + 80);

        const bankAccount = (companySettings as any)?.accountNumber || '';
        if (bankAccount) {
          doc.fillColor(secondaryColor).text(`Account: ${bankAccount}`, 50, adviceTop + 100);
        }

        const adviceRightX = 350;
        let adviceY = adviceTop + 50;

        doc.fillColor(secondaryColor).text('Customer', adviceRightX, adviceY);
        doc.fillColor(primaryColor).text(customerName, adviceRightX + 100, adviceY, { align: 'right' });
        adviceY += 15;

        doc.fillColor(secondaryColor).text('Invoice Number', adviceRightX, adviceY);
        doc.fillColor(primaryColor).text(invoice.invoiceNumber, adviceRightX + 100, adviceY, { align: 'right' });
        adviceY += 15;

        doc.fillColor(secondaryColor).text('Amount', adviceRightX, adviceY);
        doc.fillColor(primaryColor).text(invoice.totalAmount.toFixed(2), adviceRightX + 100, adviceY, { align: 'right' });
        adviceY += 15;

        doc.fillColor(secondaryColor).text('Due Date', adviceRightX, adviceY);
        doc.fillColor(primaryColor).text(dueDateStr, adviceRightX + 100, adviceY, { align: 'right' });
        adviceY += 15;

        doc.fillColor(secondaryColor).text('Amount Enclosed', adviceRightX, adviceY);
        doc.rect(adviceRightX + 100, adviceY, 100, 15).stroke(borderColor); // Box for amount

        doc.end();
      } catch (error) {
        logger.error('PDF generation error', { error });
        reject(error);
      }
    });
  }
}

