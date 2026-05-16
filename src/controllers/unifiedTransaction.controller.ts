import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthRequest } from '../middlewares/authMiddleware';
import { successResponse, errorResponse } from '../common/response';
import TransactionManager from '../services/transactionManager.service';
import { ROLES } from '../common/constants';
import { Types } from 'mongoose';

/**
 * 🔄 Unified Transaction Controller
 * Provides unified reporting and reconciliation for both:
 * - Customer Transactions (Accounts Receivable)
 * - Staff Wallet Transactions (Cash Management)
 */
export const UnifiedTransactionController = {
    /**
     * Get unified transaction report
     * Combines customer transactions and staff wallet balances
     * 
     * @route GET /api/transactions/report
     * @access Master Admin, Franchise Admin
     */
    async getUnifiedReport(req: AuthRequest, res: Response) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }

            const role = Number((loggedUser as any).role);
            let franchiseId: string | undefined;

            // Franchise Admin can only see their own franchise
            if (role === ROLES.FRANCHISE_ADMIN) {
                franchiseId = (loggedUser as any).id;
            } else if (role === ROLES.MASTER_ADMIN) {
                // Master Admin can filter by franchise or see all
                franchiseId = req.query.franchiseId as string;
            } else {
                return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
            }

            // Get date filters
            const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
            const paymentType = req.query.paymentType ? Number(req.query.paymentType) : undefined;

            const report = await TransactionManager.getUnifiedTransactionReport({
                franchiseId: franchiseId,
                startDate,
                endDate,
                paymentType,
            });

            return successResponse(res, report.data, 'Unified transaction report retrieved successfully');
        } catch (error: any) {
            console.error('Error in getUnifiedReport:', error);
            return errorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                'Failed to get unified report',
                { error: error.message }
            );
        }
    },

    /**
     * Reconcile transactions for a specific date
     * Matches customer CASH payments with staff wallet deposits
     * 
     * @route GET /api/transactions/reconcile
     * @access Master Admin, Franchise Admin
     */
    async reconcile(req: AuthRequest, res: Response) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }

            const role = Number((loggedUser as any).role);
            let franchiseId: string;

            // Franchise Admin can only reconcile their own franchise
            if (role === ROLES.FRANCHISE_ADMIN) {
                franchiseId = (loggedUser as any).id;
            } else if (role === ROLES.MASTER_ADMIN) {
                // Master Admin must specify franchise
                franchiseId = req.query.franchiseId as string;
                if (!franchiseId) {
                    return errorResponse(res, StatusCodes.BAD_REQUEST, 'Franchise ID is required');
                }
            } else {
                return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
            }

            // Get date (default to today)
            const dateStr = req.query.date as string;
            const date = dateStr ? new Date(dateStr) : new Date();

            if (!Types.ObjectId.isValid(franchiseId)) {
                return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid franchise ID');
            }

            const reconciliation = await TransactionManager.reconcileTransactions(
                new Types.ObjectId(franchiseId),
                date
            );

            return successResponse(
                res,
                reconciliation.data,
                reconciliation.data.status === 'BALANCED'
                    ? 'Transactions reconciled successfully'
                    : 'Discrepancy detected in reconciliation'
            );
        } catch (error: any) {
            console.error('Error in reconcile:', error);
            return errorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                'Failed to reconcile transactions',
                { error: error.message }
            );
        }
    },

    /**
     * Get transaction summary for a franchise
     * Shows customer balances and staff wallet totals
     * 
     * @route GET /api/transactions/summary
     * @access Master Admin, Franchise Admin
     */
    async getSummary(req: AuthRequest, res: Response) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }

            const role = Number((loggedUser as any).role);
            let franchiseId: string;

            // Franchise Admin can only see their own franchise
            if (role === ROLES.FRANCHISE_ADMIN) {
                franchiseId = (loggedUser as any).id;
            } else if (role === ROLES.MASTER_ADMIN) {
                // Master Admin must specify franchise
                franchiseId = req.query.franchiseId as string;
                if (!franchiseId) {
                    return errorResponse(res, StatusCodes.BAD_REQUEST, 'Franchise ID is required');
                }
            } else {
                return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
            }

            if (!Types.ObjectId.isValid(franchiseId)) {
                return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid franchise ID');
            }

            // Get date range (default to current month)
            const now = new Date();
            const startDate = req.query.startDate
                ? new Date(req.query.startDate as string)
                : new Date(now.getFullYear(), now.getMonth(), 1);
            const endDate = req.query.endDate
                ? new Date(req.query.endDate as string)
                : new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const summary = await TransactionManager.getTransactionSummary(
                new Types.ObjectId(franchiseId),
                startDate,
                endDate
            );

            return successResponse(res, summary.data, 'Transaction summary retrieved successfully');
        } catch (error: any) {
            console.error('Error in getSummary:', error);
            return errorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                'Failed to get transaction summary',
                { error: error.message }
            );
        }
    },
};
