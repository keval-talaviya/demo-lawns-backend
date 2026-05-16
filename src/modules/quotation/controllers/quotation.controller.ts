import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { QuotationService } from '../services/quotation.service';
import { successResponse, errorResponse } from '../../../common/response';
import { QUOTATION_MESSAGES } from '../messages/message';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { Types } from 'mongoose';
import { ROLES } from '../../../common/constants';
import { logger } from '../../../common/logger';
import { sendQuotationEmails } from '../../../services/quotation.mailer';
import { QuotationPdfService } from '../services/quotationPdf.service';
import { QuotationModel } from '../model/quotation.model';

function toObjectId(id?: string | Types.ObjectId): Types.ObjectId | undefined {
  if (!id) return undefined;
  if (Types.ObjectId.isValid(id as any)) return new Types.ObjectId(id);
  return undefined;
}

function franchiseAccessAllowed(resourceFranchiseId: any, userFranchiseId: any) {
  if (!resourceFranchiseId) return true;
  if (!userFranchiseId) return false;

  const rId = resourceFranchiseId._id || resourceFranchiseId;
  return String(rId) === String(userFranchiseId);
}

export const QuotationController = {
  async create(req: AuthRequest, res: Response) {
    try {
      const loggedUser = req.user;
      let franchiseId: Types.ObjectId | undefined;

      if (loggedUser && Number((loggedUser as any).role) === ROLES.FRANCHISE_ADMIN) {
        franchiseId = toObjectId((loggedUser as any).franchiseId || (loggedUser as any).id);
      } else if (loggedUser && Number((loggedUser as any).role) === ROLES.MASTER_ADMIN) {
        franchiseId = req.body?.franchiseId ? toObjectId(req.body.franchiseId as any) : undefined;
      }

      const payload = { ...req.body, franchiseId };
      const quotation = await QuotationService.createQuotation(payload, franchiseId || null);

      // ✅ (Optional) Log
      logger.debug('Quotation created:', { quotationId: quotation._id });





      // ✅ Response
      res.status(StatusCodes.CREATED);
      return successResponse(res, quotation, QUOTATION_MESSAGES.CREATED);
    } catch (error: any) {
      logger.error('Error creating quotation:', error);
      return errorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        error.message || 'Failed to create quotation',
        { error }
      );
    }
  },

  async list(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const page = Math.max(1, Number(req.body.page) || 1);
      const limit = Math.max(1, Number(req.body.limit) || 25);
      const filter: any = {};
      const loggedUser = req.user;

      if (loggedUser && Number((loggedUser as any).role) === ROLES.FRANCHISE_ADMIN) {
        const userFid = toObjectId(loggedUser.id as any);
        if (userFid) filter.franchiseId = userFid;
      } else if (loggedUser && Number((loggedUser as any).role) === ROLES.MASTER_ADMIN) {
        if (req.body.franchiseId) {
          const qfid = toObjectId(req.body.franchiseId as any);
          if (qfid) filter.franchiseId = qfid;
        }
      }

      if (req.body.customerName) {
        filter.customerName = { $regex: req.body.customerName, $options: 'i' };
      }

      if (req.body.status) {
        filter.status = Number(req.body.status);
      }

      if (req.body.search) {
        const s = String(req.body.search).trim();
        filter.$or = [
          { uniqueCode: { $regex: s, $options: 'i' } },
          { customerAddress: { $regex: s, $options: 'i' } },
          { notes: { $regex: s, $options: 'i' } }
        ];
      }

      if (req.body.fromDate || req.body.toDate) {
        filter.quotationDate = {};
        if (req.body.fromDate) filter.quotationDate.$gte = new Date(String(req.body.fromDate));
        if (req.body.toDate) filter.quotationDate.$lte = new Date(String(req.body.toDate));
        if (Object.keys(filter.quotationDate).length === 0) delete filter.quotationDate;
      }

      let sort: any = { createdAt: -1 };
      if (req.body.sortBy) {
        const parts = String(req.body.sortBy).split(':');
        sort = { [parts[0]]: parts[1] === 'asc' ? 1 : -1 };
      }
      const populate = [
        { path: 'franchiseId', select: 'name code email phone address' },
        { path: 'franchiseId', select: 'name code email phone address' }
      ];

      const result = await QuotationService.paginateQuotations(filter, { page, limit, sort, populate });
      return successResponse(res, result, QUOTATION_MESSAGES.LISTED);
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list quotations', { error });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!Types.ObjectId.isValid(id)) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid quotation id');
      }

      const quotation = await QuotationService.getQuotationById(id);
      if (!quotation) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'Quotation not found');
      }

      const loggedUser = req.user;
      const role = loggedUser ? Number((loggedUser as any).role) : null;

      // Master admin can access all quotations
      if (role === ROLES.MASTER_ADMIN) {
        return successResponse(res, quotation, 'Quotation retrieved successfully');
      }

      // Franchise admin can only access their own franchise quotations
      if (role === ROLES.FRANCHISE_ADMIN && loggedUser) {
        const userFranchiseId = toObjectId(loggedUser.id as any);
        if (!franchiseAccessAllowed(quotation.franchiseId as Types.ObjectId | undefined, userFranchiseId)) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
        return successResponse(res, quotation, 'Quotation retrieved successfully');
      }

      // Other roles cannot access
      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get quotation', { error });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!Types.ObjectId.isValid(id)) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid quotation id');
      }

      const quotation = await QuotationService.findById(id);
      if (!quotation) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'Quotation not found');
      }

      const loggedUser = req.user;
      const role = loggedUser ? Number((loggedUser as any).role) : null;

      // Master admin can access all quotations
      if (role === ROLES.MASTER_ADMIN) {
        const updated = await QuotationService.updateQuotation(id, req.body);
        return successResponse(res, updated, QUOTATION_MESSAGES.UPDATED);
      }

      // Franchise admin can only update their own franchise quotations
      if (role === ROLES.FRANCHISE_ADMIN && loggedUser) {
        const userFranchiseId = toObjectId(loggedUser.id as any);
        if (!franchiseAccessAllowed(quotation.franchiseId as Types.ObjectId | undefined, userFranchiseId)) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
        const updatePayload = { ...req.body };
        delete updatePayload.franchiseId;
        const updated = await QuotationService.updateQuotation(id, updatePayload);
        return successResponse(res, updated, QUOTATION_MESSAGES.UPDATED);
      }

      // Other roles cannot access
      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.BAD_REQUEST, error.message || 'Failed to update quotation', { error });
    }
  },

  async remove(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!Types.ObjectId.isValid(id)) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid quotation id');
      }

      const quotation = await QuotationService.findById(id);
      if (!quotation) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'Quotation not found');
      }

      const loggedUser = req.user;
      const role = loggedUser ? Number((loggedUser as any).role) : null;

      // Master admin can access all quotations
      if (role === ROLES.MASTER_ADMIN) {
        await QuotationService.deleteById(id);
        return res.status(StatusCodes.NO_CONTENT).send();
      }

      // Franchise admin can only delete their own franchise quotations
      if (role === ROLES.FRANCHISE_ADMIN && loggedUser) {
        const userFranchiseId = toObjectId(loggedUser.id as any);
        if (!franchiseAccessAllowed(quotation.franchiseId as Types.ObjectId | undefined, userFranchiseId)) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
        await QuotationService.deleteById(id);
        return res.status(StatusCodes.NO_CONTENT).send();
      }

      // Other roles cannot access
      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete quotation', { error });
    }
  },
  async send(req: AuthRequest, res: Response) {
    try {
      const id = req.query.id as string;
      console.log("id", id);

      if (!id) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid quotation id');
      }

      const quotation = await QuotationService.findById(id);
      if (!quotation) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'Quotation not found');
      }


      const loggedUser = req.user;
      const role = loggedUser ? Number((loggedUser as any).role) : null;

      // Master admin can access all quotations
      if (role === ROLES.MASTER_ADMIN) {
        await sendQuotationEmails(quotation);
        return successResponse(res, null, 'Quotation sent successfully');
      }

      // Franchise admin can only access their own franchise quotations
      if (role === ROLES.FRANCHISE_ADMIN && loggedUser) {
        const userFranchiseId = toObjectId(loggedUser.id as any);
        if (!franchiseAccessAllowed(quotation.franchiseId as Types.ObjectId | undefined, userFranchiseId)) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
        await sendQuotationEmails(quotation);
        return successResponse(res, null, 'Quotation sent successfully');
      }

      // Other roles cannot access
      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send quotation', { error });
    }
  },

  async downloadPDF(req: AuthRequest, res: Response) {
    try {
      const id = req.query.id;
      if (!id || typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid quotation id');
      }

      const quotation = await QuotationModel.findById(id).lean();
      if (!quotation) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'Quotation not found');
      }

      const loggedUser = req.user;
      const role = loggedUser ? Number((loggedUser as any).role) : null;

      // Master admin can access all quotations
      if (role === ROLES.MASTER_ADMIN) {
        const pdfBuffer = await QuotationPdfService.generateQuotationPDF(quotation as any);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length.toString());
        res.setHeader('Content-Disposition', `attachment; filename="quotation-${quotation.uniqueCode || id}.pdf"`);
        return res.send(pdfBuffer);
      }

      // Franchise admin can only access their own franchise quotations
      if (role === ROLES.FRANCHISE_ADMIN && loggedUser) {
        const userFranchiseId = toObjectId(loggedUser.id as any);
        if (!franchiseAccessAllowed(quotation.franchiseId as Types.ObjectId | undefined, userFranchiseId)) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
        const pdfBuffer = await QuotationPdfService.generateQuotationPDF(quotation as any);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length.toString());
        res.setHeader('Content-Disposition', `attachment; filename="quotation-${quotation.uniqueCode || id}.pdf"`);
        return res.send(pdfBuffer);
      }

      // Other roles cannot access
      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      logger.error('Failed to download quotation PDF', { error });
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to download PDF', { error });
    }
  },
};
