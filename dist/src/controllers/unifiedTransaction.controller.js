"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedTransactionController = void 0;
const http_status_codes_1 = require("http-status-codes");
const response_1 = require("../common/response");
const transactionManager_service_1 = __importDefault(require("../services/transactionManager.service"));
const constants_1 = require("../common/constants");
const mongoose_1 = require("mongoose");
/**
 * 🔄 Unified Transaction Controller
 * Provides unified reporting and reconciliation for both:
 * - Customer Transactions (Accounts Receivable)
 * - Staff Wallet Transactions (Cash Management)
 */
exports.UnifiedTransactionController = {
    /**
     * Get unified transaction report
     * Combines customer transactions and staff wallet balances
     *
     * @route GET /api/transactions/report
     * @access Master Admin, Franchise Admin
     */
    async getUnifiedReport(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            let franchiseId;
            // Franchise Admin can only see their own franchise
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                franchiseId = loggedUser.id;
            }
            else if (role === constants_1.ROLES.MASTER_ADMIN) {
                // Master Admin can filter by franchise or see all
                franchiseId = req.query.franchiseId;
            }
            else {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
            }
            // Get date filters
            const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
            const paymentType = req.query.paymentType ? Number(req.query.paymentType) : undefined;
            const report = await transactionManager_service_1.default.getUnifiedTransactionReport({
                franchiseId: franchiseId,
                startDate,
                endDate,
                paymentType,
            });
            return (0, response_1.successResponse)(res, report.data, 'Unified transaction report retrieved successfully');
        }
        catch (error) {
            console.error('Error in getUnifiedReport:', error);
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get unified report', { error: error.message });
        }
    },
    /**
     * Reconcile transactions for a specific date
     * Matches customer CASH payments with staff wallet deposits
     *
     * @route GET /api/transactions/reconcile
     * @access Master Admin, Franchise Admin
     */
    async reconcile(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            let franchiseId;
            // Franchise Admin can only reconcile their own franchise
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                franchiseId = loggedUser.id;
            }
            else if (role === constants_1.ROLES.MASTER_ADMIN) {
                // Master Admin must specify franchise
                franchiseId = req.query.franchiseId;
                if (!franchiseId) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Franchise ID is required');
                }
            }
            else {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
            }
            // Get date (default to today)
            const dateStr = req.query.date;
            const date = dateStr ? new Date(dateStr) : new Date();
            if (!mongoose_1.Types.ObjectId.isValid(franchiseId)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid franchise ID');
            }
            const reconciliation = await transactionManager_service_1.default.reconcileTransactions(new mongoose_1.Types.ObjectId(franchiseId), date);
            return (0, response_1.successResponse)(res, reconciliation.data, reconciliation.data.status === 'BALANCED'
                ? 'Transactions reconciled successfully'
                : 'Discrepancy detected in reconciliation');
        }
        catch (error) {
            console.error('Error in reconcile:', error);
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to reconcile transactions', { error: error.message });
        }
    },
    /**
     * Get transaction summary for a franchise
     * Shows customer balances and staff wallet totals
     *
     * @route GET /api/transactions/summary
     * @access Master Admin, Franchise Admin
     */
    async getSummary(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            let franchiseId;
            // Franchise Admin can only see their own franchise
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                franchiseId = loggedUser.id;
            }
            else if (role === constants_1.ROLES.MASTER_ADMIN) {
                // Master Admin must specify franchise
                franchiseId = req.query.franchiseId;
                if (!franchiseId) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Franchise ID is required');
                }
            }
            else {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
            }
            if (!mongoose_1.Types.ObjectId.isValid(franchiseId)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid franchise ID');
            }
            // Get date range (default to current month)
            const now = new Date();
            const startDate = req.query.startDate
                ? new Date(req.query.startDate)
                : new Date(now.getFullYear(), now.getMonth(), 1);
            const endDate = req.query.endDate
                ? new Date(req.query.endDate)
                : new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const summary = await transactionManager_service_1.default.getTransactionSummary(new mongoose_1.Types.ObjectId(franchiseId), startDate, endDate);
            return (0, response_1.successResponse)(res, summary.data, 'Transaction summary retrieved successfully');
        }
        catch (error) {
            console.error('Error in getSummary:', error);
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get transaction summary', { error: error.message });
        }
    },
};
//# sourceMappingURL=unifiedTransaction.controller.js.map