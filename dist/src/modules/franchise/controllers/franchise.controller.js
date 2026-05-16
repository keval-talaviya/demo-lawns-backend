"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FranchiseController = void 0;
const http_status_codes_1 = require("http-status-codes");
const franchise_service_1 = require("../services/franchise.service");
const response_1 = require("../../../common/response");
const message_1 = require("../messages/message");
const constants_1 = require("../../../common/constants");
exports.FranchiseController = {
    async create(req, res) {
        try {
            // Only master admin can create franchises
            if (req.user?.role !== constants_1.ROLES.MASTER_ADMIN) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Only master admin can create franchises');
            }
            const franchise = await franchise_service_1.FranchiseService.createFranchise(req.body);
            res.status(http_status_codes_1.StatusCodes.CREATED);
            return (0, response_1.successResponse)(res, franchise, message_1.FRANCHISE_MESSAGES.CREATED);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to create franchise', { error });
        }
    },
    async list(req, res) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 25;
            const filter = {};
            if (req.query.isActive !== undefined) {
                filter.isActive = req.query.isActive === 'true';
            }
            if (req.query.search) {
                filter.$or = [
                    { name: { $regex: req.query.search, $options: 'i' } },
                    { email: { $regex: req.query.search, $options: 'i' } },
                ];
            }
            const result = await franchise_service_1.FranchiseService.paginate(filter, { page, limit });
            return (0, response_1.successResponse)(res, result, message_1.FRANCHISE_MESSAGES.LISTED);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list franchises', { error });
        }
    },
    async getById(req, res) {
        try {
            const franchise = await franchise_service_1.FranchiseService.findById(req.params.id);
            if (!franchise) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'Franchise not found');
            }
            return (0, response_1.successResponse)(res, franchise, 'Franchise retrieved successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get franchise', { error });
        }
    },
    async update(req, res) {
        try {
            // Only master admin can update franchises
            if (req.user?.role !== constants_1.ROLES.MASTER_ADMIN) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Only master admin can update franchises');
            }
            const updated = await franchise_service_1.FranchiseService.updateFranchise(req.params.id, req.body);
            return (0, response_1.successResponse)(res, updated, message_1.FRANCHISE_MESSAGES.UPDATED);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to update franchise', { error });
        }
    },
    async listAll(req, res) {
        try {
            // Only master admin can list all franchises
            if (req.user?.role !== constants_1.ROLES.MASTER_ADMIN) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Only master admin can list all franchises');
            }
            const filter = {};
            if (req.query.isActive !== undefined) {
                filter.isActive = req.query.isActive === 'true';
            }
            if (req.query.search) {
                filter.$or = [
                    { name: { $regex: req.query.search, $options: 'i' } },
                    { email: { $regex: req.query.search, $options: 'i' } },
                ];
            }
            const franchises = await franchise_service_1.FranchiseService.find(filter, undefined, {});
            return (0, response_1.successResponse)(res, franchises, message_1.FRANCHISE_MESSAGES.LISTED);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list all franchises', { error });
        }
    },
    async remove(req, res) {
        try {
            // Only master admin can delete franchises
            if (req.user?.role !== constants_1.ROLES.MASTER_ADMIN) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Only master admin can delete franchises');
            }
            await franchise_service_1.FranchiseService.deleteById(req.params.id);
            return res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete franchise', { error });
        }
    },
};
//# sourceMappingURL=franchise.controller.js.map