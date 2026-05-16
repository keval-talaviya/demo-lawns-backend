import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { InvoiceService } from '../services/invoice.service';
import { CustomerModel } from '../../customer/model/customer.model';
import { successResponse, errorResponse } from '../../../common/response';
import { INVOICE_MESSAGES } from '../messages/message';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { Types } from 'mongoose';
import { ROLES, INVOICE_STATUS } from '../../../common/constants';
import { InvoicePdfService } from '../services/invoicePdf.service';
import { sendInvoiceEmails } from '../../../services/invoice.mailer';
import { CompanySettingsModel } from '../../companySettings/model/companySettings.model';

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

export const WebInvoiceController = {
  async list(req: AuthRequest, res: Response) {
    try {
      const page = Math.max(1, Number(req.body.page) || 1);
      const limit = Math.max(1, Number(req.body.limit) || 25);
      const filter: any = { isDeleted: false };
      const loggedUser = req.user;

      // Role-based franchise scoping
      if (loggedUser && Number((loggedUser as any).role) === ROLES.FRANCHISE_ADMIN) {
        const userFid = toObjectIdOrNull(loggedUser.id as any);
        if (userFid) filter.franchiseId = userFid;
      } else if (loggedUser && Number((loggedUser as any).role) === ROLES.MASTER_ADMIN) {
        if (req.body.franchiseId && req.body.franchiseId !== '') {
          const qfid = toObjectIdOrNull(req.body.franchiseId as any);
          if (qfid) filter.franchiseId = qfid;
        }
      }

      // General search (invoice number)
      if (req.body.search && req.body.search !== '') {
        const s = String(req.body.search).trim();
        filter.$or = [
          { invoiceNumber: { $regex: s, $options: 'i' } },
        ];
      }

      // Exact / specific invoice number filter (UI: Enter Invoice No)
      if (req.body.invoiceNumber && req.body.invoiceNumber !== '') {
        filter.invoiceNumber = String(req.body.invoiceNumber).trim();
      }

      // Payment type filter (UI: Payment Type)
      if (req.body.paymentType !== undefined && req.body.paymentType !== '') {
        filter.paymentType = Number(req.body.paymentType);
      }

      // Search customer by name / email / phone (UI: Search Customer)
      if (req.body.searchCustomer && req.body.searchCustomer !== '') {
        const s = String(req.body.searchCustomer).trim();
        const customerIds = await CustomerModel.find({
          $or: [
            { name: { $regex: s, $options: 'i' } },
            { email: { $regex: s, $options: 'i' } },
            { phone: { $regex: s, $options: 'i' } },
          ],
        }).select('_id').lean();

        const ids = Array.isArray(customerIds) ? customerIds.map((c: any) => c._id) : [];
        // If no matching customers found, set filter to return no results
        if (ids.length === 0) {
          filter.customerId = { $in: [] };
        } else {
          filter.customerId = { $in: ids };
        }
      }

      if (req.body.status !== undefined && req.body.status !== '') {
        filter.status = Number(req.body.status);
      }
      if (req.body.customerId && req.body.customerId !== '') {
        const cid = toObjectIdOrNull(req.body.customerId as any);
        if (cid) filter.customerId = cid;
      }
      if (req.body.jobId && req.body.jobId !== '') {
        const jid = toObjectIdOrNull(req.body.jobId as any);
        if (jid) filter.jobId = jid;
      }

      // Invoice Date Filter (issuedDate) - Matches full day
      if (req.body.invoiceDate) {
        const d = new Date(String(req.body.invoiceDate));
        if (!isNaN(d.getTime())) {
          const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const start = new Date(dateOnly);
          start.setHours(0, 0, 0, 0);
          const end = new Date(dateOnly);
          end.setHours(23, 59, 59, 999);
          filter.issuedDate = { $gte: start, $lte: end };
        }
      }

      // CreatedAt Date Range
      if (req.body.fromDate || req.body.toDate) {
        filter.createdAt = {};
        if (req.body.fromDate) filter.createdAt.$gte = new Date(String(req.body.fromDate));
        if (req.body.toDate) filter.createdAt.$lte = new Date(String(req.body.toDate));
        if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
      }

      let sort: any = { createdAt: -1 };
      if (req.body.sortBy) {
        const parts = String(req.body.sortBy).split(':');
        sort = { [parts[0]]: parts[1] === 'asc' ? 1 : -1 };
      }

      const result = await InvoiceService.paginate(filter, { page, limit, sort });
      return successResponse(res, result, INVOICE_MESSAGES.LISTED);
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list invoices', { error });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = req.query.id as string;
      if (!Types.ObjectId.isValid(id)) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid invoice id');
      }

      const invoice = await InvoiceService.findById(id);
      if (!invoice) {
        return errorResponse(res, StatusCodes.NOT_FOUND, INVOICE_MESSAGES.NOT_FOUND);
      }

      const loggedUser = req.user;
      const role = loggedUser ? Number((loggedUser as any).role) : null;

      // Master admin can access all invoices
      if (role === ROLES.MASTER_ADMIN) {
        return successResponse(res, invoice, INVOICE_MESSAGES.DETAILS_FETCHED);
      }

      // Franchise admin can only access their own franchise invoices
      if (role === ROLES.FRANCHISE_ADMIN && loggedUser) {
        const userFranchiseId = toObjectIdOrNull(loggedUser.id as any);
        if (!franchiseAccessAllowed((invoice as any).franchiseId as Types.ObjectId | null | undefined, userFranchiseId)) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
        return successResponse(res, invoice, INVOICE_MESSAGES.DETAILS_FETCHED);
      }

      // Other roles cannot access
      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get invoice', { error });
    }
  },

  async markAsPaid(req: AuthRequest, res: Response) {
    try {
      const id = req.query.id as string;
      if (!Types.ObjectId.isValid(id)) return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid invoice id');

      const invoice = await InvoiceService.findById(id);
      if (!invoice) return errorResponse(res, StatusCodes.NOT_FOUND, INVOICE_MESSAGES.NOT_FOUND);

      const loggedUser = req.user;
      if (!loggedUser) return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      const role = Number((loggedUser as any).role);


      // Master admin can access all invoices
      if (role === ROLES.MASTER_ADMIN) {
        const { amount, paymentDate } = req.body;
        const updated = await InvoiceService.markAsPaid(id, amount, paymentDate);
        return successResponse(res, updated, INVOICE_MESSAGES.PAID);
      }

      // Franchise admin can only update their own franchise invoices
      if (role === ROLES.FRANCHISE_ADMIN) {
        if (!franchiseAccessAllowed((invoice as any).franchiseId as Types.ObjectId | null | undefined, toObjectIdOrNull((loggedUser as any).id))) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
        const { amount, paymentDate } = req.body;
        const updated = await InvoiceService.markAsPaid(id, amount, paymentDate);
        return successResponse(res, updated, INVOICE_MESSAGES.PAID);
      }

      // Other roles cannot access
      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.BAD_REQUEST, error.message || 'Failed to mark invoice as paid', { error });
    }
  },

  async cancel(req: AuthRequest, res: Response) {
    try {
      const id = req.query.id as string;
      if (!Types.ObjectId.isValid(id)) return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid invoice id');

      const invoice = await InvoiceService.findById(id);
      if (!invoice) return errorResponse(res, StatusCodes.NOT_FOUND, INVOICE_MESSAGES.NOT_FOUND);

      const loggedUser = req.user;
      if (!loggedUser) return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      const role = Number((loggedUser as any).role);

      // Master admin can access all invoices
      if (role === ROLES.MASTER_ADMIN) {
        const updated = await InvoiceService.cancelInvoice(id);
        return successResponse(res, updated, INVOICE_MESSAGES.CANCELLED);
      }

      // Franchise admin can only update their own franchise invoices
      if (role === ROLES.FRANCHISE_ADMIN) {
        if (!franchiseAccessAllowed((invoice as any).franchiseId as Types.ObjectId | null | undefined, toObjectIdOrNull((loggedUser as any).id))) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
        const updated = await InvoiceService.cancelInvoice(id);
        return successResponse(res, updated, INVOICE_MESSAGES.CANCELLED);
      }

      // Other roles cannot access
      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.BAD_REQUEST, error.message || 'Failed to cancel invoice', { error });
    }
  },

  async downloadPDF(req: AuthRequest, res: Response) {
    try {
      const id = req.query.id as string;
      if (!Types.ObjectId.isValid(id)) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid invoice id');
      }

      const invoice = await InvoiceService.findById(id);
      if (!invoice) {
        return errorResponse(res, StatusCodes.NOT_FOUND, INVOICE_MESSAGES.NOT_FOUND);
      }

      const loggedUser = req.user;
      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }
      const role = Number((loggedUser as any).role);

      // Master admin can access all invoices
      if (role === ROLES.MASTER_ADMIN) {
        const pdfBuffer = await InvoicePdfService.generateInvoicePDF(invoice as any);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length.toString());
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
        return res.send(pdfBuffer);
      }

      // Franchise admin can only access their own franchise invoices
      if (role === ROLES.FRANCHISE_ADMIN) {
        if (!franchiseAccessAllowed((invoice as any).franchiseId as Types.ObjectId | null | undefined, toObjectIdOrNull((loggedUser as any).id))) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
        const pdfBuffer = await InvoicePdfService.generateInvoicePDF(invoice as any);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length.toString());
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
        return res.send(pdfBuffer);
      }

      // Other roles cannot access
      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to generate PDF', { error });
    }
  },

  async update(req: AuthRequest, res: Response) {
    console.log('--- [DEBUG] WebInvoiceController.update: Starting Update Process ---');
    try {
      const id = req.query.id as string;
      if (!Types.ObjectId.isValid(id)) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid invoice id');
      }

      const invoice = await InvoiceService.findById(id);
      if (!invoice) {
        return errorResponse(res, StatusCodes.NOT_FOUND, INVOICE_MESSAGES.NOT_FOUND);
      }

      const loggedUser = req.user;
      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }
      const role = Number((loggedUser as any).role);

      // Only Master Admin can update line items
      if (role !== ROLES.MASTER_ADMIN) {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Only Master Admin can update invoices');
      }

      // Only Unpaid, Partial, and Overdue invoices can be updated
      const editableStatuses = [INVOICE_STATUS.UNPAID, INVOICE_STATUS.PARTIAL, INVOICE_STATUS.OVERDUE];
      if (!editableStatuses.includes(invoice.status as any)) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Only unpaid, partial, or overdue invoices can be updated');
      }

      const updated = await InvoiceService.updateInvoice(id, req.body);
      return successResponse(res, updated, INVOICE_MESSAGES.UPDATED);
    } catch (error: any) {
      return errorResponse(res, StatusCodes.BAD_REQUEST, error.message || 'Failed to update invoice', { error });
    }
  },

  async sendEmail(req: AuthRequest, res: Response) {
    try {
      const id = (req.query.id || req.body.id) as string;
      if (!Types.ObjectId.isValid(id)) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid invoice id');
      }

      // Fetch invoice with populated customer and franchise
      const invoice = await InvoiceService.findById(id);
      if (!invoice) {
        return errorResponse(res, StatusCodes.NOT_FOUND, INVOICE_MESSAGES.NOT_FOUND);
      }

      const loggedUser = req.user;
      if (!loggedUser) return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      const role = Number((loggedUser as any).role);

      // Franchise admin can only send their own franchise invoices
      if (role === ROLES.FRANCHISE_ADMIN) {
        const userFranchiseId = toObjectIdOrNull(loggedUser.id as any);
        if (!franchiseAccessAllowed((invoice as any).franchiseId as Types.ObjectId | null | undefined, userFranchiseId)) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
      }

      // Fetch company settings
      const companySettings = await CompanySettingsModel.findOne().lean();
      const companyName = (companySettings as any)?.companyName || 'Lawn Care';
      const gstRate = (companySettings as any)?.gstRate || 15;
      const gstNumber = (companySettings as any)?.gstNumber || '';

      const customer: any = (invoice as any).customerId ?? {};
      const franchise: any = (invoice as any).franchiseId ?? {};

      if (!customer.email) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Customer does not have an email address');
      }

      // Prepare data for mailer
      const invoiceEmailData = {
        invoiceNumber: (invoice as any).invoiceNumber || `INV-${invoice._id}`,
        customerName: customer.name || 'Valued Customer',
        customerAddress: customer.address,
        issuedDate: (invoice as any).issuedDate || new Date(),
        items: (invoice as any).items || [],
        subtotal: (invoice as any).subtotal || 0,
        tax: (invoice as any).tax || 0,
        totalAmount: (invoice as any).totalAmount || 0,
        paidAmount: (invoice as any).paidAmount || 0,
        paymentStatus: (invoice as any).status === 3 ? 'PAID' : 'UNPAID',
        jobAddress: (invoice as any).jobAddress,
        companyName,
        gstRate,
        gstNumber,
      };

      const franchiseEmailData = {
        invoiceNumber: (invoice as any).invoiceNumber || `INV-${invoice._id}`,
        customerName: customer.name || 'Customer',
        franchiseName: franchise.name || 'Franchise',
        customerEmail: customer.email,
        issuedDate: (invoice as any).issuedDate || new Date(),
        totalAmount: (invoice as any).totalAmount || 0,
        paidAmount: (invoice as any).paidAmount || 0,
        paymentStatus: (invoice as any).status === 3 ? 'PAID' : 'UNPAID',
        jobAddress: (invoice as any).jobAddress,
        companyName,
      };

      // Send emails (background)
      sendInvoiceEmails(invoiceEmailData, franchiseEmailData).catch((error) => {
        console.error('Manual send-email failed:', error);
      });

      return successResponse(res, null, 'Invoice email sent successfully.');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send invoice email', { error });
    }
  },
};
