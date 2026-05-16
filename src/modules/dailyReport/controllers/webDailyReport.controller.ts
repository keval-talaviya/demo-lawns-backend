import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { successResponse, errorResponse } from '../../../common/response';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { ROLES, JOB_STATUS, PAYMENT_TYPE } from '../../../common/constants';
import { JobModel } from '../../job/model/job.model';
import { UserService } from '../../user/services/user.service';
import { InvoiceModel } from '../../invoice/model/invoice.model';

export const WebDailyReportController = {
  async getWorkReport(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const loggedUser = req.user;
      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const { userId } = req.query;
      const rawDate = req.query.date as string | undefined;
      const rawStart = req.query.startDate as string | undefined;
      const rawEnd = req.query.endDate as string | undefined;
      const statusQuery = req.query.status as string | undefined;

      if (!userId || !Types.ObjectId.isValid(userId as string)) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Valid User ID is required');
      }

      const targetUserId = new Types.ObjectId(userId as string);
      const role = Number((loggedUser as any).role);

      // Permission Check (same as your original)
      if (role === ROLES.FRANCHISE_ADMIN) {
        const targetUser = await UserService.findById(userId as string);
        if (!targetUser) {
          return errorResponse(res, StatusCodes.NOT_FOUND, 'User not found');
        }
        const loggedUserIdStr = String((loggedUser._id as any));
        const parentIdStr = targetUser.parentId ? String((targetUser.parentId as any)) : null;

        if (String(targetUser._id) !== loggedUserIdStr && parentIdStr !== loggedUserIdStr) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied: You can only view reports for your staff');
        }
      } else if (role !== ROLES.MASTER_ADMIN) {
        if (String((loggedUser._id as any)) !== String(userId)) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
      }

      // Helper: safe parse date that fixes " " -> "+" and decodes URI components
      const safeParseDate = (input?: string): Date | null => {
        if (!input) return null;
        try {
          // Decode in case client double-encoded or provided spaces where + should be
          let s = decodeURIComponent(String(input));
          // If someone sent "2025-11-23T05:48:53.159 00:00" (space instead of +), convert it back
          if (s.includes(' ')) {
            // common pattern: timezone part may be " 00:00" due to + -> space; replace the first space before timezone with "+"
            // but be conservative: only replace last occurrence of ' ' if it looks like a timezone segment
            const maybeTZ = s.match(/\s[+-]?\d{2}:\d{2}$/);
            if (maybeTZ) {
              s = s.replace(/\s([+-]?\d{2}:\d{2})$/, '+$1');
            } else {
              // fallback: replace all spaces with '+' only if it contains 'T' (iso-like)
              if (s.includes('T')) s = s.replace(/ /g, '+');
            }
          }
          const d = new Date(s);
          if (isNaN(d.getTime())) return null;
          return d;
        } catch (e) {
          return null;
        }
      };

      // Build Query with Legacy Fallback
      // Using $and at root level to combine all conditions properly
      const query: any = {
        $and: [
          { status: JOB_STATUS.COMPLETED },
          {
            $or: [
              { isDeleted: false },
              { isDeleted: null },
              { isDeleted: { $exists: false } }
            ]
          },
          {
            $or: [
              { assignedTo: targetUserId },
              { completedBy: targetUserId }
            ]
          }
        ]
      };

      // Date filtering with Legacy Fallback
      if (rawDate) {
        const parsed = safeParseDate(rawDate);
        if (!parsed) {
          return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid date format for parameter `date`');
        }

        const startOfDay = new Date(parsed);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(parsed);
        endOfDay.setUTCHours(23, 59, 59, 999);

        query.$and.push({
          $or: [
            { completionDate: { $gte: startOfDay, $lte: endOfDay } },
            { completionDate: null, updatedAt: { $gte: startOfDay, $lte: endOfDay } }
          ]
        });
      } else if (rawStart || rawEnd) {
        const startParsed = safeParseDate(rawStart || '');
        const endParsed = safeParseDate(rawEnd || '');

        if (rawStart && !startParsed) {
          return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid date format for parameter `startDate`');
        }
        if (rawEnd && !endParsed) {
          return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid date format for parameter `endDate`');
        }

        const dateFilter: any = {};
        if (startParsed) dateFilter.$gte = startParsed;
        if (endParsed) dateFilter.$lte = endParsed;

        // Add date range filter to the $and array
        query.$and.push({
          $or: [
            { completionDate: dateFilter },
            { completionDate: null, updatedAt: dateFilter }
          ]
        });
      }

      console.log('Work Report Query:', JSON.stringify(query, null, 2));



      const jobs = await JobModel.find(query)
        .populate('customerId', 'name')
        .populate('quotationId', 'quotationNumber')
        .sort({ completionDate: -1, updatedAt: -1 })
        .lean();

      console.log(`Found ${jobs.length} jobs`);

      const enrichedJobs = await Promise.all(jobs.map(async (job: any) => {
        const invoice = await InvoiceModel.findOne({ jobId: job._id })
          .select('invoiceNumber status paidAmount totalAmount paymentType')
          .lean();

        const invoiceNumber = invoice?.invoiceNumber || 'N/A';
        const invoiceId = invoice?._id || null;
        const invoiceStatus = invoice?.status ?? 1;

        let paymentStatus: string;
        if (invoiceStatus === 3) paymentStatus = 'PAID';
        else if (invoiceStatus === 2) paymentStatus = 'PARTIAL';
        else if (invoiceStatus === 5) paymentStatus = 'OVERDUE';
        else paymentStatus = 'UNPAID';

        const pType = invoice?.paymentType ?? job.paymentType;
        const paymentTypeLabel = pType === PAYMENT_TYPE.CASH ? 'Cash' : 'Bank Transfer';

        const jobAmount = Number(job.amount || 0);
        const receivedAmount = Number(invoice?.paidAmount || 0);

        return {
          jobId: job._id,
          jobNumber: job.jobNumber || String(job._id),
          invoiceId,
          invoiceNumber,
          invoiceStatus,
          customer: (job.customerId as any)?.name || 'Unknown',
          particulars: job.items?.map((i: any) => i.name).join(', ') || 'Job',
          completedAt: job.completionDate,
          totalAmount: jobAmount,
          receivedAmount,
          paymentType: paymentTypeLabel,
          _paymentTypeCode: pType,
          paymentStatus,
        };
      }));

      // Apply payment status filter
      let filteredJobs = enrichedJobs;
      if (statusQuery && statusQuery !== '' && statusQuery !== 'all') {
        const statusNum = Number(statusQuery);
        if (!isNaN(statusNum)) {
          filteredJobs = enrichedJobs.filter(j => j.invoiceStatus === statusNum);
        }
      }

      // Calculate balances from filtered jobs only
      let totalCash = 0;
      let totalBank = 0;
      let totalPaid = 0;
      let totalUnpaid = 0;
      let totalAmount = 0;

      for (const j of filteredJobs) {
        totalAmount += j.totalAmount;
        if (j._paymentTypeCode === PAYMENT_TYPE.CASH) {
          totalCash += j.totalAmount;
        } else {
          totalBank += j.totalAmount;
        }
        if (j.invoiceStatus === 3) {
          totalPaid += j.totalAmount;
        } else {
          totalUnpaid += Math.max(0, j.totalAmount - j.receivedAmount);
        }
      }

      // Strip internal fields before returning
      const returnJobs = filteredJobs.map(({ invoiceStatus: _s, _paymentTypeCode: _p, ...rest }) => rest);

      return successResponse(res, {
        balances: {
          cash: totalCash,
          bank: totalBank,
          paid: totalPaid,
          unpaid: totalUnpaid,
          total: totalAmount
        },
        jobs: returnJobs
      }, 'Daily work report generated successfully');

    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to generate work report', { error });
    }
  }
};
