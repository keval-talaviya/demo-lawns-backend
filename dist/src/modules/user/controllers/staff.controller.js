"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffController = void 0;
const http_status_codes_1 = require("http-status-codes");
const user_service_1 = require("../services/user.service");
const response_1 = require("../../../common/response");
const constants_1 = require("../../../common/constants");
const user_model_1 = require("../model/user.model");
const mongoose_1 = require("mongoose");
function toObjectIdOrNull(id) {
    if (!id)
        return null;
    if (mongoose_1.Types.ObjectId.isValid(id))
        return new mongoose_1.Types.ObjectId(id);
    return null;
}
exports.StaffController = {
    async createStaff(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized access');
            }
            const role = Number(loggedUser.role);
            let franchiseId = null;
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                if (!req.body.franchiseId) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Franchise ID is required for master admin');
                }
                franchiseId = toObjectIdOrNull(req.body.franchiseId);
            }
            else if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                franchiseId = toObjectIdOrNull(loggedUser.id);
            }
            else {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Only master admin or franchise admin can create staff');
            }
            const existingStaff = await user_model_1.UserModel.findOne({
                email: req.body.email,
                parentId: franchiseId,
                isDeleted: false,
            });
            if (existingStaff) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.CONFLICT, 'Staff with this email already exists in this franchise');
            }
            const staffPayload = {
                ...req.body,
                parentId: franchiseId,
                role: constants_1.ROLES.STAFF,
                createdBy: toObjectIdOrNull(loggedUser.id),
            };
            const staff = await user_service_1.UserService.createUser(staffPayload);
            res.status(http_status_codes_1.StatusCodes.CREATED);
            return (0, response_1.successResponse)(res, staff, 'Staff created successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to create staff', { error });
        }
    },
    async listStaff(req, res) {
        try {
            const page = Math.max(1, Number(req.body.page) || 1);
            const limit = Math.max(1, Number(req.body.limit) || 25);
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            let filter = { role: constants_1.ROLES.STAFF, isDeleted: false };
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                if (req.body.franchiseId) {
                    const franchiseId = toObjectIdOrNull(req.body.franchiseId);
                    if (franchiseId)
                        filter.parentId = franchiseId;
                }
            }
            else if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                filter.parentId = toObjectIdOrNull(loggedUser.id);
            }
            else {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
            }
            // Search
            if (req.body.search) {
                const s = String(req.body.search).trim();
                filter.$or = [
                    { name: { $regex: s, $options: 'i' } },
                    { email: { $regex: s, $options: 'i' } },
                    { phoneNumber: { $regex: s, $options: 'i' } },
                ];
            }
            if (req.body.isActive !== undefined) {
                filter.isActive = Boolean(req.body.isActive);
            }
            // Sort
            let sort = { createdAt: -1 };
            if (req.body.sortBy) {
                const parts = String(req.body.sortBy).split(':');
                sort = { [parts[0]]: parts[1] === 'asc' ? 1 : -1 };
            }
            const startIndex = (page - 1) * limit;
            // IMPORTANT: populate parentId and select only 'name'
            const [data, total] = await Promise.all([
                user_model_1.UserModel.find(filter)
                    .sort(sort)
                    .skip(startIndex)
                    .limit(limit)
                    .populate({ path: 'parentId', select: 'name' }) // <- explicit populate
                    .exec(),
                user_model_1.UserModel.countDocuments(filter),
            ]);
            const mappedData = data.map((staffDoc) => {
                const staff = staffDoc.toObject();
                return {
                    ...staff,
                    franchiseName: staff.parentId?.name ?? null,
                };
            });
            const result = { data: mappedData, total, page, limit };
            return (0, response_1.successResponse)(res, result, 'Staff list retrieved successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list staff', { error });
        }
    },
    async listAll(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            let filter = { role: constants_1.ROLES.STAFF, isDeleted: false };
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                if (req.body.franchiseId) {
                    const franchiseId = toObjectIdOrNull(req.body.franchiseId);
                    if (franchiseId)
                        filter.parentId = franchiseId;
                }
            }
            else if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                filter.parentId = toObjectIdOrNull(loggedUser.id);
            }
            else {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
            }
            if (req.body.search) {
                const s = String(req.body.search).trim();
                filter.$or = [
                    { name: { $regex: s, $options: 'i' } },
                    { email: { $regex: s, $options: 'i' } },
                    { phoneNumber: { $regex: s, $options: 'i' } },
                ];
            }
            if (req.body.isActive !== undefined) {
                filter.isActive = Boolean(req.body.isActive);
            }
            let sort = { createdAt: -1 };
            if (req.body.sortBy) {
                const parts = String(req.body.sortBy).split(':');
                sort = { [parts[0]]: parts[1] === 'asc' ? 1 : -1 };
            }
            const data = await user_service_1.UserService.find(filter, undefined, { sort, populate: { path: 'parentId', select: 'name' } });
            const total = await user_service_1.UserService.count(filter);
            // Map data to replace parentId with franchiseName
            const mappedData = data.map((staff) => {
                const { parentId, ...rest } = staff.toObject();
                return { ...rest, franchiseName: parentId?.name || null };
            });
            const result = { data: mappedData, total, page: 1, limit: mappedData.length };
            return (0, response_1.successResponse)(res, result, 'Staff list retrieved successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list staff', { error });
        }
    },
    async getStaffById(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const staffId = req.params.id;
            const staff = await user_service_1.UserService.findById(staffId);
            if (!staff || staff.role !== constants_1.ROLES.STAFF) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'Staff not found');
            }
            const role = Number(loggedUser.role);
            const loggedUserId = toObjectIdOrNull(loggedUser.id);
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                // Master admin can view any staff
                return (0, response_1.successResponse)(res, staff, 'Staff retrieved successfully');
            }
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                // Franchise admin can only view their own staff
                const staffParentId = toObjectIdOrNull(staff.parentId ?? null);
                if (!staffParentId || !staffParentId.equals(loggedUserId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                return (0, response_1.successResponse)(res, staff, 'Staff retrieved successfully');
            }
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get staff', { error });
        }
    },
    async updateStaff(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const staffId = req.params.id;
            const staff = await user_service_1.UserService.findById(staffId);
            if (!staff || staff.role !== constants_1.ROLES.STAFF) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'Staff not found');
            }
            const role = Number(loggedUser.role);
            const loggedUserId = toObjectIdOrNull(loggedUser.id);
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                // Master admin can update any staff
                if (req.body.franchiseId && !req.body.parentId) {
                    req.body.parentId = req.body.franchiseId;
                }
                const updated = await user_service_1.UserService.updateUser(staffId, req.body);
                return (0, response_1.successResponse)(res, updated, 'Staff updated successfully');
            }
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                // Franchise admin can only update their own staff
                const staffParentId = toObjectIdOrNull(staff.parentId ?? null);
                if (!staffParentId || !staffParentId.equals(loggedUserId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                const updatePayload = { ...req.body };
                delete updatePayload.role; // Cannot change staff role
                delete updatePayload.parentId; // Cannot change parent franchise
                const updated = await user_service_1.UserService.updateUser(staffId, updatePayload);
                return (0, response_1.successResponse)(res, updated, 'Staff updated successfully');
            }
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to update staff', { error });
        }
    },
    async deleteStaff(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const staffId = req.params.id;
            const staff = await user_service_1.UserService.findById(staffId);
            if (!staff || staff.role !== constants_1.ROLES.STAFF) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'Staff not found');
            }
            const role = Number(loggedUser.role);
            const loggedUserId = toObjectIdOrNull(loggedUser.id);
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                // Master admin can delete any staff
                await user_service_1.UserService.deleteById(staffId);
                return (0, response_1.successResponse)(res, {}, 'Staff deleted successfully');
            }
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                // Franchise admin can only delete their own staff
                const staffParentId = toObjectIdOrNull(staff.parentId ?? null);
                if (!staffParentId || !staffParentId.equals(loggedUserId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                await user_service_1.UserService.deleteById(staffId);
                return (0, response_1.successResponse)(res, {}, 'Staff deleted successfully');
            }
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete staff', { error });
        }
    },
    async toggleStaffStatus(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const staffId = req.params.id;
            const staff = await user_service_1.UserService.findById(staffId);
            if (!staff || staff.role !== constants_1.ROLES.STAFF) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'Staff not found');
            }
            const role = Number(loggedUser.role);
            const loggedUserId = toObjectIdOrNull(loggedUser.id);
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                // Master admin can toggle any staff status
                const updated = await user_service_1.UserService.updateUser(staffId, { isActive: !staff.isActive });
                return (0, response_1.successResponse)(res, updated, 'Staff status updated successfully');
            }
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                // Franchise admin can only toggle their own staff status
                const staffParentId = toObjectIdOrNull(staff.parentId ?? null);
                if (!staffParentId || !staffParentId.equals(loggedUserId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                const updated = await user_service_1.UserService.updateUser(staffId, { isActive: !staff.isActive });
                return (0, response_1.successResponse)(res, updated, 'Staff status updated successfully');
            }
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to toggle staff status', { error });
        }
    },
};
//# sourceMappingURL=staff.controller.js.map