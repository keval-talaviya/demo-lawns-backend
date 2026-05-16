import { UserWalletTransactionModel } from '../models/userWallet.model';
import {
    CreateUserWalletTransactionDTO,
    UserWalletTransactionDocument,
    UserWalletBalance,
} from '../interfaces/userWallet.interface';
import { Types } from 'mongoose';
import { UserModel } from '../../user/model/user.model';

class UserWalletServiceClass {
    /**
     * Create a wallet transaction (Deposit or Withdraw)
     */
    async createTransaction(
        payload: CreateUserWalletTransactionDTO
    ): Promise<UserWalletTransactionDocument> {
        // Convert string IDs to ObjectIds
        if (payload.userId && typeof payload.userId === 'string') {
            payload.userId = new Types.ObjectId(payload.userId);
        }
        if (payload.franchiseId && typeof payload.franchiseId === 'string') {
            payload.franchiseId = new Types.ObjectId(payload.franchiseId);
        }
        if (payload.jobId && typeof payload.jobId === 'string') {
            payload.jobId = new Types.ObjectId(payload.jobId);
        }
        if (payload.invoiceId && typeof payload.invoiceId === 'string') {
            payload.invoiceId = new Types.ObjectId(payload.invoiceId);
        }
        if (payload.createdBy && typeof payload.createdBy === 'string') {
            payload.createdBy = new Types.ObjectId(payload.createdBy);
        }

        const transaction = await UserWalletTransactionModel.create(payload);

        // Update User Balance (DEPOSIT = +, WITHDRAW = -)
        const adjustment = payload.type === 2 ? payload.amount : -payload.amount;

        await UserModel.findByIdAndUpdate(
            payload.userId,
            { $inc: { balance: adjustment } }
        );

        return transaction;
    }

    /**
     * Get user wallet balance
     */
    async getUserBalance(userId: string): Promise<number> {
        if (!Types.ObjectId.isValid(userId)) return 0;

        const result = await UserWalletTransactionModel.aggregate([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: null,
                    totalDeposits: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 2] }, '$amount', 0],
                        },
                    },
                    totalWithdrawals: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 1] }, '$amount', 0],
                        },
                    },
                },
            },
            {
                $project: {
                    balance: { $subtract: ['$totalDeposits', '$totalWithdrawals'] },
                },
            },
        ]);

        return result.length > 0 ? result[0].balance : 0;
    }

    /**
     * Get all users with their wallet balances (for Cash Report)
     */
    /**
     * Get all users with their wallet balances (for Cash Report)
     * Optimized to query UserModel directly since we now track balance there.
     */
    async getAllUserBalances(franchiseId?: string): Promise<UserWalletBalance[]> {
        const { UserModel } = await import('../../user/model/user.model');
        const { ROLES } = await import('../../../common/constants');

        const filter: any = {
            isDeleted: false,
            // isActive: true, // Removed to show all users
        };

        if (franchiseId && Types.ObjectId.isValid(franchiseId)) {
            // If franchiseId is provided (by Master Admin selection or Franchise Admin login),
            // we want ONLY the Staff of that franchise.
            filter.parentId = new Types.ObjectId(franchiseId);
            filter.role = ROLES.STAFF;
        } else {
            // If no franchiseId (Master Admin view all), get ALL Staff
            filter.role = ROLES.STAFF;
        }

        // console.log('getAllUserBalances Filter:', JSON.stringify(filter));
        const users = await UserModel.find(filter).select('name email role balance').lean();
        // console.log(`Found ${users.length} users for cash report`);

        const balances = users.map((user: any) => ({
            userId: user._id.toString(),
            userName: user.name,
            userType: user.role === ROLES.FRANCHISE_ADMIN ? 'Franchise Owner' : (user.role === ROLES.STAFF ? 'Staff' : 'Unknown'),
            email: user.email,
            balance: user.balance || 0,
        }));

        // Sort by balance descending
        return balances.sort((a, b) => b.balance - a.balance);
    }

    /**
     * Get user wallet transaction history
     */
    async getUserTransactions(
        userId: string,
        opts: { page?: number; limit?: number } = {}
    ) {
        if (!Types.ObjectId.isValid(userId)) {
            return { transactions: [], pagination: { total: 0, page: 1, limit: 25 } };
        }

        const page = Math.max(1, opts.page || 1);
        const limit = Math.max(1, opts.limit || 25);
        const skip = (page - 1) * limit;

        const filter = {
            userId: new Types.ObjectId(userId),
            isDeleted: false,
        };

        const [data, total] = await Promise.all([
            UserWalletTransactionModel.find(filter)
                .populate('jobId', 'uniqueId')
                .populate('invoiceId', 'invoiceNumber')
                .populate('createdBy', 'name')
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            UserWalletTransactionModel.countDocuments(filter),
        ]);

        const sanitizedData = data.map((txn: any) => ({
            id: txn._id?.toString() ?? null,
            type: txn.type, // 1: Withdraw, 2: Deposit
            typeLabel: txn.type === 1 ? 'WITHDRAW' : 'DEPOSIT',
            amount: txn.amount ?? 0,
            purpose: txn.purpose ?? '',
            date: txn.date ?? txn.createdAt,
            jobNumber: txn.jobId?.uniqueId ?? null,
            jobId: txn.jobId?.uniqueId ?? null, // User requested friendly ID for ID field
            invoiceNumber: txn.invoiceId?.invoiceNumber ?? null,
            invoiceId: txn.invoiceId?.invoiceNumber ?? null, // User requested friendly ID for ID field
            createdBy: txn.createdBy?.name ?? null,
            createdAt: txn.createdAt,
        }));

        return {
            transactions: sanitizedData,
            pagination: {
                total,
                page,
                limit,
            },
        };
    }

    /**
     * Delete a transaction (soft delete)
     */
    async deleteTransaction(id: string): Promise<UserWalletTransactionDocument | null> {
        if (!Types.ObjectId.isValid(id)) return null;

        const transaction = await UserWalletTransactionModel.findById(id);
        if (!transaction) return null;

        transaction.isDeleted = true;
        transaction.deletedAt = new Date();
        await transaction.save();

        return transaction;
    }
}

export const UserWalletService = new UserWalletServiceClass();
