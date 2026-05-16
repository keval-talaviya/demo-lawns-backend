import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { CustomerService } from '../services/customer.service';
import { InvoiceService } from '../../invoice/services/invoice.service';
import { successResponse, errorResponse } from '../../../common/response';
import { CUSTOMER_MESSAGES } from '../messages/message';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { Types } from 'mongoose';
import { ROLES } from '../../../common/constants';

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

export const CustomerController = {
  async create(req: AuthRequest, res: Response) {
    try {
      const loggedUser = req.user;
      let franchiseId: Types.ObjectId | null = null;

      if (loggedUser && Number((loggedUser as any).role) === ROLES.FRANCHISE_ADMIN) {
        franchiseId = toObjectIdOrNull(loggedUser.id as any);
      } else if (loggedUser && Number((loggedUser as any).role) === ROLES.MASTER_ADMIN) {
        franchiseId = req.body?.franchiseId ? toObjectIdOrNull(req.body.franchiseId as any) : null;
      }

      const emailRaw = (req.body.email ?? '').toString().trim();
      const phoneRaw = (req.body.phone ?? '').toString().trim();
      const email = emailRaw ? emailRaw.toLowerCase() : '';
      const phone = phoneRaw || '';

      const duplicateQuery: any = { $or: [] as any[] };
      if (email) duplicateQuery.$or.push({ email });
      if (phone) duplicateQuery.$or.push({ phone });

      if (duplicateQuery.$or.length > 0) {
        if (franchiseId) {
          duplicateQuery.franchiseId = franchiseId;
        }
        const existing = await CustomerService.findOne(duplicateQuery);

        if (existing) {
          if (email && existing.email && existing.email.toLowerCase() === email) {
            return errorResponse(res, StatusCodes.CONFLICT, 'A customer with this email already exists.');
          }
          if (phone && existing.phone && existing.phone === phone) {
            return errorResponse(res, StatusCodes.CONFLICT, 'A customer with this phone number already exists.');
          }
          return errorResponse(res, StatusCodes.CONFLICT, 'A customer with the same contact already exists.');
        }
      }

      const payload = {
        ...req.body,
        franchiseId,
        email: email || undefined,
        phone: phone || undefined,
      };
      delete payload.balance; // Balance should not be manually set

      const customer = await CustomerService.createCustomer(payload, franchiseId);
      res.status(StatusCodes.CREATED);
      return successResponse(res, customer, CUSTOMER_MESSAGES.CREATED);
    } catch (error: any) {
      return errorResponse(res, StatusCodes.BAD_REQUEST, error.message || 'Failed to create customer', { error });
    }
  }
  ,

  async list(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const page = Math.max(1, Number(req.body.page) || 1);
      const limit = Math.max(1, Number(req.body.limit) || 25);
      const filter: any = {};
      const loggedUser = req.user;

      if (loggedUser && Number((loggedUser as any).role) === ROLES.FRANCHISE_ADMIN) {
        const userFid = toObjectIdOrNull(loggedUser.id as any);
        if (userFid) filter.franchiseId = userFid;
      } else if (loggedUser && Number((loggedUser as any).role) === ROLES.MASTER_ADMIN) {
        if (req.body.franchiseId) {
          const qfid = toObjectIdOrNull(req.body.franchiseId as any);
          if (qfid) filter.franchiseId = qfid;
        }
      }

      if (req.body.search) {
        const s = String(req.body.search).trim();
        filter.$or = [
          { name: { $regex: s, $options: 'i' } },
          { companyName: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
          { phone: { $regex: s, $options: 'i' } },
          { address: { $regex: s, $options: 'i' } },
        ];
      }

      if (req.body.name) {
        filter.name = { $regex: String(req.body.name), $options: 'i' };
      }
      if (req.body.email) {
        filter.email = String(req.body.email);
      }
      if (req.body.phone) {
        filter.phone = String(req.body.phone);
      }
      if (req.body.isActive !== undefined) {
        filter.isActive = Boolean(req.body.isActive);
      }

      if (req.body.minBalance !== undefined || req.body.maxBalance !== undefined) {
        filter.balance = {};
        if (req.body.minBalance !== undefined) filter.balance.$gte = Number(req.body.minBalance);
        if (req.body.maxBalance !== undefined) filter.balance.$lte = Number(req.body.maxBalance);
        if (Object.keys(filter.balance).length === 0) delete filter.balance;
      }

      if (req.body.fromDate || req.body.toDate) {
        filter.createdAt = {};
        if (req.body.fromDate) filter.createdAt.$gte = new Date(String(req.body.fromDate));
        if (req.body.toDate) filter.createdAt.$lte = new Date(String(req.body.toDate));
        if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
      }

      let sort: any = { createdAt: -1 };

      if (req.body.sortBy) {
        const parts = String(req.body.sortBy).split(':');
        const field = parts[0];
        const order = parts[1] === 'asc' ? 1 : -1;
        sort = { [field]: order };
      }

      if (req.body.sortByBalance) {
        const balanceSort = req.body.sortByBalance === 'asc' ? 1 : -1;
        sort = { balance: balanceSort };
      }

      const result = await CustomerService.paginate(filter, { page, limit, sort });
      return successResponse(res, result, CUSTOMER_MESSAGES.LISTED);
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list customers', { error });
    }
  }
  ,

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!Types.ObjectId.isValid(id)) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid customer id');
      }

      const customer = await CustomerService.findById(id);
      if (!customer) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'Customer not found');
      }

      const loggedUser = req.user;
      const role = loggedUser ? Number((loggedUser as any).role) : null;

      const enrichCustomerWithTransactions = async (customerDoc: any) => {
        try {
          const { TransactionService } = await import('../../transaction/services/transaction.service');
          const { TRANSACTION_TYPE } = await import('../../../common/constants');

          // Fetch all transactions for this customer
          const transactions = await TransactionService.find({
            customerId: customerDoc._id,
            isDeleted: false,
          }, undefined, { sort: { date: -1 } });

          const enrichedTransactions = transactions.map((tx: any) => {
            return {
              id: tx._id?.toString?.() ?? null,
              jobId: tx.jobId?.toString?.() ?? null, // Transaction might not have jobId directly if not from job
              invoiceId: tx.invoiceId?.toString?.() ?? null,
              purpose: tx.remarks || 'Transaction',
              transactionType: tx.type === TRANSACTION_TYPE.DEPOSIT ? 'DEPOSIT' : 'WITHDRAW',
              amount: tx.amount ?? 0,
              createdAt: tx.date ? new Date(tx.date).toISOString() : (tx.createdAt ? new Date(tx.createdAt).toISOString() : null),
            };
          });

          return {
            ...customerDoc,
            transactionHistory: enrichedTransactions || [],
          };
        } catch (error: any) {
          console.error('Error fetching transaction history:', error);
          return {
            ...customerDoc,
            transactionHistory: [],
          };
        }
      };

      // Master admin can access all customers
      if (role === ROLES.MASTER_ADMIN) {
        const enrichedCustomer = await enrichCustomerWithTransactions(customer);
        return successResponse(res, enrichedCustomer, 'Customer retrieved successfully');
      }

      // Franchise admin can only access their own franchise customers
      if (role === ROLES.FRANCHISE_ADMIN && loggedUser) {
        const userFranchiseId = toObjectIdOrNull(loggedUser.id as any);
        if (!franchiseAccessAllowed(customer.franchiseId as Types.ObjectId | null | undefined, userFranchiseId)) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
        const enrichedCustomer = await enrichCustomerWithTransactions(customer);
        return successResponse(res, enrichedCustomer, 'Customer retrieved successfully');
      }

      // Other roles cannot access
      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get customer', { error });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!Types.ObjectId.isValid(id)) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid customer id');
      }

      const customer = await CustomerService.findById(id);
      if (!customer) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'Customer not found');
      }

      const loggedUser = req.user;
      const role = loggedUser ? Number((loggedUser as any).role) : null;

      // Master admin can access all customers
      if (role === ROLES.MASTER_ADMIN) {
        const updatePayload = { ...req.body };
        delete updatePayload.balance; // Balance should not be manually modified
        const updated = await CustomerService.updateCustomer(id, updatePayload);
        return successResponse(res, updated, CUSTOMER_MESSAGES.UPDATED);
      }

      // Franchise admin can only update their own franchise customers
      if (role === ROLES.FRANCHISE_ADMIN && loggedUser) {
        const userFranchiseId = toObjectIdOrNull(loggedUser.id as any);
        if (!franchiseAccessAllowed(customer.franchiseId as Types.ObjectId | null | undefined, userFranchiseId)) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
        const updatePayload = { ...req.body };
        delete updatePayload.franchiseId; // Franchise admin cannot change franchise
        delete updatePayload.balance; // Balance should not be manually modified
        const updated = await CustomerService.updateCustomer(id, updatePayload);
        return successResponse(res, updated, CUSTOMER_MESSAGES.UPDATED);
      }

      // Other roles cannot access
      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.BAD_REQUEST, error.message || 'Failed to update customer', { error });
    }
  },

  async remove(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!Types.ObjectId.isValid(id)) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid customer id');
      }

      const customer = await CustomerService.findById(id);
      if (!customer) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'Customer not found');
      }

      const loggedUser = req.user;
      const role = loggedUser ? Number((loggedUser as any).role) : null;

      // Master admin can delete all customers
      if (role === ROLES.MASTER_ADMIN) {
        await CustomerService.deleteById(id);
        return res.status(StatusCodes.NO_CONTENT).send();
      }

      // Franchise admin can only delete their own franchise customers
      if (role === ROLES.FRANCHISE_ADMIN && loggedUser) {
        const userFranchiseId = toObjectIdOrNull(loggedUser.id as any);
        if (!franchiseAccessAllowed(customer.franchiseId as Types.ObjectId | null | undefined, userFranchiseId)) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
        await CustomerService.deleteById(id);
        return res.status(StatusCodes.NO_CONTENT).send();
      }

      // Other roles cannot access
      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete customer', { error });
    }
  },

  async listAll(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const loggedUser = req.user;

      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const role = Number((loggedUser as any).role);
      const filter: any = {};

      // ---------------------------------------------------------
      // 1) Franchise Admin → can only see their own franchise
      // ---------------------------------------------------------
      if (role === ROLES.FRANCHISE_ADMIN) {
        const userFid = toObjectIdOrNull(loggedUser.id);
        if (!userFid) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Franchise ID not found for this user');
        }
        filter.franchiseId = userFid;
      }

      // ---------------------------------------------------------
      // 2) Master Admin → MUST pass ?franchiseId= in query
      // ---------------------------------------------------------
      else if (role === ROLES.MASTER_ADMIN) {
        if (!req.query.franchiseId) {
          return errorResponse(
            res,
            StatusCodes.BAD_REQUEST,
            'franchiseId is required for master admin'
          );
        }

        const qfid = toObjectIdOrNull(String(req.query.franchiseId));
        if (!qfid) {
          return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid franchiseId');
        }

        filter.franchiseId = qfid;
      }

      // ---------------------------------------------------------
      // 3) Default sort (optional)
      // ---------------------------------------------------------
      const sort = { createdAt: -1 };

      const customers = await CustomerService.find(filter, undefined, { sort });

      return successResponse(res, customers, CUSTOMER_MESSAGES.LISTED);

    } catch (error: any) {
      return errorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to list customers',
        { error }
      );
    }
  },

  async getWallet(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const loggedUser = req.user;
      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const customerId = req.query.id as string;
      if (!Types.ObjectId.isValid(customerId)) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid customer id');
      }

      const customer = await CustomerService.findOne(
        { _id: customerId },
        undefined,
        { populate: { path: 'franchiseId', select: 'name' } }
      );
      if (!customer) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'Customer not found');
      }

      const role = Number((loggedUser as any).role);
      const loggedUserIdStr = String((loggedUser._id as any) ?? '');
      const customerFranchiseId = customer.franchiseId ? String((customer.franchiseId as any)) : null;

      if (role === ROLES.MASTER_ADMIN) {
      } else if (role === ROLES.FRANCHISE_ADMIN) {
        // Franchise admin can only access their own franchise customers
        if (customerFranchiseId !== loggedUserIdStr) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
      } else {
        // Other roles cannot access customer wallets
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
      }

      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.max(1, Number(req.query.limit) || 25);

      const { TransactionService } = await import('../../transaction/services/transaction.service');
      const { TRANSACTION_TYPE } = await import('../../../common/constants');

      // Build filter for transactions
      const filter: any = {
        customerId: new Types.ObjectId(customerId),
        isDeleted: false
      };

      // Additional filters from query params
      if (req.query.transactionType !== undefined) {
        filter.type = Number(req.query.transactionType);
      }
      if (req.query.fromDate || req.query.toDate) {
        filter.date = {};
        if (req.query.fromDate) filter.date.$gte = new Date(String(req.query.fromDate));
        if (req.query.toDate) filter.date.$lte = new Date(String(req.query.toDate));
        if (Object.keys(filter.date).length === 0) delete filter.date;
      }

      let sort: any = { date: -1 };
      // Get transactions with pagination
      const result = await TransactionService.paginate(filter, {
        page,
        limit,
        sort,
        populate: { path: 'invoiceId', select: 'invoiceNumber' }
      });
      const transactions = result.data || [];
      const total = result.total || 0;

      // Enrich transactions
      const enrichedTransactions = transactions.map((tx: any) => {
        const transactionType = tx.type === TRANSACTION_TYPE.DEPOSIT ? 'DEPOSIT' : 'WITHDRAW';

        return {
          id: tx.id,
          jobId: null,
          invoiceId: tx.invoiceId,
          invoiceNumber: tx.invoiceNumber,
          purpose: tx.purpose,
          transactionType: transactionType,
          amount: tx.rawAmount,
          createdAt: tx.createdAt,
        };
      });

      // Get customer balance
      const currentBalance = (customer as any)?.balance || 0;

      // Extract franchise name from populated franchiseId
      const franchiseName = (customer as any)?.franchiseId?.name || null;

      return successResponse(res, {
        transactions: enrichedTransactions,
        pagination: {
          total,
          page,
          limit,
        },
        currentBalance: currentBalance,
        customer: {
          id: customer._id?.toString() ?? null,
          name: customer.name ?? null,
          email: customer.email ?? null,
          phone: customer.phone ?? null,
          address: customer.address ?? null,
          franchiseName: franchiseName,
        },
      }, 'Customer wallet retrieved successfully');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get customer wallet', { error });
    }
  },

  async getInvoices(req: AuthRequest, res: Response) {
    try {
      const customerId = req.query.id as string;

      if (!Types.ObjectId.isValid(customerId)) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid customer id');
      }

      const customer = await CustomerService.findById(customerId);
      if (!customer) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'Customer not found');
      }

      const loggedUser = req.user;
      const userFranchiseId = loggedUser && Number((loggedUser as any).role) === ROLES.FRANCHISE_ADMIN
        ? toObjectIdOrNull(loggedUser.id as any)
        : (loggedUser && Number((loggedUser as any).role) === ROLES.MASTER_ADMIN
          ? (req.query.franchiseId ? toObjectIdOrNull(req.query.franchiseId as string) : null)
          : null);

      // Master admin can access all customers' invoices
      if (loggedUser && Number((loggedUser as any).role) !== ROLES.MASTER_ADMIN) {
        if (!franchiseAccessAllowed(customer.franchiseId as Types.ObjectId | null | undefined, userFranchiseId)) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
      }

      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.max(1, Number(req.query.limit) || 25);
      const filter: any = { customerId: new Types.ObjectId(customerId), isDeleted: false };

      // Additional filters from query params
      if (req.query.status !== undefined) {
        filter.status = Number(req.query.status);
      }
      if (req.query.fromDate || req.query.toDate) {
        filter.createdAt = {};
        if (req.query.fromDate) filter.createdAt.$gte = new Date(String(req.query.fromDate));
        if (req.query.toDate) filter.createdAt.$lte = new Date(String(req.query.toDate));
        if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
      }

      let sort: any = { createdAt: -1 };
      if (req.query.sortBy) {
        const parts = String(req.query.sortBy).split(':');
        sort = { [parts[0]]: parts[1] === 'asc' ? 1 : -1 };
      }

      const result = await InvoiceService.paginate(filter, { page, limit, sort });
      return successResponse(res, result, 'Customer invoices retrieved successfully');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get customer invoices', { error });
    }
  },

  async createTransaction(req: AuthRequest, res: Response) {
    try {
      const customerId = req?.query?.id as string;
      console.log("customerId", customerId);
      if (!Types.ObjectId.isValid(customerId)) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid customer id');
      }

      const customer = await CustomerService.findById(customerId);
      console.log("customer", customer);
      if (!customer) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'Customer not found');
      }

      const loggedUser = req.user;
      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const role = Number((loggedUser as any).role);
      const userFranchiseId = role === ROLES.FRANCHISE_ADMIN ? toObjectIdOrNull(loggedUser.id as any) : null;

      // Check permissions
      if (role === ROLES.MASTER_ADMIN) {
        // Master admin can add transaction to any customer
      } else if (role === ROLES.FRANCHISE_ADMIN) {
        if (!franchiseAccessAllowed(customer.franchiseId as Types.ObjectId | null | undefined, userFranchiseId)) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
      } else {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
      }

      const { amount, type, purpose, date } = req.body;
      const { TransactionService } = await import('../../transaction/services/transaction.service');
      const { InvoiceService } = await import('../../invoice/services/invoice.service');
      const { PAYMENT_TYPE, TRANSACTION_TYPE } = await import('../../../common/constants');

      let result;

      // Type 1: WITHDRAW (Charge/Debt Increase) -> Create Invoice
      if (Number(type) === TRANSACTION_TYPE.WITHDRAW) {
        // Create Invoice which will automatically create the transaction
        const invoicePayload: any = {
          franchiseId: customer.franchiseId,
          customerId: new Types.ObjectId(customerId),
          invoiceNumber: '', // Auto-generated
          items: [{
            name: 'Manual Charge',
            description: purpose,
            quantity: 1,
            unitPrice: Number(amount),
            price: Number(amount)
          }],
          subtotal: Number(amount),
          totalAmount: Number(amount),
          paidAmount: 0,
          dueAmount: Number(amount),
          status: 1, // UNPAID
          paymentType: PAYMENT_TYPE.CASH, // Default
          issuedDate: new Date(date),
          createdBy: new Types.ObjectId(loggedUser.id as string),
          transactionRemarks: purpose
        };

        result = await InvoiceService.createInvoice(invoicePayload);
      }
      // Type 2: DEPOSIT (Payment) -> Create Transaction
      else {
        // Create transaction directly
        result = await TransactionService.createTransaction({
          franchiseId: customer.franchiseId,
          customerId: new Types.ObjectId(customerId),
          type: Number(type), // 2: Deposit
          amount: Number(amount),
          paymentType: PAYMENT_TYPE.CASH,
          remarks: purpose,
          date: new Date(date),
          createdBy: new Types.ObjectId(loggedUser.id as string)
        });
      }

      return successResponse(res, result, 'Transaction created successfully');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create transaction', { error });
    }
  },
  async sendStatement(req: AuthRequest, res: Response) {
    try {
      const loggedUser = req.user;
      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const { customerId, fromDate, toDate } = req.body;

      if (!customerId || !Types.ObjectId.isValid(customerId)) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid customer id');
      }

      const from = new Date(fromDate);
      const to = new Date(toDate);

      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid date range');
      }

      // Ensure end of day for 'to' date
      to.setUTCHours(23, 59, 59, 999);

      const customer = await CustomerService.findById(customerId);
      if (!customer) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'Customer not found');
      }

      const role = Number((loggedUser as any).role);
      const userFranchiseId = role === ROLES.FRANCHISE_ADMIN ? toObjectIdOrNull(loggedUser.id as any) : null;

      // Check permissions
      if (role === ROLES.FRANCHISE_ADMIN) {
        if (!franchiseAccessAllowed(customer.franchiseId as Types.ObjectId | null | undefined, userFranchiseId)) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
      } else if (role !== ROLES.MASTER_ADMIN) {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
      }

      const { TransactionService } = await import('../../transaction/services/transaction.service');
      const { TransactionModel } = await import('../../transaction/models/transaction.model');
      const { TRANSACTION_TYPE } = await import('../../../common/constants');
      const { sendStatementEmail } = await import('../../../services/statement.mailer');

      // 1. Calculate Opening Balance
      // Sum all transactions BEFORE the fromDate
      const preTransactions = await TransactionService.find({
        customerId: customer._id,
        isDeleted: false,
        date: { $lt: from }
      });

      let openingBalance = 0;
      preTransactions.forEach((txn: any) => {
        const amount = Math.abs(txn.amount || 0);
        if (txn.type === TRANSACTION_TYPE.WITHDRAW) {
          openingBalance -= amount; // Customer charged (owes money)
        } else {
          openingBalance += amount; // Customer paid (reduces debt)
        }
      });

      // 2. Fetch Period Transactions with populated references
      const transactions = await TransactionModel
        .find({
          customerId: customer._id,
          isDeleted: false,
          date: { $gte: from, $lte: to }
        })
        .sort({ date: 1 })
        .populate({
          path: 'invoiceId',
          select: 'invoiceNumber jobId',
          populate: {
            path: 'jobId',
            select: 'uniqueId'
          }
        })
        .lean()
        .exec();

      // 3. Calculate Closing Balance
      let closingBalance = openingBalance;
      transactions.forEach((txn: any) => {
        const amount = Math.abs(txn.amount || 0);
        if (txn.type === TRANSACTION_TYPE.WITHDRAW) {
          closingBalance -= amount; // Customer charged (owes money)
        } else {
          closingBalance += amount; // Customer paid (reduces debt)
        }
      });

      // 4. Send Email
      await sendStatementEmail(
        customer,
        transactions,
        openingBalance,
        closingBalance,
        from,
        to
      );

      return successResponse(res, null, 'Statement sent successfully');

    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send statement', { error });
    }
  },
};

