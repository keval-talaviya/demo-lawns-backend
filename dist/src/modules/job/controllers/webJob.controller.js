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
exports.JobController = void 0;
const http_status_codes_1 = require("http-status-codes");
const job_service_1 = require("../services/job.service");
const response_1 = require("../../../common/response");
const message_1 = require("../messages/message");
const mongoose_1 = require("mongoose");
const constants_1 = require("../../../common/constants");
const franchise_model_1 = require("../../franchise/model/franchise.model");
const user_model_1 = require("../../user/model/user.model");
const customer_model_1 = require("../../customer/model/customer.model");
const quotation_model_1 = require("../../quotation/model/quotation.model");
function toObjectIdOrNull(id) {
    if (!id)
        return null;
    if (mongoose_1.Types.ObjectId.isValid(id))
        return new mongoose_1.Types.ObjectId(id);
    return null;
}
function franchiseAccessAllowed(resourceFranchiseId, userFranchiseId) {
    if (!resourceFranchiseId)
        return true;
    if (!userFranchiseId)
        return false;
    const rId = resourceFranchiseId._id || resourceFranchiseId;
    return String(rId) === String(userFranchiseId);
}
exports.JobController = {
    async create(req, res) {
        try {
            const loggedUser = req.user;
            let franchiseId = null;
            if (Number(loggedUser.role) === constants_1.ROLES.FRANCHISE_ADMIN) {
                franchiseId = toObjectIdOrNull(loggedUser.id);
                req.body.franchiseId = franchiseId;
                // When a franchise admin creates a job, default the assignedTo to the logged-in id
                if (!req.body.assignedTo) {
                    req.body.assignedTo = franchiseId;
                }
            }
            else if (Number(loggedUser.role) === constants_1.ROLES.MASTER_ADMIN) {
                franchiseId = req.body?.franchiseId ? toObjectIdOrNull(req.body.franchiseId) : null;
                req.body.franchiseId = franchiseId;
            }
            else {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
            }
            // Handle new customer creation
            let customerId = req.body.customerId;
            if (req.body.isNewCustomer) {
                // Import CustomerService dynamically to avoid circular dependency
                const { CustomerService } = await Promise.resolve().then(() => __importStar(require('../../customer/services/customer.service')));
                const customerData = {
                    name: req.body.customerName,
                    email: req.body.customerEmail,
                    phone: req.body.customerPhone,
                    companyName: req.body.customerCompanyName,
                    address: req.body.customerAddress,
                    franchiseId: franchiseId?.toString() || '',
                    createdBy: toObjectIdOrNull(loggedUser.id) || undefined,
                };
                const newCustomer = await CustomerService.createCustomer(customerData, franchiseId);
                customerId = newCustomer._id;
            }
            const payload = {
                ...req.body,
                customerId,
                createdBy: toObjectIdOrNull(loggedUser.id),
                // Set default values for new fields
                jobType: req.body.jobType || 1, // Default to one-time
                amount: req.body.amount || 0,
                items: req.body.items || [],
            };
            const job = await job_service_1.JobService.createJob(payload);
            res.status(http_status_codes_1.StatusCodes.CREATED);
            return (0, response_1.successResponse)(res, job, message_1.JOB_MESSAGES.CREATED);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to create job', { error });
        }
    },
    // Controller: list
    async list(req, res) {
        try {
            const page = Math.max(1, Number(req.body.page) || 1);
            const limit = Math.max(1, Number(req.body.limit) || 25);
            const filter = { isDeleted: false };
            const loggedUser = req.user;
            if (loggedUser && Number(loggedUser.role) === constants_1.ROLES.FRANCHISE_ADMIN) {
                const userFid = toObjectIdOrNull(loggedUser.id);
                if (userFid)
                    filter.franchiseId = userFid;
            }
            else if (loggedUser && Number(loggedUser.role) === constants_1.ROLES.MASTER_ADMIN) {
                if (req.body.franchiseId && req.body.franchiseId !== '') {
                    const qfid = toObjectIdOrNull(req.body.franchiseId);
                    if (qfid)
                        filter.franchiseId = qfid;
                }
            }
            if (req.body.status !== undefined && req.body.status !== '') {
                filter.status = Number(req.body.status);
            }
            if (req.body.paymentType !== undefined && req.body.paymentType !== '') {
                filter.paymentType = Number(req.body.paymentType);
            }
            if (req.body.jobType !== undefined && req.body.jobType !== '') {
                const jtRaw = req.body.jobType;
                const jtNum = Number(jtRaw);
                filter.jobType = !isNaN(jtNum) ? jtNum : String(jtRaw);
            }
            if (req.body.assignedTo && req.body.assignedTo !== '') {
                const uid = toObjectIdOrNull(req.body.assignedTo);
                if (uid)
                    filter.assignedTo = uid;
            }
            if (req.body.customerId && req.body.customerId !== '') {
                const cid = toObjectIdOrNull(req.body.customerId);
                if (cid)
                    filter.customerId = cid;
            }
            if (req.body.jobDate) {
                const d = new Date(String(req.body.jobDate));
                if (!isNaN(d.getTime())) {
                    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                    const start = new Date(dateOnly);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(dateOnly);
                    end.setHours(23, 59, 59, 999);
                    filter.jobDate = { $gte: start, $lte: end };
                }
            }
            else if (filter.status === constants_1.JOB_STATUS.PENDING) {
                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                filter.jobDate = { $gte: startOfToday };
            }
            else if (filter.status === constants_1.JOB_STATUS.OVERDUE) {
                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                filter.jobDate = { $lt: startOfToday };
            }
            if (req.query.jobId) {
                const qid = toObjectIdOrNull(String(req.query.jobId));
                if (qid) {
                    filter._id = qid;
                }
            }
            if (req.body.search !== undefined) {
                const raw = req.body.search;
                const s = String(raw).trim();
                if (s !== '') {
                    const lower = s.toLowerCase();
                    if (['null', 'nil', 'none', 'empty'].includes(lower)) {
                        filter.$or = [
                            { jobAddress: { $in: [null, ''] } },
                            { notes: { $in: [null, ''] } },
                        ];
                    }
                    else {
                        const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const [matchingCustomers, matchingAssignedUsers, matchingFranchises, matchingQuotations,] = await Promise.all([
                            customer_model_1.CustomerModel.find({
                                $or: [
                                    { name: { $regex: escaped, $options: 'i' } },
                                    { phone: { $regex: escaped, $options: 'i' } },
                                    { email: { $regex: escaped, $options: 'i' } },
                                ],
                            }).select('_id').lean(),
                            user_model_1.UserModel.find({
                                $or: [
                                    { name: { $regex: escaped, $options: 'i' } },
                                    { email: { $regex: escaped, $options: 'i' } },
                                ],
                            }).select('_id').lean(),
                            franchise_model_1.FranchiseModel.find({
                                $or: [
                                    { name: { $regex: escaped, $options: 'i' } },
                                    { email: { $regex: escaped, $options: 'i' } },
                                ],
                            }).select('_id').lean(),
                            quotation_model_1.QuotationModel.find({
                                uniqueCode: { $regex: escaped, $options: 'i' },
                            }).select('_id').lean(),
                        ]);
                        const customerIds = matchingCustomers.map((c) => c._id);
                        const assignedIds = matchingAssignedUsers.map((u) => u._id);
                        const franchiseIds = matchingFranchises.map((f) => f._id);
                        const quotationIds = matchingQuotations.map((q) => q._id);
                        const searchConditions = [
                            { jobAddress: { $regex: escaped, $options: 'i' } },
                            { notes: { $regex: escaped, $options: 'i' } },
                            { 'items.name': { $regex: escaped, $options: 'i' } },
                            { 'items.description': { $regex: escaped, $options: 'i' } },
                        ];
                        if (customerIds.length > 0) {
                            searchConditions.push({ customerId: { $in: customerIds } });
                        }
                        if (assignedIds.length > 0) {
                            searchConditions.push({ assignedTo: { $in: assignedIds } });
                        }
                        if (franchiseIds.length > 0) {
                            searchConditions.push({ franchiseId: { $in: franchiseIds } });
                        }
                        if (quotationIds.length > 0) {
                            searchConditions.push({ quotationId: { $in: quotationIds } });
                        }
                        filter.$or = searchConditions;
                    }
                }
            }
            let sort = { createdAt: -1 };
            if (req.body.sortBy) {
                const parts = String(req.body.sortBy).split(':');
                sort = { [parts[0]]: parts[1] === 'asc' ? 1 : -1 };
            }
            else if (req.body.sortOrder) {
                const dir = String(req.body.sortOrder).toLowerCase() === 'asc' ? 1 : -1;
                const field = req.body.sortField || 'jobDate';
                sort = { [field]: dir };
            }
            else if (filter.status === constants_1.JOB_STATUS.PENDING) {
                sort = { jobDate: 1 };
            }
            else if (filter.status === constants_1.JOB_STATUS.OVERDUE) {
                sort = { jobDate: 1 };
            }
            const result = await job_service_1.JobService.paginate(filter, { page, limit, sort });
            return (0, response_1.successResponse)(res, result, message_1.JOB_MESSAGES.LISTED);
        }
        catch (error) {
            console.error('list error:', error);
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to list jobs: ${error.message}`, { error: error.message });
        }
    },
    async getById(req, res) {
        try {
            const id = req.query.id;
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid job id');
            }
            const job = await job_service_1.JobService.findById(id);
            if (!job) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, message_1.JOB_MESSAGES.NOT_FOUND);
            }
            const loggedUser = req.user;
            const role = loggedUser ? Number(loggedUser.role) : null;
            // Master admin can access all jobs
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                return (0, response_1.successResponse)(res, job, message_1.JOB_MESSAGES.DETAILS_FETCHED);
            }
            // Franchise admin can only access their own franchise jobs
            if (role === constants_1.ROLES.FRANCHISE_ADMIN && loggedUser) {
                const userFranchiseId = toObjectIdOrNull(loggedUser.id);
                if (!franchiseAccessAllowed(job.franchiseId, userFranchiseId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                return (0, response_1.successResponse)(res, job, message_1.JOB_MESSAGES.DETAILS_FETCHED);
            }
            // Other roles cannot access
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            console.error('getById error:', error);
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to get job: ${error.message}`, { error: error.message, stack: error.stack });
        }
    },
    async update(req, res) {
        try {
            const id = req.query.id;
            if (!mongoose_1.Types.ObjectId.isValid(id))
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid job id');
            const job = await job_service_1.JobService.findById(id);
            if (!job)
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, message_1.JOB_MESSAGES.NOT_FOUND);
            const loggedUser = req.user;
            if (!loggedUser)
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            const role = Number(loggedUser.role);
            // Master admin can access all jobs
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                const updated = await job_service_1.JobService.updateJob(id, req.body);
                return (0, response_1.successResponse)(res, updated, message_1.JOB_MESSAGES.UPDATED);
            }
            // Franchise admin can only update their own franchise jobs
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                if (!franchiseAccessAllowed(job.franchiseId, toObjectIdOrNull(loggedUser.id))) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                const updatePayload = { ...req.body };
                delete updatePayload.franchiseId;
                delete updatePayload.id;
                const updated = await job_service_1.JobService.updateJob(id, updatePayload);
                return (0, response_1.successResponse)(res, updated, message_1.JOB_MESSAGES.UPDATED);
            }
            // Other roles cannot access
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to update job', { error });
        }
    },
    async remove(req, res) {
        try {
            const id = req.query.id;
            if (!mongoose_1.Types.ObjectId.isValid(id))
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid job id');
            const job = await job_service_1.JobService.findById(id);
            if (!job)
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, message_1.JOB_MESSAGES.NOT_FOUND);
            const loggedUser = req.user;
            if (!loggedUser)
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            const role = Number(loggedUser.role);
            // Master admin can access all jobs
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                await job_service_1.JobService.deleteById(id);
                return (0, response_1.successResponse)(res, {}, message_1.JOB_MESSAGES.DELETED);
            }
            // Franchise admin can only delete their own franchise jobs
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                if (!franchiseAccessAllowed(job.franchiseId, toObjectIdOrNull(loggedUser.id))) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                await job_service_1.JobService.deleteById(id);
                return (0, response_1.successResponse)(res, {}, message_1.JOB_MESSAGES.DELETED);
            }
            // Other roles cannot access
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            console.error('remove error:', error);
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to delete job: ${error.message}`, { error: error.message });
        }
    },
    async complete(req, res) {
        try {
            const id = req.query.id;
            if (!mongoose_1.Types.ObjectId.isValid(id))
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid job id');
            const job = await job_service_1.JobService.findById(id);
            if (!job)
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, message_1.JOB_MESSAGES.NOT_FOUND);
            const loggedUser = req.user;
            if (!loggedUser)
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            const role = Number(loggedUser.role);
            // Distinguish between 0 and undefined
            const amountPaid = req.body.amountPaid !== undefined ? Number(req.body.amountPaid) : undefined;
            // Master admin can access all jobs
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                const completed = await job_service_1.JobService.completeJob(id, loggedUser.id, amountPaid);
                return (0, response_1.successResponse)(res, completed, message_1.JOB_MESSAGES.COMPLETED);
            }
            // Franchise admin can only complete their own franchise jobs
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                if (!franchiseAccessAllowed(job.franchiseId, toObjectIdOrNull(loggedUser.id))) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                const completed = await job_service_1.JobService.completeJob(id, loggedUser.id, amountPaid);
                return (0, response_1.successResponse)(res, completed, message_1.JOB_MESSAGES.COMPLETED);
            }
            // Other roles cannot access
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            console.error('complete error:', error);
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to complete job: ${error.message}`, { error: error.message, stack: error.stack });
        }
    },
    async cancel(req, res) {
        try {
            const id = req.query.id;
            if (!mongoose_1.Types.ObjectId.isValid(id))
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid job id');
            const job = await job_service_1.JobService.findById(id);
            if (!job)
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, message_1.JOB_MESSAGES.NOT_FOUND);
            const loggedUser = req.user;
            if (!loggedUser)
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            const role = Number(loggedUser.role);
            // Master admin can access all jobs
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                const cancelled = await job_service_1.JobService.cancelJob(id, loggedUser.id);
                return (0, response_1.successResponse)(res, cancelled, message_1.JOB_MESSAGES.CANCELLED);
            }
            // Franchise admin can only cancel their own franchise jobs
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                if (!franchiseAccessAllowed(job.franchiseId, toObjectIdOrNull(loggedUser.id))) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                const cancelled = await job_service_1.JobService.cancelJob(id, loggedUser.id);
                return (0, response_1.successResponse)(res, cancelled, message_1.JOB_MESSAGES.CANCELLED);
            }
            // Other roles cannot access
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            console.error('cancel error:', error);
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to cancel job: ${error.message}`, { error: error.message });
        }
    },
};
//# sourceMappingURL=webJob.controller.js.map