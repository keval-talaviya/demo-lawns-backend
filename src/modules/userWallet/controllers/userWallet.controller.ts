import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserWalletService } from '../services/userWallet.service';
import { successResponse, errorResponse } from '../../../common/response';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { Types } from 'mongoose';
import { ROLES } from '../../../common/constants';

export const UserWalletController = {
    /**
     * Get Cash Report - List all users with balances
     */
    async getCashReport(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }

            const role = Number((loggedUser as any).role);
            let franchiseId: string | undefined;

            // Franchise admin can only see their own franchise users
            if (role === ROLES.FRANCHISE_ADMIN) {
                franchiseId = (loggedUser as any).id;
            }
            // If filtering by specific franchise (only for master admin)
            else if (req.query.franchiseId && Types.ObjectId.isValid(req.query.franchiseId as string)) {
                franchiseId = req.query.franchiseId as string;
            }

            const balances = await UserWalletService.getAllUserBalances(franchiseId);

            return successResponse(res, { users: balances }, 'Cash report retrieved successfully');
        } catch (error: any) {
            return errorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                'Failed to get cash report',
                { error }
            );
        }
    },

    /**
     * Get User Wallet Details - Balance + Transaction History
     */
    async getUserWallet(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const userId = req.query.userId as string;

            if (!userId || !Types.ObjectId.isValid(userId)) {
                return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid user ID');
            }

            const loggedUser = req.user;
            if (!loggedUser) {
                return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }

            const role = Number((loggedUser as any).role);

            // Staff can only view their own wallet
            if (role === ROLES.STAFF && userId !== (loggedUser as any).id) {
                return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 25;

            const [balance, transactionsData] = await Promise.all([
                UserWalletService.getUserBalance(userId),
                UserWalletService.getUserTransactions(userId, { page, limit }),
            ]);

            return successResponse(
                res,
                {
                    balance,
                    ...transactionsData,
                },
                'User wallet retrieved successfully'
            );
        } catch (error: any) {
            return errorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                'Failed to get user wallet',
                { error }
            );
        }
    },

    /**
     * Create Manual Transaction (Deposit or Withdraw)
     */
    async createTransaction(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }

            const { userId, type, amount, purpose, date } = req.body;

            if (!userId || !Types.ObjectId.isValid(userId)) {
                return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid user ID');
            }

            if (!type || ![1, 2].includes(type)) {
                return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid transaction type (1: Withdraw, 2: Deposit)');
            }

            if (!amount || amount <= 0) {
                return errorResponse(res, StatusCodes.BAD_REQUEST, 'Amount must be greater than 0');
            }

            if (!purpose || purpose.trim() === '') {
                return errorResponse(res, StatusCodes.BAD_REQUEST, 'Purpose is required');
            }

            // Get franchise ID (for staff, use their parent; for franchise admin, use their own ID)
            const { UserModel } = await import('../../user/model/user.model');
            const user = await UserModel.findById(userId);
            if (!user) {
                return errorResponse(res, StatusCodes.NOT_FOUND, 'User not found');
            }

            const franchiseId = user.role === ROLES.STAFF ? user.parentId : user._id;

            const transaction = await UserWalletService.createTransaction({
                userId,
                franchiseId: franchiseId as Types.ObjectId,
                type,
                amount,
                purpose,
                date: date ? new Date(date) : new Date(),
                createdBy: new Types.ObjectId((loggedUser as any).id),
            });

            return successResponse(res, transaction, 'Transaction created successfully');
        } catch (error: any) {
            return errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                error.message || 'Failed to create transaction',
                { error }
            );
        }
    },

    /**
     * Delete Transaction
     */
    async deleteTransaction(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { id } = req.params;

            if (!id || !Types.ObjectId.isValid(id)) {
                return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid transaction ID');
            }

            const transaction = await UserWalletService.deleteTransaction(id);

            if (!transaction) {
                return errorResponse(res, StatusCodes.NOT_FOUND, 'Transaction not found');
            }

            return successResponse(res, transaction, 'Transaction deleted successfully');
        } catch (error: any) {
            return errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                error.message || 'Failed to delete transaction',
                { error }
            );
        }
    },
};
