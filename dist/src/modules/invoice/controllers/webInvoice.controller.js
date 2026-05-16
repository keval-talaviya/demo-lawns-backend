"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebInvoiceController = void 0;
const http_status_codes_1 = require("http-status-codes");
const invoice_service_1 = require("../services/invoice.service");
const customer_model_1 = require("../../customer/model/customer.model");
const response_1 = require("../../../common/response");
const message_1 = require("../messages/message");
const mongoose_1 = require("mongoose");
const constants_1 = require("../../../common/constants");
const invoicePdf_service_1 = require("../services/invoicePdf.service");
const invoice_mailer_1 = require("../../../services/invoice.mailer");
const companySettings_model_1 = require("../../companySettings/model/companySettings.model");
function toObjectIdOrNull(id) {
    if (!id)
        return null;
    if (mongoose_1.Types.ObjectId.isValid(id))
        return new mongoose_1.Types.ObjectId(id);
    return null;
}
function franchiseAccessAllowed(resourceFranchiseId, userFranchiseId) {
    if (!resourceFranchiseId)
        return true;
    if (!userFranchiseId)
        return false;
    const rId = resourceFranchiseId._id || resourceFranchiseId;
    return String(rId) === String(userFranchiseId);
}
exports.WebInvoiceController = {
    async list(req, res) {
        try {
            const page = Math.max(1, Number(req.body.page) || 1);
            const limit = Math.max(1, Number(req.body.limit) || 25);
            const filter = { isDeleted: false };
            const loggedUser = req.user;
            // Role-based franchise scoping
            if (loggedUser && Number(loggedUser.role) === constants_1.ROLES.FRANCHISE_ADMIN) {
                const userFid = toObjectIdOrNull(loggedUser.id);
                if (userFid)
                    filter.franchiseId = userFid;
            }
            else if (loggedUser && Number(loggedUser.role) === constants_1.ROLES.MASTER_ADMIN) {
                if (req.body.franchiseId && req.body.franchiseId !== '') {
                    const qfid = toObjectIdOrNull(req.body.franchiseId);
                    if (qfid)
                        filter.franchiseId = qfid;
                }
            }
            // General search (invoice number)
            if (req.body.search && req.body.search !== '') {
                const s = String(req.body.search).trim();
                filter.$or = [
                    { invoiceNumber: { $regex: s, $options: 'i' } },
                ];
            }
            // Exact / specific invoice number filter (UI: Enter Invoice No)
            if (req.body.invoiceNumber && req.body.invoiceNumber !== '') {
                filter.invoiceNumber = String(req.body.invoiceNumber).trim();
            }
            // Payment type filter (UI: Payment Type)
            if (req.body.paymentType !== undefined && req.body.paymentType !== '') {
                filter.paymentType = Number(req.body.paymentType);
            }
            // Search customer by name / email / phone (UI: Search Customer)
            if (req.body.searchCustomer && req.body.searchCustomer !== '') {
                const s = String(req.body.searchCustomer).trim();
                const customerIds = await customer_model_1.CustomerModel.find({
                    $or: [
                        { name: { $regex: s, $options: 'i' } },
                        { email: { $regex: s, $options: 'i' } },
                        { phone: { $regex: s, $options: 'i' } },
                    ],
                }).select('_id').lean();
                const ids = Array.isArray(customerIds) ? customerIds.map((c) => c._id) : [];
                // If no matching customers found, set filter to return no results
                if (ids.length === 0) {
                    filter.customerId = { $in: [] };
                }
                else {
                    filter.customerId = { $in: ids };
                }
            }
            if (req.body.status !== undefined && req.body.status !== '') {
                filter.status = Number(req.body.status);
            }
            if (req.body.customerId && req.body.customerId !== '') {
                const cid = toObjectIdOrNull(req.body.customerId);
                if (cid)
                    filter.customerId = cid;
            }
            if (req.body.jobId && req.body.jobId !== '') {
                const jid = toObjectIdOrNull(req.body.jobId);
                if (jid)
                    filter.jobId = jid;
            }
            // Invoice Date Filter (issuedDate) - Matches full day
            if (req.body.invoiceDate) {
                const d = new Date(String(req.body.invoiceDate));
                if (!isNaN(d.getTime())) {
                    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                    const start = new Date(dateOnly);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(dateOnly);
                    end.setHours(23, 59, 59, 999);
                    filter.issuedDate = { $gte: start, $lte: end };
                }
            }
            // CreatedAt Date Range
            if (req.body.fromDate || req.body.toDate) {
                filter.createdAt = {};
                if (req.body.fromDate)
                    filter.createdAt.$gte = new Date(String(req.body.fromDate));
                if (req.body.toDate)
                    filter.createdAt.$lte = new Date(String(req.body.toDate));
                if (Object.keys(filter.createdAt).length === 0)
                    delete filter.createdAt;
            }
            let sort = { createdAt: -1 };
            if (req.body.sortBy) {
                const parts = String(req.body.sortBy).split(':');
                sort = { [parts[0]]: parts[1] === 'asc' ? 1 : -1 };
            }
            const result = await invoice_service_1.InvoiceService.paginate(filter, { page, limit, sort });
            return (0, response_1.successResponse)(res, result, message_1.INVOICE_MESSAGES.LISTED);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list invoices', { error });
        }
    },
    async getById(req, res) {
        try {
            const id = req.query.id;
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid invoice id');
            }
            const invoice = await invoice_service_1.InvoiceService.findById(id);
            if (!invoice) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, message_1.INVOICE_MESSAGES.NOT_FOUND);
            }
            const loggedUser = req.user;
            const role = loggedUser ? Number(loggedUser.role) : null;
            // Master admin can access all invoices
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                return (0, response_1.successResponse)(res, invoice, message_1.INVOICE_MESSAGES.DETAILS_FETCHED);
            }
            // Franchise admin can only access their own franchise invoices
            if (role === constants_1.ROLES.FRANCHISE_ADMIN && loggedUser) {
                const userFranchiseId = toObjectIdOrNull(loggedUser.id);
                if (!franchiseAccessAllowed(invoice.franchiseId, userFranchiseId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                return (0, response_1.successResponse)(res, invoice, message_1.INVOICE_MESSAGES.DETAILS_FETCHED);
            }
            // Other roles cannot access
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get invoice', { error });
        }
    },
    async markAsPaid(req, res) {
        try {
            const id = req.query.id;
            if (!mongoose_1.Types.ObjectId.isValid(id))
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid invoice id');
            const invoice = await invoice_service_1.InvoiceService.findById(id);
            if (!invoice)
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, message_1.INVOICE_MESSAGES.NOT_FOUND);
            const loggedUser = req.user;
            if (!loggedUser)
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            const role = Number(loggedUser.role);
            // Master admin can access all invoices
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                const { amount, paymentDate } = req.body;
                const updated = await invoice_service_1.InvoiceService.markAsPaid(id, amount, paymentDate);
                return (0, response_1.successResponse)(res, updated, message_1.INVOICE_MESSAGES.PAID);
            }
            // Franchise admin can only update their own franchise invoices
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                if (!franchiseAccessAllowed(invoice.franchiseId, toObjectIdOrNull(loggedUser.id))) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                const { amount, paymentDate } = req.body;
                const updated = await invoice_service_1.InvoiceService.markAsPaid(id, amount, paymentDate);
                return (0, response_1.successResponse)(res, updated, message_1.INVOICE_MESSAGES.PAID);
            }
            // Other roles cannot access
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to mark invoice as paid', { error });
        }
    },
    async cancel(req, res) {
        try {
            const id = req.query.id;
            if (!mongoose_1.Types.ObjectId.isValid(id))
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid invoice id');
            const invoice = await invoice_service_1.InvoiceService.findById(id);
            if (!invoice)
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, message_1.INVOICE_MESSAGES.NOT_FOUND);
            const loggedUser = req.user;
            if (!loggedUser)
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            const role = Number(loggedUser.role);
            // Master admin can access all invoices
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                const updated = await invoice_service_1.InvoiceService.cancelInvoice(id);
                return (0, response_1.successResponse)(res, updated, message_1.INVOICE_MESSAGES.CANCELLED);
            }
            // Franchise admin can only update their own franchise invoices
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                if (!franchiseAccessAllowed(invoice.franchiseId, toObjectIdOrNull(loggedUser.id))) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                const updated = await invoice_service_1.InvoiceService.cancelInvoice(id);
                return (0, response_1.successResponse)(res, updated, message_1.INVOICE_MESSAGES.CANCELLED);
            }
            // Other roles cannot access
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to cancel invoice', { error });
        }
    },
    async downloadPDF(req, res) {
        try {
            const id = req.query.id;
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid invoice id');
            }
            const invoice = await invoice_service_1.InvoiceService.findById(id);
            if (!invoice) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, message_1.INVOICE_MESSAGES.NOT_FOUND);
            }
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            // Master admin can access all invoices
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                const pdfBuffer = await invoicePdf_service_1.InvoicePdfService.generateInvoicePDF(invoice);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Length', pdfBuffer.length.toString());
                res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
                return res.send(pdfBuffer);
            }
            // Franchise admin can only access their own franchise invoices
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                if (!franchiseAccessAllowed(invoice.franchiseId, toObjectIdOrNull(loggedUser.id))) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                const pdfBuffer = await invoicePdf_service_1.InvoicePdfService.generateInvoicePDF(invoice);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Length', pdfBuffer.length.toString());
                res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
                return res.send(pdfBuffer);
            }
            // Other roles cannot access
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to generate PDF', { error });
        }
    },
    async update(req, res) {
        console.log('--- [DEBUG] WebInvoiceController.update: Starting Update Process ---');
        try {
            const id = req.query.id;
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid invoice id');
            }
            const invoice = await invoice_service_1.InvoiceService.findById(id);
            if (!invoice) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, message_1.INVOICE_MESSAGES.NOT_FOUND);
            }
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            // Only Master Admin can update line items
            if (role !== constants_1.ROLES.MASTER_ADMIN) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Only Master Admin can update invoices');
            }
            // Only Unpaid, Partial, and Overdue invoices can be updated
            const editableStatuses = [constants_1.INVOICE_STATUS.UNPAID, constants_1.INVOICE_STATUS.PARTIAL, constants_1.INVOICE_STATUS.OVERDUE];
            if (!editableStatuses.includes(invoice.status)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Only unpaid, partial, or overdue invoices can be updated');
            }
            const updated = await invoice_service_1.InvoiceService.updateInvoice(id, req.body);
            return (0, response_1.successResponse)(res, updated, message_1.INVOICE_MESSAGES.UPDATED);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to update invoice', { error });
        }
    },
    async sendEmail(req, res) {
        try {
            const id = (req.query.id || req.body.id);
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid invoice id');
            }
            // Fetch invoice with populated customer and franchise
            const invoice = await invoice_service_1.InvoiceService.findById(id);
            if (!invoice) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, message_1.INVOICE_MESSAGES.NOT_FOUND);
            }
            const loggedUser = req.user;
            if (!loggedUser)
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            const role = Number(loggedUser.role);
            // Franchise admin can only send their own franchise invoices
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                const userFranchiseId = toObjectIdOrNull(loggedUser.id);
                if (!franchiseAccessAllowed(invoice.franchiseId, userFranchiseId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
            }
            // Fetch company settings
            const companySettings = await companySettings_model_1.CompanySettingsModel.findOne().lean();
            const companyName = companySettings?.companyName || 'Your Company';
            const gstRate = companySettings?.gstRate || 15;
            const gstNumber = companySettings?.gstNumber || '';
            const customer = invoice.customerId ?? {};
            const franchise = invoice.franchiseId ?? {};
            if (!customer.email) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Customer does not have an email address');
            }
            // Prepare data for mailer
            const invoiceEmailData = {
                invoiceNumber: invoice.invoiceNumber || `INV-${invoice._id}`,
                customerName: customer.name || 'Valued Customer',
                customerAddress: customer.address,
                issuedDate: invoice.issuedDate || new Date(),
                items: invoice.items || [],
                subtotal: invoice.subtotal || 0,
                tax: invoice.tax || 0,
                totalAmount: invoice.totalAmount || 0,
                paidAmount: invoice.paidAmount || 0,
                paymentStatus: invoice.status === 3 ? 'PAID' : 'UNPAID',
                jobAddress: invoice.jobAddress,
                companyName,
                gstRate,
                gstNumber,
            };
            const franchiseEmailData = {
                invoiceNumber: invoice.invoiceNumber || `INV-${invoice._id}`,
                customerName: customer.name || 'Customer',
                franchiseName: franchise.name || 'Franchise',
                customerEmail: customer.email,
                issuedDate: invoice.issuedDate || new Date(),
                totalAmount: invoice.totalAmount || 0,
                paidAmount: invoice.paidAmount || 0,
                paymentStatus: invoice.status === 3 ? 'PAID' : 'UNPAID',
                jobAddress: invoice.jobAddress,
                companyName,
            };
            // Send emails (background)
            (0, invoice_mailer_1.sendInvoiceEmails)(invoiceEmailData, franchiseEmailData).catch((error) => {
                console.error('Manual send-email failed:', error);
            });
            return (0, response_1.successResponse)(res, null, 'Invoice email sent successfully.');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send invoice email', { error });
        }
    },
};
//# sourceMappingURL=webInvoice.controller.js.map