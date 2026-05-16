import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TransactionService } from '../services/transaction.service';
import { successResponse, errorResponse } from '../../../common/response';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { Types } from 'mongoose';
import { ROLES } from '../../../common/constants';

function toObjectIdOrNull(id?: string | Types.ObjectId | null): Types.ObjectId | null {
    if (!id) return null;
    if (Types.ObjectId.isValid(id as any)) return new Types.ObjectId(id);
    return null;
}

export const TransactionController = {
    async create(req: AuthRequest, res: Response) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');

            const payload = {
                ...req.body,
                createdBy: toObjectIdOrNull((loggedUser as any).id),
                date: new Date(),
            };

            // Franchise Admin: Force franchiseId
            if (Number((loggedUser as any).role) === ROLES.FRANCHISE_ADMIN) {
                payload.franchiseId = toObjectIdOrNull((loggedUser as any).id);
            }

            const transaction = await TransactionService.createTransaction(payload);
            return successResponse(res, transaction, 'Transaction created successfully');
        } catch (error: any) {
            return errorResponse(res, StatusCodes.BAD_REQUEST, error.message || 'Failed to create transaction', { error });
        }
    },

    async list(req: AuthRequest, res: Response) {
        try {
            const page = Math.max(1, Number(req.body.page) || 1);
            const limit = Math.max(1, Number(req.body.limit) || 25);
            const filter: any = { isDeleted: false };
            const loggedUser = req.user;

            if (loggedUser && Number((loggedUser as any).role) === ROLES.FRANCHISE_ADMIN) {
                const userFid = toObjectIdOrNull(loggedUser.id as any);
                if (userFid) filter.franchiseId = userFid;
            } else if (loggedUser && Number((loggedUser as any).role) === ROLES.MASTER_ADMIN) {
                if (req.body.franchiseId) {
                    const qfid = toObjectIdOrNull(req.body.franchiseId as any);
                    if (qfid) filter.franchiseId = qfid;
                }
            }

            if (req.body.customerId) {
                const cid = toObjectIdOrNull(req.body.customerId as any);
                if (cid) filter.customerId = cid;
            }

            if (req.body.type) {
                filter.type = Number(req.body.type);
            }

            if (req.body.fromDate || req.body.toDate) {
                filter.date = {};
                if (req.body.fromDate) filter.date.$gte = new Date(String(req.body.fromDate));
                if (req.body.toDate) filter.date.$lte = new Date(String(req.body.toDate));
                if (Object.keys(filter.date).length === 0) delete filter.date;
            }

            let sort: any = { date: -1 };
            if (req.body.sortBy) {
                const parts = String(req.body.sortBy).split(':');
                sort = { [parts[0]]: parts[1] === 'asc' ? 1 : -1 };
            }

            const result = await TransactionService.paginate(filter, { page, limit, sort });
            return successResponse(res, result, 'Transactions listed successfully');
        } catch (error: any) {
            return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list transactions', { error });
        }
    },

    async getByCustomerId(req: AuthRequest, res: Response) {
        try {
            const rawCustomerId = req.params.customerId;
            const customerId = Array.isArray(rawCustomerId) ? rawCustomerId[0] : String(rawCustomerId);
            if (!customerId) {
                return errorResponse(res, StatusCodes.BAD_REQUEST, 'Customer ID is required');
            }

            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.max(1, Number(req.query.limit) || 25);

            let sort: any = { date: -1 };
            if (req.query.sortBy) {
                const parts = String(req.query.sortBy).split(':');
                sort = { [parts[0]]: parts[1] === 'asc' ? 1 : -1 };
            }

            const result = await TransactionService.getByCustomerId(customerId, page, limit, sort);
            return successResponse(res, result, 'Transactions fetched by customerId successfully');
        } catch (error: any) {
            return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch transactions by customerId', { error });
        }
    },
};
