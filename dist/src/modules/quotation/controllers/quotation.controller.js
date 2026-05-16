"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationController = void 0;
const http_status_codes_1 = require("http-status-codes");
const quotation_service_1 = require("../services/quotation.service");
const response_1 = require("../../../common/response");
const message_1 = require("../messages/message");
const mongoose_1 = require("mongoose");
const constants_1 = require("../../../common/constants");
const logger_1 = require("../../../common/logger");
const quotation_mailer_1 = require("../../../services/quotation.mailer");
const quotationPdf_service_1 = require("../services/quotationPdf.service");
const quotation_model_1 = require("../model/quotation.model");
function toObjectId(id) {
    if (!id)
        return undefined;
    if (mongoose_1.Types.ObjectId.isValid(id))
        return new mongoose_1.Types.ObjectId(id);
    return undefined;
}
function franchiseAccessAllowed(resourceFranchiseId, userFranchiseId) {
    if (!resourceFranchiseId)
        return true;
    if (!userFranchiseId)
        return false;
    const rId = resourceFranchiseId._id || resourceFranchiseId;
    return String(rId) === String(userFranchiseId);
}
exports.QuotationController = {
    async create(req, res) {
        try {
            const loggedUser = req.user;
            let franchiseId;
            if (loggedUser && Number(loggedUser.role) === constants_1.ROLES.FRANCHISE_ADMIN) {
                franchiseId = toObjectId(loggedUser.franchiseId || loggedUser.id);
            }
            else if (loggedUser && Number(loggedUser.role) === constants_1.ROLES.MASTER_ADMIN) {
                franchiseId = req.body?.franchiseId ? toObjectId(req.body.franchiseId) : undefined;
            }
            const payload = { ...req.body, franchiseId };
            const quotation = await quotation_service_1.QuotationService.createQuotation(payload, franchiseId || null);
            // ✅ (Optional) Log
            logger_1.logger.debug('Quotation created:', { quotationId: quotation._id });
            // ✅ Response
            res.status(http_status_codes_1.StatusCodes.CREATED);
            return (0, response_1.successResponse)(res, quotation, message_1.QUOTATION_MESSAGES.CREATED);
        }
        catch (error) {
            logger_1.logger.error('Error creating quotation:', error);
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to create quotation', { error });
        }
    },
    async list(req, res) {
        try {
            const page = Math.max(1, Number(req.body.page) || 1);
            const limit = Math.max(1, Number(req.body.limit) || 25);
            const filter = {};
            const loggedUser = req.user;
            if (loggedUser && Number(loggedUser.role) === constants_1.ROLES.FRANCHISE_ADMIN) {
                const userFid = toObjectId(loggedUser.id);
                if (userFid)
                    filter.franchiseId = userFid;
            }
            else if (loggedUser && Number(loggedUser.role) === constants_1.ROLES.MASTER_ADMIN) {
                if (req.body.franchiseId) {
                    const qfid = toObjectId(req.body.franchiseId);
                    if (qfid)
                        filter.franchiseId = qfid;
                }
            }
            if (req.body.customerName) {
                filter.customerName = { $regex: req.body.customerName, $options: 'i' };
            }
            if (req.body.status) {
                filter.status = Number(req.body.status);
            }
            if (req.body.search) {
                const s = String(req.body.search).trim();
                filter.$or = [
                    { uniqueCode: { $regex: s, $options: 'i' } },
                    { customerAddress: { $regex: s, $options: 'i' } },
                    { notes: { $regex: s, $options: 'i' } }
                ];
            }
            if (req.body.fromDate || req.body.toDate) {
                filter.quotationDate = {};
                if (req.body.fromDate)
                    filter.quotationDate.$gte = new Date(String(req.body.fromDate));
                if (req.body.toDate)
                    filter.quotationDate.$lte = new Date(String(req.body.toDate));
                if (Object.keys(filter.quotationDate).length === 0)
                    delete filter.quotationDate;
            }
            let sort = { createdAt: -1 };
            if (req.body.sortBy) {
                const parts = String(req.body.sortBy).split(':');
                sort = { [parts[0]]: parts[1] === 'asc' ? 1 : -1 };
            }
            const populate = [
                { path: 'franchiseId', select: 'name code email phone address' },
                { path: 'franchiseId', select: 'name code email phone address' }
            ];
            const result = await quotation_service_1.QuotationService.paginateQuotations(filter, { page, limit, sort, populate });
            return (0, response_1.successResponse)(res, result, message_1.QUOTATION_MESSAGES.LISTED);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list quotations', { error });
        }
    },
    async getById(req, res) {
        try {
            const id = req.params.id;
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid quotation id');
            }
            const quotation = await quotation_service_1.QuotationService.getQuotationById(id);
            if (!quotation) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'Quotation not found');
            }
            const loggedUser = req.user;
            const role = loggedUser ? Number(loggedUser.role) : null;
            // Master admin can access all quotations
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                return (0, response_1.successResponse)(res, quotation, 'Quotation retrieved successfully');
            }
            // Franchise admin can only access their own franchise quotations
            if (role === constants_1.ROLES.FRANCHISE_ADMIN && loggedUser) {
                const userFranchiseId = toObjectId(loggedUser.id);
                if (!franchiseAccessAllowed(quotation.franchiseId, userFranchiseId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                return (0, response_1.successResponse)(res, quotation, 'Quotation retrieved successfully');
            }
            // Other roles cannot access
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get quotation', { error });
        }
    },
    async update(req, res) {
        try {
            const id = req.params.id;
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid quotation id');
            }
            const quotation = await quotation_service_1.QuotationService.findById(id);
            if (!quotation) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'Quotation not found');
            }
            const loggedUser = req.user;
            const role = loggedUser ? Number(loggedUser.role) : null;
            // Master admin can access all quotations
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                const updated = await quotation_service_1.QuotationService.updateQuotation(id, req.body);
                return (0, response_1.successResponse)(res, updated, message_1.QUOTATION_MESSAGES.UPDATED);
            }
            // Franchise admin can only update their own franchise quotations
            if (role === constants_1.ROLES.FRANCHISE_ADMIN && loggedUser) {
                const userFranchiseId = toObjectId(loggedUser.id);
                if (!franchiseAccessAllowed(quotation.franchiseId, userFranchiseId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                const updatePayload = { ...req.body };
                delete updatePayload.franchiseId;
                const updated = await quotation_service_1.QuotationService.updateQuotation(id, updatePayload);
                return (0, response_1.successResponse)(res, updated, message_1.QUOTATION_MESSAGES.UPDATED);
            }
            // Other roles cannot access
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to update quotation', { error });
        }
    },
    async remove(req, res) {
        try {
            const id = req.params.id;
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid quotation id');
            }
            const quotation = await quotation_service_1.QuotationService.findById(id);
            if (!quotation) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'Quotation not found');
            }
            const loggedUser = req.user;
            const role = loggedUser ? Number(loggedUser.role) : null;
            // Master admin can access all quotations
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                await quotation_service_1.QuotationService.deleteById(id);
                return res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
            }
            // Franchise admin can only delete their own franchise quotations
            if (role === constants_1.ROLES.FRANCHISE_ADMIN && loggedUser) {
                const userFranchiseId = toObjectId(loggedUser.id);
                if (!franchiseAccessAllowed(quotation.franchiseId, userFranchiseId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                await quotation_service_1.QuotationService.deleteById(id);
                return res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
            }
            // Other roles cannot access
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete quotation', { error });
        }
    },
    async send(req, res) {
        try {
            const id = req.query.id;
            console.log("id", id);
            if (!id) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid quotation id');
            }
            const quotation = await quotation_service_1.QuotationService.findById(id);
            if (!quotation) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'Quotation not found');
            }
            const loggedUser = req.user;
            const role = loggedUser ? Number(loggedUser.role) : null;
            // Master admin can access all quotations
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                await (0, quotation_mailer_1.sendQuotationEmails)(quotation);
                return (0, response_1.successResponse)(res, null, 'Quotation sent successfully');
            }
            // Franchise admin can only access their own franchise quotations
            if (role === constants_1.ROLES.FRANCHISE_ADMIN && loggedUser) {
                const userFranchiseId = toObjectId(loggedUser.id);
                if (!franchiseAccessAllowed(quotation.franchiseId, userFranchiseId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                await (0, quotation_mailer_1.sendQuotationEmails)(quotation);
                return (0, response_1.successResponse)(res, null, 'Quotation sent successfully');
            }
            // Other roles cannot access
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send quotation', { error });
        }
    },
    async downloadPDF(req, res) {
        try {
            const id = req.query.id;
            if (!id || typeof id !== 'string' || !mongoose_1.Types.ObjectId.isValid(id)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid quotation id');
            }
            const quotation = await quotation_model_1.QuotationModel.findById(id).lean();
            if (!quotation) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'Quotation not found');
            }
            const loggedUser = req.user;
            const role = loggedUser ? Number(loggedUser.role) : null;
            // Master admin can access all quotations
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                const pdfBuffer = await quotationPdf_service_1.QuotationPdfService.generateQuotationPDF(quotation);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Length', pdfBuffer.length.toString());
                res.setHeader('Content-Disposition', `attachment; filename="quotation-${quotation.uniqueCode || id}.pdf"`);
                return res.send(pdfBuffer);
            }
            // Franchise admin can only access their own franchise quotations
            if (role === constants_1.ROLES.FRANCHISE_ADMIN && loggedUser) {
                const userFranchiseId = toObjectId(loggedUser.id);
                if (!franchiseAccessAllowed(quotation.franchiseId, userFranchiseId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                const pdfBuffer = await quotationPdf_service_1.QuotationPdfService.generateQuotationPDF(quotation);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Length', pdfBuffer.length.toString());
                res.setHeader('Content-Disposition', `attachment; filename="quotation-${quotation.uniqueCode || id}.pdf"`);
                return res.send(pdfBuffer);
            }
            // Other roles cannot access
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            logger_1.logger.error('Failed to download quotation PDF', { error });
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to download PDF', { error });
        }
    },
};
//# sourceMappingURL=quotation.controller.js.map