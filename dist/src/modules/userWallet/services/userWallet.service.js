"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserWalletService = void 0;
const userWallet_model_1 = require("../models/userWallet.model");
const mongoose_1 = require("mongoose");
const user_model_1 = require("../../user/model/user.model");
class UserWalletServiceClass {
    /**
     * Create a wallet transaction (Deposit or Withdraw)
     */
    async createTransaction(payload) {
        // Convert string IDs to ObjectIds
        if (payload.userId && typeof payload.userId === 'string') {
            payload.userId = new mongoose_1.Types.ObjectId(payload.userId);
        }
        if (payload.franchiseId && typeof payload.franchiseId === 'string') {
            payload.franchiseId = new mongoose_1.Types.ObjectId(payload.franchiseId);
        }
        if (payload.jobId && typeof payload.jobId === 'string') {
            payload.jobId = new mongoose_1.Types.ObjectId(payload.jobId);
        }
        if (payload.invoiceId && typeof payload.invoiceId === 'string') {
            payload.invoiceId = new mongoose_1.Types.ObjectId(payload.invoiceId);
        }
        if (payload.createdBy && typeof payload.createdBy === 'string') {
            payload.createdBy = new mongoose_1.Types.ObjectId(payload.createdBy);
        }
        const transaction = await userWallet_model_1.UserWalletTransactionModel.create(payload);
        // Update User Balance (DEPOSIT = +, WITHDRAW = -)
        const adjustment = payload.type === 2 ? payload.amount : -payload.amount;
        await user_model_1.UserModel.findByIdAndUpdate(payload.userId, { $inc: { balance: adjustment } });
        return transaction;
    }
    /**
     * Get user wallet balance
     */
    async getUserBalance(userId) {
        if (!mongoose_1.Types.ObjectId.isValid(userId))
            return 0;
        const result = await userWallet_model_1.UserWalletTransactionModel.aggregate([
            {
                $match: {
                    userId: new mongoose_1.Types.ObjectId(userId),
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
    async getAllUserBalances(franchiseId) {
        const { UserModel } = await Promise.resolve().then(() => __importStar(require('../../user/model/user.model')));
        const { ROLES } = await Promise.resolve().then(() => __importStar(require('../../../common/constants')));
        const filter = {
            isDeleted: false,
            // isActive: true, // Removed to show all users
        };
        if (franchiseId && mongoose_1.Types.ObjectId.isValid(franchiseId)) {
            // If franchiseId is provided (by Master Admin selection or Franchise Admin login),
            // we want ONLY the Staff of that franchise.
            filter.parentId = new mongoose_1.Types.ObjectId(franchiseId);
            filter.role = ROLES.STAFF;
        }
        else {
            // If no franchiseId (Master Admin view all), get ALL Staff
            filter.role = ROLES.STAFF;
        }
        // console.log('getAllUserBalances Filter:', JSON.stringify(filter));
        const users = await UserModel.find(filter).select('name email role balance').lean();
        // console.log(`Found ${users.length} users for cash report`);
        const balances = users.map((user) => ({
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
    async getUserTransactions(userId, opts = {}) {
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            return { transactions: [], pagination: { total: 0, page: 1, limit: 25 } };
        }
        const page = Math.max(1, opts.page || 1);
        const limit = Math.max(1, opts.limit || 25);
        const skip = (page - 1) * limit;
        const filter = {
            userId: new mongoose_1.Types.ObjectId(userId),
            isDeleted: false,
        };
        const [data, total] = await Promise.all([
            userWallet_model_1.UserWalletTransactionModel.find(filter)
                .populate('jobId', 'uniqueId')
                .populate('invoiceId', 'invoiceNumber')
                .populate('createdBy', 'name')
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            userWallet_model_1.UserWalletTransactionModel.countDocuments(filter),
        ]);
        const sanitizedData = data.map((txn) => ({
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
    async deleteTransaction(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id))
            return null;
        const transaction = await userWallet_model_1.UserWalletTransactionModel.findById(id);
        if (!transaction)
            return null;
        transaction.isDeleted = true;
        transaction.deletedAt = new Date();
        await transaction.save();
        return transaction;
    }
}
exports.UserWalletService = new UserWalletServiceClass();
//# sourceMappingURL=userWallet.service.js.map