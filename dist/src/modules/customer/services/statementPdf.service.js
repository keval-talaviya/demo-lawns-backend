"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatementPdfService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const companySettings_model_1 = require("../../companySettings/model/companySettings.model");
const logger_1 = require("../../../common/logger");
const constants_1 = require("../../../common/constants");
class StatementPdfService {
    static async generateStatementPDF(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const companySettings = await companySettings_model_1.CompanySettingsModel.findOne().lean();
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
                const accentColor = '#2E7D32'; // Green brand color
                // --- Header ---
                doc.fontSize(20).fillColor(primaryColor).text('STATEMENT OF ACCOUNT', 50, 50);
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
                        logger_1.logger.warn('Failed to load logo for statement', { error });
                    }
                }
                let contentY = 120;
                // --- Customer Info ---
                doc.fontSize(9).fillColor(secondaryColor).text('To:', 50, contentY);
                doc.fontSize(10).fillColor(primaryColor).font('Helvetica-Bold').text(data.customer.name, 50, contentY + 15);
                doc.font('Helvetica');
                if (data.customer.email) {
                    doc.fontSize(9).fillColor(secondaryColor).text(data.customer.email, 50, contentY + 30);
                }
                if (data.customer.phone) {
                    doc.text(String(data.customer.phone), 50, contentY + 45);
                }
                if (data.customer.address) {
                    doc.text(data.customer.address, 50, contentY + 60, { width: 200 });
                }
                // --- Statement Details (Right Side) ---
                const metaX = 350;
                const metaValX = 450;
                let metaY = contentY;
                doc.fontSize(9).fillColor(secondaryColor).text('Statement Period', metaX, metaY, { width: 100 });
                const dateRange = `${data.fromDate.toLocaleDateString('en-NZ')} - ${data.toDate.toLocaleDateString('en-NZ')}`;
                doc.fillColor(primaryColor).text(dateRange, metaValX, metaY, { width: 100, align: 'right' });
                metaY += 20;
                doc.fillColor(secondaryColor).text('Generated On', metaX, metaY, { width: 100 });
                doc.fillColor(primaryColor).text(new Date().toLocaleDateString('en-NZ'), metaValX, metaY, { width: 100, align: 'right' });
                metaY += 20;
                // --- Table ---
                const tableTop = 250;
                const dateX = 50;
                const descX = 130;
                const debitX = 350;
                const creditX = 420;
                const balanceX = 490;
                // Table Headers
                doc.fontSize(9).fillColor(secondaryColor).font('Helvetica-Bold');
                doc.text('Date', dateX, tableTop);
                doc.text('Description', descX, tableTop);
                doc.text('Debit', debitX, tableTop, { width: 60, align: 'right' });
                doc.text('Credit', creditX, tableTop, { width: 60, align: 'right' });
                doc.text('Balance', balanceX, tableTop, { width: 60, align: 'right' });
                doc.font('Helvetica');
                doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor(borderColor).stroke();
                let currentY = tableTop + 30;
                // Opening Balance Row
                doc.fillColor(primaryColor).text(data.fromDate.toLocaleDateString('en-NZ'), dateX, currentY);
                doc.font('Helvetica-Bold').text('Opening Balance', descX, currentY);
                doc.font('Helvetica');
                doc.text(data.openingBalance.toFixed(2), balanceX, currentY, { width: 60, align: 'right' });
                currentY += 25;
                doc.moveTo(50, currentY - 10).lineTo(550, currentY - 10).strokeColor('#F5F5F5').stroke();
                // Transactions
                let runningBalance = data.openingBalance;
                data.transactions.forEach((txn) => {
                    if (currentY > 720) {
                        doc.addPage();
                        // Re-draw headers on new page
                        doc.fontSize(9).fillColor(secondaryColor).font('Helvetica-Bold');
                        doc.text('Date', dateX, 50);
                        doc.text('Description', descX, 50);
                        doc.text('Debit', debitX, 50, { width: 60, align: 'right' });
                        doc.text('Credit', creditX, 50, { width: 60, align: 'right' });
                        doc.text('Balance', balanceX, 50, { width: 60, align: 'right' });
                        doc.font('Helvetica');
                        doc.moveTo(50, 65).lineTo(550, 65).strokeColor(borderColor).stroke();
                        currentY = 80;
                    }
                    const date = new Date(txn.createdAt || txn.date).toLocaleDateString('en-NZ');
                    // Build description
                    let desc = txn.purpose || txn.remarks || 'Transaction';
                    // If linked to an invoice, use concise "Invoice #..." description per user request
                    if (txn.invoiceId && txn.invoiceId.invoiceNumber) {
                        desc = `Invoice #${txn.invoiceId.invoiceNumber}`;
                    }
                    let debit = '';
                    let credit = '';
                    const amount = Math.abs(txn.amount);
                    if (txn.type === constants_1.TRANSACTION_TYPE.WITHDRAW) {
                        // Charge/Invoice - shows in Debit, decreases balance (customer owes more)
                        debit = amount.toFixed(2);
                        runningBalance -= amount;
                    }
                    else {
                        // Payment - shows in Credit, increases balance (customer owes less)
                        credit = amount.toFixed(2);
                        runningBalance += amount;
                    }
                    doc.fillColor(primaryColor).fontSize(9);
                    doc.text(date, dateX, currentY);
                    doc.text(desc, descX, currentY, { width: 210, lineGap: 2 });
                    // Debit in red
                    if (debit) {
                        doc.fillColor('#D32F2F').text(debit, debitX, currentY, { width: 60, align: 'right' });
                    }
                    // Credit in green
                    if (credit) {
                        doc.fillColor('#2E7D32').text(credit, creditX, currentY, { width: 60, align: 'right' });
                    }
                    // Balance - negative in red, positive/zero in black
                    doc.fillColor(runningBalance < 0 ? '#D32F2F' : primaryColor);
                    doc.text(runningBalance.toFixed(2), balanceX, currentY, { width: 60, align: 'right' });
                    currentY += 25;
                    // Subtle row separator
                    doc.moveTo(50, currentY - 5).lineTo(550, currentY - 5).strokeColor('#F5F5F5').stroke();
                });
                doc.moveTo(50, currentY + 10).lineTo(550, currentY + 10).strokeColor(borderColor).stroke();
                // --- Summary ---
                const summaryY = currentY + 30;
                const summaryLabelX = 350;
                const summaryValX = 490;
                doc.fontSize(11).font('Helvetica-Bold');
                // Determine label and color based on balance
                const balanceLabel = data.closingBalance < 0 ? 'Amount Owed' : data.closingBalance > 0 ? 'Credit Balance' : 'Closing Balance';
                const balanceColor = data.closingBalance < 0 ? '#D32F2F' : data.closingBalance > 0 ? '#2E7D32' : primaryColor;
                doc.fillColor(secondaryColor).text(balanceLabel, summaryLabelX, summaryY, { width: 130, align: 'right' });
                doc.fontSize(14).fillColor(balanceColor).text(Math.abs(data.closingBalance).toFixed(2), summaryValX, summaryY, { width: 60, align: 'right' });
                doc.end();
            }
            catch (error) {
                logger_1.logger.error('Statement PDF generation error', { error });
                reject(error);
            }
        });
    }
}
exports.StatementPdfService = StatementPdfService;
//# sourceMappingURL=statementPdf.service.js.map