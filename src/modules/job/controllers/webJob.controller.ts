import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { JobService } from '../services/job.service';
import { successResponse, errorResponse } from '../../../common/response';
import { JOB_MESSAGES } from '../messages/message';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { Types } from 'mongoose';
import { ROLES, JOB_STATUS } from '../../../common/constants';
import { FranchiseModel } from '../../franchise/model/franchise.model';
import { UserModel } from '../../user/model/user.model';
import { CustomerModel } from '../../customer/model/customer.model';
import { QuotationModel } from '../../quotation/model/quotation.model';

function toObjectIdOrNull(id?: string | Types.ObjectId | null): Types.ObjectId | null {
  if (!id) return null;
  if (Types.ObjectId.isValid(id as any)) return new Types.ObjectId(id);
  return null;
}

function franchiseAccessAllowed(resourceFranchiseId: any, userFranchiseId: any) {
  if (!resourceFranchiseId) return true;
  if (!userFranchiseId) return false;

  const rId = resourceFranchiseId._id || resourceFranchiseId;
  return String(rId) === String(userFranchiseId);
}

export const JobController = {
  async create(req: AuthRequest, res: Response) {
    try {
      const loggedUser = req.user;
      let franchiseId: Types.ObjectId | null = null;



      if (Number((loggedUser as any).role) === ROLES.FRANCHISE_ADMIN) {
        franchiseId = toObjectIdOrNull((loggedUser as any).id);
        req.body.franchiseId = franchiseId;
        // When a franchise admin creates a job, default the assignedTo to the logged-in id
        if (!req.body.assignedTo) {
          req.body.assignedTo = franchiseId;
        }
      } else if (Number((loggedUser as any).role) === ROLES.MASTER_ADMIN) {
        franchiseId = req.body?.franchiseId ? toObjectIdOrNull(req.body.franchiseId as any) : null;
        req.body.franchiseId = franchiseId;
      } else {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
      }

      // Handle new customer creation
      let customerId = req.body.customerId;
      if (req.body.isNewCustomer) {
        // Import CustomerService dynamically to avoid circular dependency
        const { CustomerService } = await import('../../customer/services/customer.service');

        const customerData = {
          name: req.body.customerName,
          email: req.body.customerEmail,
          phone: req.body.customerPhone,
          companyName: req.body.customerCompanyName,
          address: req.body.customerAddress,
          franchiseId: franchiseId?.toString() || '',
          createdBy: toObjectIdOrNull((loggedUser as any).id) || undefined,
        };

        const newCustomer = await CustomerService.createCustomer(customerData, franchiseId);
        customerId = newCustomer._id;
      }

      const payload = {
        ...req.body,
        customerId,
        createdBy: toObjectIdOrNull((loggedUser as any).id),
        // Set default values for new fields
        jobType: req.body.jobType || 1, // Default to one-time
        amount: req.body.amount || 0,
        items: req.body.items || [],
      };



      const job = await JobService.createJob(payload);
      res.status(StatusCodes.CREATED);
      return successResponse(res, job, JOB_MESSAGES.CREATED);
    } catch (error: any) {
      return errorResponse(res, StatusCodes.BAD_REQUEST, error.message || 'Failed to create job', { error });
    }
  },

  // Controller: list
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
        if (req.body.franchiseId && req.body.franchiseId !== '') {
          const qfid = toObjectIdOrNull(req.body.franchiseId as any);
          if (qfid) filter.franchiseId = qfid;
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
        const uid = toObjectIdOrNull(req.body.assignedTo as any);
        if (uid) filter.assignedTo = uid;
      }

      if (req.body.customerId && req.body.customerId !== '') {
        const cid = toObjectIdOrNull(req.body.customerId as any);
        if (cid) filter.customerId = cid;
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
      } else if (filter.status === JOB_STATUS.PENDING) {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        filter.jobDate = { $gte: startOfToday };
      } else if (filter.status === JOB_STATUS.OVERDUE) {
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
          } else {
            const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const [
              matchingCustomers,
              matchingAssignedUsers,
              matchingFranchises,
              matchingQuotations,
            ] = await Promise.all([
              CustomerModel.find({
                $or: [
                  { name: { $regex: escaped, $options: 'i' } },
                  { phone: { $regex: escaped, $options: 'i' } },
                  { email: { $regex: escaped, $options: 'i' } },
                ],
              }).select('_id').lean(),
              UserModel.find({
                $or: [
                  { name: { $regex: escaped, $options: 'i' } },
                  { email: { $regex: escaped, $options: 'i' } },
                ],
              }).select('_id').lean(),
              FranchiseModel.find({
                $or: [
                  { name: { $regex: escaped, $options: 'i' } },
                  { email: { $regex: escaped, $options: 'i' } },
                ],
              }).select('_id').lean(),
              QuotationModel.find({
                uniqueCode: { $regex: escaped, $options: 'i' },
              }).select('_id').lean(),
            ]);

            const customerIds = matchingCustomers.map((c: any) => c._id);
            const assignedIds = matchingAssignedUsers.map((u: any) => u._id);
            const franchiseIds = matchingFranchises.map((f: any) => f._id);
            const quotationIds = matchingQuotations.map((q: any) => q._id);

            const searchConditions: any[] = [
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

      let sort: any = { createdAt: -1 };
      if (req.body.sortBy) {
        const parts = String(req.body.sortBy).split(':');
        sort = { [parts[0]]: parts[1] === 'asc' ? 1 : -1 };
      } else if (req.body.sortOrder) {
        const dir = String(req.body.sortOrder).toLowerCase() === 'asc' ? 1 : -1;
        const field = req.body.sortField || 'jobDate';
        sort = { [field]: dir };
      } else if (filter.status === JOB_STATUS.PENDING) {
        sort = { jobDate: 1 };
      } else if (filter.status === JOB_STATUS.OVERDUE) {
        sort = { jobDate: 1 };
      }

      const result = await JobService.paginate(filter, { page, limit, sort });
      return successResponse(res, result, JOB_MESSAGES.LISTED);
    } catch (error: any) {
      console.error('list error:', error);
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to list jobs: ${error.message}`, { error: error.message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = req.query.id as string;
      if (!Types.ObjectId.isValid(id)) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid job id');
      }

      const job = await JobService.findById(id);
      if (!job) {
        return errorResponse(res, StatusCodes.NOT_FOUND, JOB_MESSAGES.NOT_FOUND);
      }

      const loggedUser = req.user;
      const role = loggedUser ? Number((loggedUser as any).role) : null;

      // Master admin can access all jobs
      if (role === ROLES.MASTER_ADMIN) {
        return successResponse(res, job, JOB_MESSAGES.DETAILS_FETCHED);
      }

      // Franchise admin can only access their own franchise jobs
      if (role === ROLES.FRANCHISE_ADMIN && loggedUser) {
        const userFranchiseId = toObjectIdOrNull(loggedUser.id as any);
        if (!franchiseAccessAllowed((job as any).franchiseId as Types.ObjectId | null | undefined, userFranchiseId)) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
        return successResponse(res, job, JOB_MESSAGES.DETAILS_FETCHED);
      }

      // Other roles cannot access
      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      console.error('getById error:', error);
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to get job: ${error.message}`, { error: error.message, stack: error.stack });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const id = req.query.id as string;
      if (!Types.ObjectId.isValid(id)) return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid job id');

      const job = await JobService.findById(id);
      if (!job) return errorResponse(res, StatusCodes.NOT_FOUND, JOB_MESSAGES.NOT_FOUND);

      const loggedUser = req.user;
      if (!loggedUser) return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      const role = Number((loggedUser as any).role);

      // Master admin can access all jobs
      if (role === ROLES.MASTER_ADMIN) {
        const updated = await JobService.updateJob(id, req.body);
        return successResponse(res, updated, JOB_MESSAGES.UPDATED);
      }

      // Franchise admin can only update their own franchise jobs
      if (role === ROLES.FRANCHISE_ADMIN) {
        if (!franchiseAccessAllowed((job as any).franchiseId as Types.ObjectId | null | undefined, toObjectIdOrNull((loggedUser as any).id))) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
        const updatePayload = { ...req.body };
        delete updatePayload.franchiseId;
        delete updatePayload.id;
        const updated = await JobService.updateJob(id, updatePayload);
        return successResponse(res, updated, JOB_MESSAGES.UPDATED);
      }

      // Other roles cannot access
      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.BAD_REQUEST, error.message || 'Failed to update job', { error });
    }
  },

  async remove(req: AuthRequest, res: Response) {
    try {
      const id = req.query.id as string;
      if (!Types.ObjectId.isValid(id)) return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid job id');

      const job = await JobService.findById(id);
      if (!job) return errorResponse(res, StatusCodes.NOT_FOUND, JOB_MESSAGES.NOT_FOUND);

      const loggedUser = req.user;
      if (!loggedUser) return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      const role = Number((loggedUser as any).role);

      // Master admin can access all jobs
      if (role === ROLES.MASTER_ADMIN) {
        await JobService.deleteById(id);
        return successResponse(res, {}, JOB_MESSAGES.DELETED);
      }

      // Franchise admin can only delete their own franchise jobs
      if (role === ROLES.FRANCHISE_ADMIN) {
        if (!franchiseAccessAllowed((job as any).franchiseId as Types.ObjectId | null | undefined, toObjectIdOrNull((loggedUser as any).id))) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
        await JobService.deleteById(id);
        return successResponse(res, {}, JOB_MESSAGES.DELETED);
      }

      // Other roles cannot access
      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      console.error('remove error:', error);
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to delete job: ${error.message}`, { error: error.message });
    }
  },

  async complete(req: AuthRequest, res: Response) {
    try {
      const id = req.query.id as string;
      if (!Types.ObjectId.isValid(id)) return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid job id');

      const job = await JobService.findById(id);
      if (!job) return errorResponse(res, StatusCodes.NOT_FOUND, JOB_MESSAGES.NOT_FOUND);

      const loggedUser = req.user;
      if (!loggedUser) return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      const role = Number((loggedUser as any).role);

      // Distinguish between 0 and undefined
      const amountPaid = req.body.amountPaid !== undefined ? Number(req.body.amountPaid) : undefined;

      // Master admin can access all jobs
      if (role === ROLES.MASTER_ADMIN) {
        const completed = await JobService.completeJob(id, (loggedUser as any).id, amountPaid);
        return successResponse(res, completed, JOB_MESSAGES.COMPLETED);
      }


      // Franchise admin can only complete their own franchise jobs
      if (role === ROLES.FRANCHISE_ADMIN) {
        if (!franchiseAccessAllowed((job as any).franchiseId as Types.ObjectId | null | undefined, toObjectIdOrNull((loggedUser as any).id))) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }

        const completed = await JobService.completeJob(id, (loggedUser as any).id, amountPaid);
        return successResponse(res, completed, JOB_MESSAGES.COMPLETED);
      }


      // Other roles cannot access
      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      console.error('complete error:', error);
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to complete job: ${error.message}`, { error: error.message, stack: error.stack });
    }
  },

  async cancel(req: AuthRequest, res: Response) {
    try {
      const id = req.query.id as string;
      if (!Types.ObjectId.isValid(id)) return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid job id');

      const job = await JobService.findById(id);
      if (!job) return errorResponse(res, StatusCodes.NOT_FOUND, JOB_MESSAGES.NOT_FOUND);

      const loggedUser = req.user;
      if (!loggedUser) return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      const role = Number((loggedUser as any).role);

      // Master admin can access all jobs
      if (role === ROLES.MASTER_ADMIN) {
        const cancelled = await JobService.cancelJob(id, (loggedUser as any).id);
        return successResponse(res, cancelled, JOB_MESSAGES.CANCELLED);
      }

      // Franchise admin can only cancel their own franchise jobs
      if (role === ROLES.FRANCHISE_ADMIN) {
        if (!franchiseAccessAllowed((job as any).franchiseId as Types.ObjectId | null | undefined, toObjectIdOrNull((loggedUser as any).id))) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
        const cancelled = await JobService.cancelJob(id, (loggedUser as any).id);
        return successResponse(res, cancelled, JOB_MESSAGES.CANCELLED);
      }

      // Other roles cannot access
      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      console.error('cancel error:', error);
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to cancel job: ${error.message}`, { error: error.message });
    }
  },
};
