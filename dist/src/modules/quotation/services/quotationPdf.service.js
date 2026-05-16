"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationPdfService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const user_model_1 = require("../../user/model/user.model");
const companySettings_model_1 = require("../../companySettings/model/companySettings.model");
const logger_1 = require("../../../common/logger");
class QuotationPdfService {
    static async generateQuotationPDF(quotation) {
        return new Promise(async (resolve, reject) => {
            try {
                const [franchise, companySettings] = await Promise.all([
                    user_model_1.UserModel.findById(quotation.franchiseId).lean(),
                    companySettings_model_1.CompanySettingsModel.findOne().lean(),
                ]);
                const doc = new pdfkit_1.default({
                    size: 'A4',
                    margin: 50,
                });
                const chunks = [];
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);
                const primaryColor = '#000000';
                const secondaryColor = '#666666';
                const borderColor = '#E0E0E0';
                const accentColor = '#2E7D32';
                // Header - QUOTE title only
                doc.fontSize(20).fillColor(primaryColor).text('QUOTE', 50, 50);
                const gstNumber = companySettings?.gstNumber || '';
                // Logo
                let logoBottomY = 50;
                const logoPath = companySettings?.companyLogo;
                if (logoPath) {
                    try {
                        const filename = path_1.default.basename(logoPath);
                        const cleanPath = logoPath.startsWith('/') || logoPath.startsWith('\\') ? logoPath.slice(1) : logoPath;
                        const possiblePaths = [
                            path_1.default.join(process.cwd(), cleanPath),
                            path_1.default.join(process.cwd(), 'uploads', filename),
                            logoPath
                        ];
                        for (const p of possiblePaths) {
                            if (fs_1.default.existsSync(p)) {
                                doc.image(p, 450, 40, { width: 100 });
                                logoBottomY = 100;
                                break;
                            }
                        }
                    }
                    catch (error) {
                        logger_1.logger.warn('Failed to load logo', { error });
                    }
                }
                let contentY = 130;
                // Customer info (left side)
                doc.fontSize(9).fillColor(secondaryColor).text('Customer', 50, contentY);
                const customerName = quotation.customerName || '';
                const customerAddress = quotation.customerAddress || '';
                const customerEmail = quotation.customerEmail || '';
                doc.fontSize(10).fillColor(primaryColor).text(customerName, 50, contentY + 15);
                if (customerEmail) {
                    doc.fontSize(9).fillColor(accentColor).text(customerEmail, 50, contentY + 30);
                }
                if (customerAddress) {
                    doc.fontSize(9).fillColor(primaryColor).text(customerAddress, 50, contentY + 45, { width: 200 });
                }
                // Quote metadata (right side)
                const metaLabelX = 350;
                const metaValueX = 450;
                let metaY = contentY;
                doc.fontSize(9).fillColor(secondaryColor).text('Date', metaLabelX, metaY, { width: 100 });
                doc.fillColor(primaryColor).text(quotation.quotationDate ? new Date(quotation.quotationDate).toLocaleDateString('en-NZ', {
                    day: '2-digit', month: 'short', year: 'numeric'
                }) : new Date().toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' }), metaValueX, metaY, { width: 100, align: 'right' });
                metaY += 20;
                doc.fillColor(secondaryColor).text('Expiry', metaLabelX, metaY, { width: 100 });
                const expiryDate = quotation.expiryDate ? new Date(quotation.expiryDate).toLocaleDateString('en-NZ', {
                    day: '2-digit', month: 'short', year: 'numeric'
                }) : '';
                doc.fillColor(primaryColor).text(expiryDate, metaValueX, metaY, { width: 100, align: 'right' });
                metaY += 20;
                doc.fillColor(secondaryColor).text('Quote Number', metaLabelX, metaY, { width: 100 });
                doc.fillColor(primaryColor).text(quotation.uniqueCode || '', metaValueX, metaY, { width: 100, align: 'right' });
                metaY += 20;
                doc.fillColor(secondaryColor).text('Reference', metaLabelX, metaY, { width: 100 });
                const referenceName = quotation.referenceName || quotation.customerName || '';
                doc.fillColor(primaryColor).text(referenceName, metaValueX, metaY, { width: 100, align: 'right' });
                metaY += 20;
                if (gstNumber) {
                    doc.fillColor(secondaryColor).text('GST Number', metaLabelX, metaY, { width: 100 });
                    doc.fillColor(primaryColor).text(gstNumber, metaValueX, metaY, { width: 100, align: 'right' });
                }
                // Franchise info removed - not displayed in quotation PDF
                /*
                let rightY = contentY;
                const franchiseName = (franchise as any)?.name || '';
                const franchiseAddress = (franchise as any)?.address || '';
                const franchisePhone = (franchise as any)?.phoneNumber || '';
                const franchiseEmail = (franchise as any)?.email || '';

                if (franchiseEmail) {
                    doc.fontSize(9).fillColor(accentColor).text(franchiseEmail, 400, rightY, { width: 150, align: 'right' });
                    rightY += 15;
                }

                doc.fontSize(10).fillColor(primaryColor).text(franchiseName, 400, rightY, { width: 150, align: 'right' });
                rightY += 15;

                if (franchiseAddress) {
                    doc.fontSize(9).fillColor(primaryColor).text(franchiseAddress, 400, rightY, { width: 150, align: 'right' });
                    rightY += 25;
                }

                if (franchisePhone) {
                    doc.text(String(franchisePhone), 400, rightY, { width: 150, align: 'right' });
                }
                */
                // Items table
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
                quotation.items.forEach((item) => {
                    const description = item.description || item.description;
                    doc.fontSize(9).fillColor(primaryColor).text(description, 50, currentY, { width: 280 });
                    doc.text(String(item.qty), 350, currentY, { width: 50, align: 'center' });
                    doc.text(item.rate.toFixed(2), 410, currentY, { width: 60, align: 'right' });
                    doc.text(item.total.toFixed(2), 480, currentY, { width: 70, align: 'right' });
                    currentY += 25;
                });
                doc.moveTo(50, currentY).lineTo(550, currentY).strokeColor(borderColor).stroke();
                // Summary
                const summaryY = currentY + 10;
                const labelX = 350;
                const valX = 480;
                doc.fontSize(9).fillColor(primaryColor);
                const gstRate = companySettings?.gstRate || 15;
                // GST-inclusive: extract GST already embedded in the price
                const totalAmount = quotation.totalAmount;
                const subtotal = Number((totalAmount / (1 + gstRate / 100)).toFixed(2));
                const tax = Number((totalAmount - subtotal).toFixed(2));
                doc.text('Subtotal', labelX, summaryY, { align: 'right', width: 120 });
                doc.text(subtotal.toFixed(2), valX, summaryY, { align: 'right', width: 70 });
                doc.text(`TOTAL GST @ ${gstRate}%`, labelX, summaryY + 15, { align: 'right', width: 120 });
                doc.text(tax.toFixed(2), valX, summaryY + 15, { align: 'right', width: 70 });
                doc.moveTo(labelX, summaryY + 30).lineTo(550, summaryY + 30).strokeColor(borderColor).stroke();
                doc.font('Helvetica-Bold').fontSize(10);
                doc.text('TOTAL NZD', labelX, summaryY + 35, { align: 'right', width: 120 });
                doc.text(totalAmount.toFixed(2), valX, summaryY + 35, { align: 'right', width: 70 });
                doc.font('Helvetica');
                doc.end();
            }
            catch (error) {
                logger_1.logger.error('Quotation PDF generation error', { error });
                reject(error);
            }
        });
    }
}
exports.QuotationPdfService = QuotationPdfService;
//# sourceMappingURL=quotationPdf.service.js.map