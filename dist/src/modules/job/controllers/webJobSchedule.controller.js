"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobScheduleController = void 0;
const http_status_codes_1 = require("http-status-codes");
const job_service_1 = require("../services/job.service");
const response_1 = require("../../../common/response");
const mongoose_1 = require("mongoose");
const constants_1 = require("../../../common/constants");
function toObjectIdOrNull(id) {
    if (!id)
        return null;
    if (mongoose_1.Types.ObjectId.isValid(id))
        return new mongoose_1.Types.ObjectId(id);
    return null;
}
exports.JobScheduleController = {
    /**
     * Get Month View - Returns jobs grouped by day for a specified month
     * Query params: year, month, franchiseId (optional for master admin)
     */
    async getMonthView(req, res) {
        try {
            const year = Number(req.query.year);
            const month = Number(req.query.month); // 1-12
            if (!year || !month || month < 1 || month > 12) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Valid year and month (1-12) are required');
            }
            const loggedUser = req.user;
            const role = loggedUser ? Number(loggedUser.role) : null;
            // Determine franchise filter
            let franchiseId = null;
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                franchiseId = toObjectIdOrNull(loggedUser.id);
            }
            else if (role === constants_1.ROLES.MASTER_ADMIN && req.query.franchiseId) {
                franchiseId = toObjectIdOrNull(req.query.franchiseId);
            }
            // Calculate start and end dates for the month
            const startDate = new Date(year, month - 1, 1); // First day of month
            const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month
            const filter = { isDeleted: false };
            if (franchiseId) {
                filter.franchiseId = franchiseId;
            }
            // Add additional filters if provided
            if (req.query.status !== undefined && req.query.status !== '') {
                filter.status = Number(req.query.status);
            }
            if (req.query.assignedTo) {
                const assignedId = toObjectIdOrNull(req.query.assignedTo);
                if (assignedId)
                    filter.assignedTo = assignedId;
            }
            const jobs = await job_service_1.JobService.getJobsByDateRange(startDate, endDate, filter);
            const groupedJobs = job_service_1.JobService.groupJobsByDate(jobs);
            return (0, response_1.successResponse)(res, {
                year,
                month,
                startDate,
                endDate,
                jobsByDate: groupedJobs,
                totalJobs: jobs.length,
            }, 'Month view fetched successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch month view', { error });
        }
    },
    /**
     * Get Week View - Returns jobs grouped by day for a specified week
     * Query params: startDate, endDate, franchiseId (optional)
     */
    async getWeekView(req, res) {
        try {
            const startDateStr = req.query.startDate;
            const endDateStr = req.query.endDate;
            if (!startDateStr || !endDateStr) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'startDate and endDate are required');
            }
            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid date format');
            }
            // Set time boundaries
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            const loggedUser = req.user;
            const role = loggedUser ? Number(loggedUser.role) : null;
            // Determine franchise filter
            let franchiseId = null;
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                franchiseId = toObjectIdOrNull(loggedUser.id);
            }
            else if (role === constants_1.ROLES.MASTER_ADMIN && req.query.franchiseId) {
                franchiseId = toObjectIdOrNull(req.query.franchiseId);
            }
            const filter = { isDeleted: false };
            if (franchiseId) {
                filter.franchiseId = franchiseId;
            }
            // Add additional filters
            if (req.query.status !== undefined && req.query.status !== '') {
                filter.status = Number(req.query.status);
            }
            if (req.query.assignedTo) {
                const assignedId = toObjectIdOrNull(req.query.assignedTo);
                if (assignedId)
                    filter.assignedTo = assignedId;
            }
            const jobs = await job_service_1.JobService.getJobsByDateRange(startDate, endDate, filter);
            const groupedJobs = job_service_1.JobService.groupJobsByDate(jobs);
            return (0, response_1.successResponse)(res, {
                startDate,
                endDate,
                jobsByDate: groupedJobs,
                totalJobs: jobs.length,
            }, 'Week view fetched successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch week view', { error });
        }
    },
    /**
     * Get Day View - Returns all jobs for a specific day
     * Query params: date, franchiseId (optional)
     */
    async getDayView(req, res) {
        try {
            const dateStr = req.query.date;
            if (!dateStr) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'date is required');
            }
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid date format');
            }
            // Set time boundaries for the entire day
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            const loggedUser = req.user;
            const role = loggedUser ? Number(loggedUser.role) : null;
            // Determine franchise filter
            let franchiseId = null;
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                franchiseId = toObjectIdOrNull(loggedUser.id);
            }
            else if (role === constants_1.ROLES.MASTER_ADMIN && req.query.franchiseId) {
                franchiseId = toObjectIdOrNull(req.query.franchiseId);
            }
            const filter = { isDeleted: false };
            if (franchiseId) {
                filter.franchiseId = franchiseId;
            }
            // Add additional filters
            if (req.query.status !== undefined && req.query.status !== '') {
                filter.status = Number(req.query.status);
            }
            if (req.query.assignedTo) {
                const assignedId = toObjectIdOrNull(req.query.assignedTo);
                if (assignedId)
                    filter.assignedTo = assignedId;
            }
            const jobs = await job_service_1.JobService.getJobsByDateRange(startDate, endDate, filter);
            // Sort jobs by time if available
            const sortedJobs = jobs.sort((a, b) => {
                const timeA = a.jobDate ? new Date(a.jobDate).getTime() : 0;
                const timeB = b.jobDate ? new Date(b.jobDate).getTime() : 0;
                return timeA - timeB;
            });
            return (0, response_1.successResponse)(res, {
                date: dateStr,
                jobs: sortedJobs,
                totalJobs: sortedJobs.length,
            }, 'Day view fetched successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch day view', { error });
        }
    },
    /**
     * Get Schedule Stats - Returns summary statistics for calendar badges
     * Query params: startDate, endDate, franchiseId (optional)
     */
    async getScheduleStats(req, res) {
        try {
            const startDateStr = req.query.startDate;
            const endDateStr = req.query.endDate;
            if (!startDateStr || !endDateStr) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'startDate and endDate are required');
            }
            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid date format');
            }
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            const loggedUser = req.user;
            const role = loggedUser ? Number(loggedUser.role) : null;
            // Determine franchise filter
            let franchiseId = null;
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                franchiseId = toObjectIdOrNull(loggedUser.id);
            }
            else if (role === constants_1.ROLES.MASTER_ADMIN && req.query.franchiseId) {
                franchiseId = toObjectIdOrNull(req.query.franchiseId);
            }
            const filter = { isDeleted: false };
            if (franchiseId) {
                filter.franchiseId = franchiseId;
            }
            const stats = await job_service_1.JobService.getJobCountsByDate(startDate, endDate, filter);
            return (0, response_1.successResponse)(res, stats, 'Schedule stats fetched successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch schedule stats', { error });
        }
    },
};
//# sourceMappingURL=webJobSchedule.controller.js.map