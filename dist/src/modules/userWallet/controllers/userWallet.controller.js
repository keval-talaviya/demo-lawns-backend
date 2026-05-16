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
exports.UserWalletController = void 0;
const http_status_codes_1 = require("http-status-codes");
const userWallet_service_1 = require("../services/userWallet.service");
const response_1 = require("../../../common/response");
const mongoose_1 = require("mongoose");
const constants_1 = require("../../../common/constants");
exports.UserWalletController = {
    /**
     * Get Cash Report - List all users with balances
     */
    async getCashReport(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            let franchiseId;
            // Franchise admin can only see their own franchise users
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                franchiseId = loggedUser.id;
            }
            // If filtering by specific franchise (only for master admin)
            else if (req.query.franchiseId && mongoose_1.Types.ObjectId.isValid(req.query.franchiseId)) {
                franchiseId = req.query.franchiseId;
            }
            const balances = await userWallet_service_1.UserWalletService.getAllUserBalances(franchiseId);
            return (0, response_1.successResponse)(res, { users: balances }, 'Cash report retrieved successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get cash report', { error });
        }
    },
    /**
     * Get User Wallet Details - Balance + Transaction History
     */
    async getUserWallet(req, res) {
        try {
            const userId = req.query.userId;
            if (!userId || !mongoose_1.Types.ObjectId.isValid(userId)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid user ID');
            }
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            // Staff can only view their own wallet
            if (role === constants_1.ROLES.STAFF && userId !== loggedUser.id) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 25;
            const [balance, transactionsData] = await Promise.all([
                userWallet_service_1.UserWalletService.getUserBalance(userId),
                userWallet_service_1.UserWalletService.getUserTransactions(userId, { page, limit }),
            ]);
            return (0, response_1.successResponse)(res, {
                balance,
                ...transactionsData,
            }, 'User wallet retrieved successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get user wallet', { error });
        }
    },
    /**
     * Create Manual Transaction (Deposit or Withdraw)
     */
    async createTransaction(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const { userId, type, amount, purpose, date } = req.body;
            if (!userId || !mongoose_1.Types.ObjectId.isValid(userId)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid user ID');
            }
            if (!type || ![1, 2].includes(type)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid transaction type (1: Withdraw, 2: Deposit)');
            }
            if (!amount || amount <= 0) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Amount must be greater than 0');
            }
            if (!purpose || purpose.trim() === '') {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Purpose is required');
            }
            // Get franchise ID (for staff, use their parent; for franchise admin, use their own ID)
            const { UserModel } = await Promise.resolve().then(() => __importStar(require('../../user/model/user.model')));
            const user = await UserModel.findById(userId);
            if (!user) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
            }
            const franchiseId = user.role === constants_1.ROLES.STAFF ? user.parentId : user._id;
            const transaction = await userWallet_service_1.UserWalletService.createTransaction({
                userId,
                franchiseId: franchiseId,
                type,
                amount,
                purpose,
                date: date ? new Date(date) : new Date(),
                createdBy: new mongoose_1.Types.ObjectId(loggedUser.id),
            });
            return (0, response_1.successResponse)(res, transaction, 'Transaction created successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to create transaction', { error });
        }
    },
    /**
     * Delete Transaction
     */
    async deleteTransaction(req, res) {
        try {
            const { id } = req.params;
            if (!id || !mongoose_1.Types.ObjectId.isValid(id)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid transaction ID');
            }
            const transaction = await userWallet_service_1.UserWalletService.deleteTransaction(id);
            if (!transaction) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'Transaction not found');
            }
            return (0, response_1.successResponse)(res, transaction, 'Transaction deleted successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to delete transaction', { error });
        }
    },
};
//# sourceMappingURL=userWallet.controller.js.map