"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const http_status_codes_1 = require("http-status-codes");
const transaction_service_1 = require("../services/transaction.service");
const response_1 = require("../../../common/response");
const mongoose_1 = require("mongoose");
const constants_1 = require("../../../common/constants");
function toObjectIdOrNull(id) {
    if (!id)
        return null;
    if (mongoose_1.Types.ObjectId.isValid(id))
        return new mongoose_1.Types.ObjectId(id);
    return null;
}
exports.TransactionController = {
    async create(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser)
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            const payload = {
                ...req.body,
                createdBy: toObjectIdOrNull(loggedUser.id),
                date: new Date(),
            };
            // Franchise Admin: Force franchiseId
            if (Number(loggedUser.role) === constants_1.ROLES.FRANCHISE_ADMIN) {
                payload.franchiseId = toObjectIdOrNull(loggedUser.id);
            }
            const transaction = await transaction_service_1.TransactionService.createTransaction(payload);
            return (0, response_1.successResponse)(res, transaction, 'Transaction created successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to create transaction', { error });
        }
    },
    async list(req, res) {
        try {
            const page = Math.max(1, Number(req.body.page) || 1);
            const limit = Math.max(1, Number(req.body.limit) || 25);
            const filter = { isDeleted: false };
            const loggedUser = req.user;
            if (loggedUser && Number(loggedUser.role) === constants_1.ROLES.FRANCHISE_ADMIN) {
                const userFid = toObjectIdOrNull(loggedUser.id);
                if (userFid)
                    filter.franchiseId = userFid;
            }
            else if (loggedUser && Number(loggedUser.role) === constants_1.ROLES.MASTER_ADMIN) {
                if (req.body.franchiseId) {
                    const qfid = toObjectIdOrNull(req.body.franchiseId);
                    if (qfid)
                        filter.franchiseId = qfid;
                }
            }
            if (req.body.customerId) {
                const cid = toObjectIdOrNull(req.body.customerId);
                if (cid)
                    filter.customerId = cid;
            }
            if (req.body.type) {
                filter.type = Number(req.body.type);
            }
            if (req.body.fromDate || req.body.toDate) {
                filter.date = {};
                if (req.body.fromDate)
                    filter.date.$gte = new Date(String(req.body.fromDate));
                if (req.body.toDate)
                    filter.date.$lte = new Date(String(req.body.toDate));
                if (Object.keys(filter.date).length === 0)
                    delete filter.date;
            }
            let sort = { date: -1 };
            if (req.body.sortBy) {
                const parts = String(req.body.sortBy).split(':');
                sort = { [parts[0]]: parts[1] === 'asc' ? 1 : -1 };
            }
            const result = await transaction_service_1.TransactionService.paginate(filter, { page, limit, sort });
            return (0, response_1.successResponse)(res, result, 'Transactions listed successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list transactions', { error });
        }
    },
    async getByCustomerId(req, res) {
        try {
            const rawCustomerId = req.params.customerId;
            const customerId = Array.isArray(rawCustomerId) ? rawCustomerId[0] : String(rawCustomerId);
            if (!customerId) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Customer ID is required');
            }
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.max(1, Number(req.query.limit) || 25);
            let sort = { date: -1 };
            if (req.query.sortBy) {
                const parts = String(req.query.sortBy).split(':');
                sort = { [parts[0]]: parts[1] === 'asc' ? 1 : -1 };
            }
            const result = await transaction_service_1.TransactionService.getByCustomerId(customerId, page, limit, sort);
            return (0, response_1.successResponse)(res, result, 'Transactions fetched by customerId successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch transactions by customerId', { error });
        }
    },
};
//# sourceMappingURL=transaction.controller.js.map