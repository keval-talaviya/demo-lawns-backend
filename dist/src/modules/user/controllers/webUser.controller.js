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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebUserController = void 0;
const http_status_codes_1 = require("http-status-codes");
const user_service_1 = require("../services/user.service");
const response_1 = require("../../../common/response");
const message_1 = require("../messages/message");
const constants_1 = require("../../../common/constants");
const mongoose_1 = require("mongoose");
const file_service_1 = require("../../../services/file.service");
const path_1 = __importDefault(require("path"));
const config_1 = require("../../../config");
exports.WebUserController = {
    async create(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized access');
            }
            const role = Number(loggedUser.role);
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                // Master admin can create any type of user
                if (req.body.parentFranchiseId && !req.body.parentId) {
                    req.body.parentId = req.body.parentFranchiseId;
                }
                const user = await user_service_1.UserService.createUser(req.body);
                res.status(http_status_codes_1.StatusCodes.CREATED);
                return (0, response_1.successResponse)(res, user, message_1.USER_MESSAGES.CREATED);
            }
            else if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                // Franchise admin can only create staff under them
                req.body.parentId = loggedUser._id;
                req.body.role = constants_1.ROLES.STAFF;
                const user = await user_service_1.UserService.createUser(req.body);
                res.status(http_status_codes_1.StatusCodes.CREATED);
                return (0, response_1.successResponse)(res, user, message_1.USER_MESSAGES.CREATED);
            }
            else {
                // Staff cannot create users
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
            }
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to create user', { error });
        }
    },
    async list(req, res) {
        try {
            const page = Math.max(1, Number(req.body.page) || 1);
            const limit = Math.max(1, Number(req.body.limit) || 25);
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            let filter = {};
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                // Master admin can list all users, but default to franchise admins if no specific filter
                filter = req.body.role ? { role: Number(req.body.role) } : { role: constants_1.ROLES.FRANCHISE_ADMIN };
            }
            else if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                // Franchise admin can only list their own staff
                filter = {
                    role: constants_1.ROLES.STAFF,
                    parentId: loggedUser._id
                };
            }
            else {
                // Staff can only see themselves
                filter = { _id: loggedUser._id };
            }
            // Apply additional filters only for master admin, as others have restricted access
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                if (req.body.search) {
                    const search = String(req.body.search).trim();
                    filter.$or = [
                        { name: { $regex: search, $options: 'i' } },
                        { email: { $regex: search, $options: 'i' } },
                        { uniqueCode: { $regex: search, $options: 'i' } },
                        { phoneNumber: { $regex: search, $options: 'i' } },
                        { address: { $regex: search, $options: 'i' } }
                    ];
                }
                if (req.body.isFranchise !== undefined) {
                    filter.isFranchise = Boolean(req.body.isFranchise);
                }
                if (req.body.isActive !== undefined) {
                    filter.isActive = Boolean(req.body.isActive);
                }
                if (req.body.countryCode) {
                    filter.countryCode = Number(req.body.countryCode);
                }
                if (req.body.createdBy && mongoose_1.Types.ObjectId.isValid(String(req.body.createdBy))) {
                    filter.createdBy = new mongoose_1.Types.ObjectId(String(req.body.createdBy));
                }
                if (req.body.fromDate || req.body.toDate) {
                    filter.createdAt = {};
                    if (req.body.fromDate)
                        filter.createdAt.$gte = new Date(String(req.body.fromDate));
                    if (req.body.toDate)
                        filter.createdAt.$lte = new Date(String(req.body.toDate));
                    if (Object.keys(filter.createdAt).length === 0)
                        delete filter.createdAt;
                }
            }
            let sort = { createdAt: -1 };
            if (req.body.sortBy) {
                const parts = String(req.body.sortBy).split(':');
                sort = { [parts[0]]: parts[1] === 'asc' ? 1 : -1 };
            }
            const pagination = await user_service_1.UserService.paginate(filter, { page, limit, sort });
            return (0, response_1.successResponse)(res, pagination, message_1.USER_MESSAGES.LISTED);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list users', { error });
        }
    },
    async getById(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const user = await user_service_1.UserService.findById(req.params.id);
            if (!user) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
            }
            const role = Number(loggedUser.role);
            const loggedUserIdStr = String(loggedUser._id ?? '');
            const userIdStr = String(user._id ?? '');
            const parentIdStr = user.parentId ? String(user.parentId) : null;
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                return (0, response_1.successResponse)(res, user, 'User retrieved successfully');
            }
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                const canAccess = userIdStr === loggedUserIdStr || (parentIdStr !== null && parentIdStr === loggedUserIdStr);
                if (!canAccess) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                return (0, response_1.successResponse)(res, user, 'User retrieved successfully');
            }
            // Staff or other roles can only access themselves
            if (userIdStr === loggedUserIdStr) {
                return (0, response_1.successResponse)(res, user, 'User retrieved successfully');
            }
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get user', { error });
        }
    },
    async update(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            const user = await user_service_1.UserService.findById(req.params.id);
            if (!user) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
            }
            // Master admin can access and update all users
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                if (req.body.parentFranchiseId && !req.body.parentId) {
                    req.body.parentId = req.body.parentFranchiseId;
                }
                const updated = await user_service_1.UserService.updateUser(req.params.id, req.body);
                return (0, response_1.successResponse)(res, updated, message_1.USER_MESSAGES.UPDATED);
            }
            // Franchise admin can only update their own staff
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                const franchiseId = req.franchiseFilter ?? loggedUser._id;
                const userId = user._id;
                const parentId = user.parentId;
                const canAccess = userId.equals(franchiseId) || (parentId && parentId.equals(franchiseId));
                if (!canAccess) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                const updatePayload = { ...req.body };
                delete updatePayload.role; // Franchise admin cannot change role
                const updated = await user_service_1.UserService.updateUser(req.params.id, updatePayload);
                return (0, response_1.successResponse)(res, updated, message_1.USER_MESSAGES.UPDATED);
            }
            // Staff can only update themselves
            const loggedUserIdStr = String(loggedUser.id ?? '');
            const targetUserIdStr = String(user._id ?? '');
            if (loggedUserIdStr !== targetUserIdStr) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
            }
            const updated = await user_service_1.UserService.updateUser(req.params.id, req.body);
            return (0, response_1.successResponse)(res, updated, message_1.USER_MESSAGES.UPDATED);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to update user', { error });
        }
    },
    async remove(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            const user = await user_service_1.UserService.findById(req.params.id);
            if (!user) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
            }
            // Master admin can access and delete all users
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                await user_service_1.UserService.deleteById(req.params.id);
                return (0, response_1.successResponse)(res, null, message_1.USER_MESSAGES.DELETED);
            }
            // Franchise admin can only delete their own staff
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                const franchiseId = req.franchiseFilter ?? loggedUser._id;
                const parentId = user.parentId;
                const userId = user._id;
                const canAccess = userId.equals(franchiseId) || (parentId && parentId.equals(franchiseId));
                if (!canAccess) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                await user_service_1.UserService.deleteById(req.params.id);
                return (0, response_1.successResponse)(res, null, message_1.USER_MESSAGES.DELETED);
            }
            // Staff can only delete themselves
            const loggedUserIdStr = String(loggedUser._id ?? '');
            const targetUserIdStr = String(user._id ?? '');
            if (loggedUserIdStr !== targetUserIdStr) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
            }
            await user_service_1.UserService.deleteById(req.params.id);
            return (0, response_1.successResponse)(res, null, message_1.USER_MESSAGES.DELETED);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete user', { error });
        }
    },
    async updatePassword(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            const user = await user_service_1.UserService.findById(req.body.id);
            if (!user) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
            }
            // Only master admin can update passwords for franchise admins
            if (role !== constants_1.ROLES.MASTER_ADMIN) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Only master admin can update passwords');
            }
            // Only allow updating password for franchise admin users
            if (user.role !== constants_1.ROLES.FRANCHISE_ADMIN) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Password update is only allowed for franchise admin users');
            }
            if (!req.body.password || req.body.password.trim() === '') {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Password is required');
            }
            const updated = await user_service_1.UserService.updateUser(req.params.id, { password: req.body.password });
            return (0, response_1.successResponse)(res, { message: 'Password updated successfully' }, 'Password updated successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to update password', { error });
        }
    },
    async listAll(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            // Only master admin is allowed to list franchise users
            if (role !== constants_1.ROLES.MASTER_ADMIN) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Only master admin can access franchise user list');
            }
            // ONLY FILTER WE KEEP
            const filter = { role: constants_1.ROLES.FRANCHISE_ADMIN };
            // DEFAULT SORT (optional)
            const sort = { createdAt: -1 };
            const users = await user_service_1.UserService.find(filter, undefined, { sort });
            return (0, response_1.successResponse)(res, users, message_1.USER_MESSAGES.LISTED);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list all franchise users', { error });
        }
    },
    async getWallet(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const userId = loggedUser._id;
            const userIdStr = String(userId);
            // Users can only access their own wallet
            const requestedUserId = req.query.id;
            if (requestedUserId && requestedUserId !== userIdStr) {
                // Check if user has permission to view other users' wallets
                const role = Number(loggedUser.role);
                if (role !== constants_1.ROLES.MASTER_ADMIN && role !== constants_1.ROLES.FRANCHISE_ADMIN) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                // For admin roles, validate the requested user exists
                if (!mongoose_1.Types.ObjectId.isValid(requestedUserId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid user id');
                }
                const targetUser = await user_service_1.UserService.findById(requestedUserId);
                if (!targetUser) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
                }
                // Franchise admin can only access their own staff
                if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                    const parentIdStr = targetUser.parentId ? String(targetUser.parentId) : null;
                    if (parentIdStr !== userIdStr && String(targetUser._id) !== userIdStr) {
                        return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                    }
                }
            }
            const targetUserId = requestedUserId && mongoose_1.Types.ObjectId.isValid(requestedUserId)
                ? requestedUserId
                : String(userId);
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.max(1, Number(req.query.limit) || 25);
            // Use UserWalletService
            const { UserWalletService } = await Promise.resolve().then(() => __importStar(require('../../userWallet/services/userWallet.service')));
            const [balance, transactionsData] = await Promise.all([
                UserWalletService.getUserBalance(targetUserId),
                UserWalletService.getUserTransactions(targetUserId, { page, limit, ...req.query }),
            ]);
            // Get user info
            const user = await user_service_1.UserService.findById(targetUserId);
            return (0, response_1.successResponse)(res, {
                transactions: transactionsData.transactions,
                pagination: transactionsData.pagination,
                currentBalance: balance,
                user: {
                    id: user?._id?.toString() ?? null,
                    name: user?.name ?? null,
                    email: user?.email ?? null,
                    address: user?.address ?? null,
                },
            }, 'User wallet retrieved successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get user wallet', { error });
        }
    },
    async uploadLogo(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            // Only FRANCHISE_ADMIN can upload logo
            if (role !== constants_1.ROLES.FRANCHISE_ADMIN) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Only franchise admin can upload logo');
            }
            if (!req.file) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'No file uploaded');
            }
            const userId = req.params.id || String(loggedUser._id);
            const user = await user_service_1.UserService.findById(userId);
            if (!user) {
                // Delete uploaded file if user not found
                file_service_1.FileService.removeFile(req.file.path);
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
            }
            // Check permissions
            if (role === constants_1.ROLES.FRANCHISE_ADMIN && String(user._id) !== String(loggedUser._id)) {
                file_service_1.FileService.removeFile(req.file.path);
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
            }
            // Delete old logo if exists
            if (user.logo) {
                const oldLogoPath = path_1.default.join(config_1.config.fileUploadPath, path_1.default.basename(user.logo));
                file_service_1.FileService.removeFile(oldLogoPath);
            }
            // Save logo path (relative to uploads directory)
            const logoPath = `/uploads/${req.file.filename}`;
            await user_service_1.UserService.updateUser(userId, { logo: logoPath });
            return (0, response_1.successResponse)(res, { logo: logoPath }, 'Logo uploaded successfully');
        }
        catch (error) {
            if (req.file) {
                file_service_1.FileService.removeFile(req.file.path);
            }
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to upload logo', { error });
        }
    },
    async updateGstNumber(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            // Only FRANCHISE_ADMIN can update GST number
            if (role !== constants_1.ROLES.FRANCHISE_ADMIN) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Only franchise admin can update GST number');
            }
            const userId = req.params.id || String(loggedUser._id);
            const user = await user_service_1.UserService.findById(userId);
            if (!user) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
            }
            // Check permissions
            if (role === constants_1.ROLES.FRANCHISE_ADMIN && String(user._id) !== String(loggedUser._id)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
            }
            const { gstNumber } = req.body;
            if (!gstNumber || typeof gstNumber !== 'string') {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'GST number is required');
            }
            await user_service_1.UserService.updateUser(userId, { gstNumber: gstNumber.trim() });
            return (0, response_1.successResponse)(res, { gstNumber }, 'GST number updated successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update GST number', { error });
        }
    },
    async deleteLogo(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            // Only FRANCHISE_ADMIN can delete logo
            if (role !== constants_1.ROLES.FRANCHISE_ADMIN) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Only franchise admin can delete logo');
            }
            const userId = req.params.id || String(loggedUser._id);
            const user = await user_service_1.UserService.findById(userId);
            if (!user) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
            }
            // Check permissions
            if (role === constants_1.ROLES.FRANCHISE_ADMIN && String(user._id) !== String(loggedUser._id)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
            }
            if (!user.logo) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'No logo to delete');
            }
            // Delete logo file
            const logoPath = path_1.default.join(config_1.config.fileUploadPath, path_1.default.basename(user.logo));
            file_service_1.FileService.removeFile(logoPath);
            // Remove logo from user
            await user_service_1.UserService.updateUser(userId, { logo: null });
            return (0, response_1.successResponse)(res, null, 'Logo deleted successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete logo', { error });
        }
    }
};
//# sourceMappingURL=webUser.controller.js.map