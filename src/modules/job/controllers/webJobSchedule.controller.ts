import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { JobService } from '../services/job.service';
import { successResponse, errorResponse } from '../../../common/response';
import { JOB_MESSAGES } from '../messages/message';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { Types } from 'mongoose';
import { ROLES } from '../../../common/constants';

function toObjectIdOrNull(id?: string | Types.ObjectId | null): Types.ObjectId | null {
    if (!id) return null;
    if (Types.ObjectId.isValid(id as any)) return new Types.ObjectId(id);
    return null;
}

export const JobScheduleController = {
    /**
     * Get Month View - Returns jobs grouped by day for a specified month
     * Query params: year, month, franchiseId (optional for master admin)
     */
    async getMonthView(req: AuthRequest, res: Response) {
        try {
            const year = Number(req.query.year);
            const month = Number(req.query.month); // 1-12

            if (!year || !month || month < 1 || month > 12) {
                return errorResponse(res, StatusCodes.BAD_REQUEST, 'Valid year and month (1-12) are required');
            }

            const loggedUser = req.user;
            const role = loggedUser ? Number((loggedUser as any).role) : null;

            // Determine franchise filter
            let franchiseId: Types.ObjectId | null = null;
            if (role === ROLES.FRANCHISE_ADMIN) {
                franchiseId = toObjectIdOrNull((loggedUser as any).id);
            } else if (role === ROLES.MASTER_ADMIN && req.query.franchiseId) {
                franchiseId = toObjectIdOrNull(req.query.franchiseId as string);
            }

            // Calculate start and end dates for the month
            const startDate = new Date(year, month - 1, 1); // First day of month
            const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month

            const filter: any = { isDeleted: false };
            if (franchiseId) {
                filter.franchiseId = franchiseId;
            }

            // Add additional filters if provided
            if (req.query.status !== undefined && req.query.status !== '') {
                filter.status = Number(req.query.status);
            }
            if (req.query.assignedTo) {
                const assignedId = toObjectIdOrNull(req.query.assignedTo as string);
                if (assignedId) filter.assignedTo = assignedId;
            }

            const jobs = await JobService.getJobsByDateRange(startDate, endDate, filter);
            const groupedJobs = JobService.groupJobsByDate(jobs);

            return successResponse(res, {
                year,
                month,
                startDate,
                endDate,
                jobsByDate: groupedJobs,
                totalJobs: jobs.length,
            }, 'Month view fetched successfully');
        } catch (error: any) {
            return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch month view', { error });
        }
    },

    /**
     * Get Week View - Returns jobs grouped by day for a specified week
     * Query params: startDate, endDate, franchiseId (optional)
     */
    async getWeekView(req: AuthRequest, res: Response) {
        try {
            const startDateStr = req.query.startDate as string;
            const endDateStr = req.query.endDate as string;

            if (!startDateStr || !endDateStr) {
                return errorResponse(res, StatusCodes.BAD_REQUEST, 'startDate and endDate are required');
            }

            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid date format');
            }

            // Set time boundaries
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            const loggedUser = req.user;
            const role = loggedUser ? Number((loggedUser as any).role) : null;

            // Determine franchise filter
            let franchiseId: Types.ObjectId | null = null;
            if (role === ROLES.FRANCHISE_ADMIN) {
                franchiseId = toObjectIdOrNull((loggedUser as any).id);
            } else if (role === ROLES.MASTER_ADMIN && req.query.franchiseId) {
                franchiseId = toObjectIdOrNull(req.query.franchiseId as string);
            }

            const filter: any = { isDeleted: false };
            if (franchiseId) {
                filter.franchiseId = franchiseId;
            }

            // Add additional filters
            if (req.query.status !== undefined && req.query.status !== '') {
                filter.status = Number(req.query.status);
            }
            if (req.query.assignedTo) {
                const assignedId = toObjectIdOrNull(req.query.assignedTo as string);
                if (assignedId) filter.assignedTo = assignedId;
            }

            const jobs = await JobService.getJobsByDateRange(startDate, endDate, filter);
            const groupedJobs = JobService.groupJobsByDate(jobs);

            return successResponse(res, {
                startDate,
                endDate,
                jobsByDate: groupedJobs,
                totalJobs: jobs.length,
            }, 'Week view fetched successfully');
        } catch (error: any) {
            return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch week view', { error });
        }
    },

    /**
     * Get Day View - Returns all jobs for a specific day
     * Query params: date, franchiseId (optional)
     */
    async getDayView(req: AuthRequest, res: Response) {
        try {
            const dateStr = req.query.date as string;

            if (!dateStr) {
                return errorResponse(res, StatusCodes.BAD_REQUEST, 'date is required');
            }

            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid date format');
            }

            // Set time boundaries for the entire day
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            const loggedUser = req.user;
            const role = loggedUser ? Number((loggedUser as any).role) : null;

            // Determine franchise filter
            let franchiseId: Types.ObjectId | null = null;
            if (role === ROLES.FRANCHISE_ADMIN) {
                franchiseId = toObjectIdOrNull((loggedUser as any).id);
            } else if (role === ROLES.MASTER_ADMIN && req.query.franchiseId) {
                franchiseId = toObjectIdOrNull(req.query.franchiseId as string);
            }

            const filter: any = { isDeleted: false };
            if (franchiseId) {
                filter.franchiseId = franchiseId;
            }

            // Add additional filters
            if (req.query.status !== undefined && req.query.status !== '') {
                filter.status = Number(req.query.status);
            }
            if (req.query.assignedTo) {
                const assignedId = toObjectIdOrNull(req.query.assignedTo as string);
                if (assignedId) filter.assignedTo = assignedId;
            }

            const jobs = await JobService.getJobsByDateRange(startDate, endDate, filter);

            // Sort jobs by time if available
            const sortedJobs = jobs.sort((a: any, b: any) => {
                const timeA = a.jobDate ? new Date(a.jobDate).getTime() : 0;
                const timeB = b.jobDate ? new Date(b.jobDate).getTime() : 0;
                return timeA - timeB;
            });

            return successResponse(res, {
                date: dateStr,
                jobs: sortedJobs,
                totalJobs: sortedJobs.length,
            }, 'Day view fetched successfully');
        } catch (error: any) {
            return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch day view', { error });
        }
    },

    /**
     * Get Schedule Stats - Returns summary statistics for calendar badges
     * Query params: startDate, endDate, franchiseId (optional)
     */
    async getScheduleStats(req: AuthRequest, res: Response) {
        try {
            const startDateStr = req.query.startDate as string;
            const endDateStr = req.query.endDate as string;

            if (!startDateStr || !endDateStr) {
                return errorResponse(res, StatusCodes.BAD_REQUEST, 'startDate and endDate are required');
            }

            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid date format');
            }

            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            const loggedUser = req.user;
            const role = loggedUser ? Number((loggedUser as any).role) : null;

            // Determine franchise filter
            let franchiseId: Types.ObjectId | null = null;
            if (role === ROLES.FRANCHISE_ADMIN) {
                franchiseId = toObjectIdOrNull((loggedUser as any).id);
            } else if (role === ROLES.MASTER_ADMIN && req.query.franchiseId) {
                franchiseId = toObjectIdOrNull(req.query.franchiseId as string);
            }

            const filter: any = { isDeleted: false };
            if (franchiseId) {
                filter.franchiseId = franchiseId;
            }

            const stats = await JobService.getJobCountsByDate(startDate, endDate, filter);

            return successResponse(res, stats, 'Schedule stats fetched successfully');
        } catch (error: any) {
            return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch schedule stats', { error });
        }
    },
};
