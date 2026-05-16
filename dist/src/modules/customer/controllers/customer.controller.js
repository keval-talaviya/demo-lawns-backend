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
exports.CustomerController = void 0;
const http_status_codes_1 = require("http-status-codes");
const customer_service_1 = require("../services/customer.service");
const invoice_service_1 = require("../../invoice/services/invoice.service");
const response_1 = require("../../../common/response");
const message_1 = require("../messages/message");
const mongoose_1 = require("mongoose");
const constants_1 = require("../../../common/constants");
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
exports.CustomerController = {
    async create(req, res) {
        try {
            const loggedUser = req.user;
            let franchiseId = null;
            if (loggedUser && Number(loggedUser.role) === constants_1.ROLES.FRANCHISE_ADMIN) {
                franchiseId = toObjectIdOrNull(loggedUser.id);
            }
            else if (loggedUser && Number(loggedUser.role) === constants_1.ROLES.MASTER_ADMIN) {
                franchiseId = req.body?.franchiseId ? toObjectIdOrNull(req.body.franchiseId) : null;
            }
            const emailRaw = (req.body.email ?? '').toString().trim();
            const phoneRaw = (req.body.phone ?? '').toString().trim();
            const email = emailRaw ? emailRaw.toLowerCase() : '';
            const phone = phoneRaw || '';
            const duplicateQuery = { $or: [] };
            if (email)
                duplicateQuery.$or.push({ email });
            if (phone)
                duplicateQuery.$or.push({ phone });
            if (duplicateQuery.$or.length > 0) {
                if (franchiseId) {
                    duplicateQuery.franchiseId = franchiseId;
                }
                const existing = await customer_service_1.CustomerService.findOne(duplicateQuery);
                if (existing) {
                    if (email && existing.email && existing.email.toLowerCase() === email) {
                        return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.CONFLICT, 'A customer with this email already exists.');
                    }
                    if (phone && existing.phone && existing.phone === phone) {
                        return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.CONFLICT, 'A customer with this phone number already exists.');
                    }
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.CONFLICT, 'A customer with the same contact already exists.');
                }
            }
            const payload = {
                ...req.body,
                franchiseId,
                email: email || undefined,
                phone: phone || undefined,
            };
            delete payload.balance; // Balance should not be manually set
            const customer = await customer_service_1.CustomerService.createCustomer(payload, franchiseId);
            res.status(http_status_codes_1.StatusCodes.CREATED);
            return (0, response_1.successResponse)(res, customer, message_1.CUSTOMER_MESSAGES.CREATED);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to create customer', { error });
        }
    },
    async list(req, res) {
        try {
            const page = Math.max(1, Number(req.body.page) || 1);
            const limit = Math.max(1, Number(req.body.limit) || 25);
            const filter = {};
            const loggedUser = req.user;
            if (loggedUser && Number(loggedUser.role) === constants_1.ROLES.FRANCHISE_ADMIN) {
                const userFid = toObjectIdOrNull(loggedUser.id);
                if (userFid)
                    filter.franchiseId = userFid;
            }
            else if (loggedUser && Number(loggedUser.role) === constants_1.ROLES.MASTER_ADMIN) {
                if (req.body.franchiseId) {
                    const qfid = toObjectIdOrNull(req.body.franchiseId);
                    if (qfid)
                        filter.franchiseId = qfid;
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
                if (req.body.minBalance !== undefined)
                    filter.balance.$gte = Number(req.body.minBalance);
                if (req.body.maxBalance !== undefined)
                    filter.balance.$lte = Number(req.body.maxBalance);
                if (Object.keys(filter.balance).length === 0)
                    delete filter.balance;
            }
            if (req.body.fromDate || req.body.toDate) {
                filter.createdAt = {};
                if (req.body.fromDate)
                    filter.createdAt.$gte = new Date(String(req.body.fromDate));
                if (req.body.toDate)
                    filter.createdAt.$lte = new Date(String(req.body.toDate));
                if (Object.keys(filter.createdAt).length === 0)
                    delete filter.createdAt;
            }
            let sort = { createdAt: -1 };
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
            const result = await customer_service_1.CustomerService.paginate(filter, { page, limit, sort });
            return (0, response_1.successResponse)(res, result, message_1.CUSTOMER_MESSAGES.LISTED);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list customers', { error });
        }
    },
    async getById(req, res) {
        try {
            const id = req.params.id;
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid customer id');
            }
            const customer = await customer_service_1.CustomerService.findById(id);
            if (!customer) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'Customer not found');
            }
            const loggedUser = req.user;
            const role = loggedUser ? Number(loggedUser.role) : null;
            const enrichCustomerWithTransactions = async (customerDoc) => {
                try {
                    const { TransactionService } = await Promise.resolve().then(() => __importStar(require('../../transaction/services/transaction.service')));
                    const { TRANSACTION_TYPE } = await Promise.resolve().then(() => __importStar(require('../../../common/constants')));
                    // Fetch all transactions for this customer
                    const transactions = await TransactionService.find({
                        customerId: customerDoc._id,
                        isDeleted: false,
                    }, undefined, { sort: { date: -1 } });
                    const enrichedTransactions = transactions.map((tx) => {
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
                }
                catch (error) {
                    console.error('Error fetching transaction history:', error);
                    return {
                        ...customerDoc,
                        transactionHistory: [],
                    };
                }
            };
            // Master admin can access all customers
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                const enrichedCustomer = await enrichCustomerWithTransactions(customer);
                return (0, response_1.successResponse)(res, enrichedCustomer, 'Customer retrieved successfully');
            }
            // Franchise admin can only access their own franchise customers
            if (role === constants_1.ROLES.FRANCHISE_ADMIN && loggedUser) {
                const userFranchiseId = toObjectIdOrNull(loggedUser.id);
                if (!franchiseAccessAllowed(customer.franchiseId, userFranchiseId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                const enrichedCustomer = await enrichCustomerWithTransactions(customer);
                return (0, response_1.successResponse)(res, enrichedCustomer, 'Customer retrieved successfully');
            }
            // Other roles cannot access
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get customer', { error });
        }
    },
    async update(req, res) {
        try {
            const id = req.params.id;
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid customer id');
            }
            const customer = await customer_service_1.CustomerService.findById(id);
            if (!customer) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'Customer not found');
            }
            const loggedUser = req.user;
            const role = loggedUser ? Number(loggedUser.role) : null;
            // Master admin can access all customers
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                const updatePayload = { ...req.body };
                delete updatePayload.balance; // Balance should not be manually modified
                const updated = await customer_service_1.CustomerService.updateCustomer(id, updatePayload);
                return (0, response_1.successResponse)(res, updated, message_1.CUSTOMER_MESSAGES.UPDATED);
            }
            // Franchise admin can only update their own franchise customers
            if (role === constants_1.ROLES.FRANCHISE_ADMIN && loggedUser) {
                const userFranchiseId = toObjectIdOrNull(loggedUser.id);
                if (!franchiseAccessAllowed(customer.franchiseId, userFranchiseId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                const updatePayload = { ...req.body };
                delete updatePayload.franchiseId; // Franchise admin cannot change franchise
                delete updatePayload.balance; // Balance should not be manually modified
                const updated = await customer_service_1.CustomerService.updateCustomer(id, updatePayload);
                return (0, response_1.successResponse)(res, updated, message_1.CUSTOMER_MESSAGES.UPDATED);
            }
            // Other roles cannot access
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to update customer', { error });
        }
    },
    async remove(req, res) {
        try {
            const id = req.params.id;
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid customer id');
            }
            const customer = await customer_service_1.CustomerService.findById(id);
            if (!customer) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'Customer not found');
            }
            const loggedUser = req.user;
            const role = loggedUser ? Number(loggedUser.role) : null;
            // Master admin can delete all customers
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                await customer_service_1.CustomerService.deleteById(id);
                return res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
            }
            // Franchise admin can only delete their own franchise customers
            if (role === constants_1.ROLES.FRANCHISE_ADMIN && loggedUser) {
                const userFranchiseId = toObjectIdOrNull(loggedUser.id);
                if (!franchiseAccessAllowed(customer.franchiseId, userFranchiseId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
                await customer_service_1.CustomerService.deleteById(id);
                return res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
            }
            // Other roles cannot access
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete customer', { error });
        }
    },
    async listAll(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            const filter = {};
            // ---------------------------------------------------------
            // 1) Franchise Admin → can only see their own franchise
            // ---------------------------------------------------------
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                const userFid = toObjectIdOrNull(loggedUser.id);
                if (!userFid) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Franchise ID not found for this user');
                }
                filter.franchiseId = userFid;
            }
            // ---------------------------------------------------------
            // 2) Master Admin → MUST pass ?franchiseId= in query
            // ---------------------------------------------------------
            else if (role === constants_1.ROLES.MASTER_ADMIN) {
                if (!req.query.franchiseId) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'franchiseId is required for master admin');
                }
                const qfid = toObjectIdOrNull(String(req.query.franchiseId));
                if (!qfid) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid franchiseId');
                }
                filter.franchiseId = qfid;
            }
            // ---------------------------------------------------------
            // 3) Default sort (optional)
            // ---------------------------------------------------------
            const sort = { createdAt: -1 };
            const customers = await customer_service_1.CustomerService.find(filter, undefined, { sort });
            return (0, response_1.successResponse)(res, customers, message_1.CUSTOMER_MESSAGES.LISTED);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list customers', { error });
        }
    },
    async getWallet(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const customerId = req.query.id;
            if (!mongoose_1.Types.ObjectId.isValid(customerId)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid customer id');
            }
            const customer = await customer_service_1.CustomerService.findOne({ _id: customerId }, undefined, { populate: { path: 'franchiseId', select: 'name' } });
            if (!customer) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'Customer not found');
            }
            const role = Number(loggedUser.role);
            const loggedUserIdStr = String(loggedUser._id ?? '');
            const customerFranchiseId = customer.franchiseId ? String(customer.franchiseId) : null;
            if (role === constants_1.ROLES.MASTER_ADMIN) {
            }
            else if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                // Franchise admin can only access their own franchise customers
                if (customerFranchiseId !== loggedUserIdStr) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
            }
            else {
                // Other roles cannot access customer wallets
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
            }
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.max(1, Number(req.query.limit) || 25);
            const { TransactionService } = await Promise.resolve().then(() => __importStar(require('../../transaction/services/transaction.service')));
            const { TRANSACTION_TYPE } = await Promise.resolve().then(() => __importStar(require('../../../common/constants')));
            // Build filter for transactions
            const filter = {
                customerId: new mongoose_1.Types.ObjectId(customerId),
                isDeleted: false
            };
            // Additional filters from query params
            if (req.query.transactionType !== undefined) {
                filter.type = Number(req.query.transactionType);
            }
            if (req.query.fromDate || req.query.toDate) {
                filter.date = {};
                if (req.query.fromDate)
                    filter.date.$gte = new Date(String(req.query.fromDate));
                if (req.query.toDate)
                    filter.date.$lte = new Date(String(req.query.toDate));
                if (Object.keys(filter.date).length === 0)
                    delete filter.date;
            }
            let sort = { date: -1 };
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
            const enrichedTransactions = transactions.map((tx) => {
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
            const currentBalance = customer?.balance || 0;
            // Extract franchise name from populated franchiseId
            const franchiseName = customer?.franchiseId?.name || null;
            return (0, response_1.successResponse)(res, {
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
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get customer wallet', { error });
        }
    },
    async getInvoices(req, res) {
        try {
            const customerId = req.query.id;
            if (!mongoose_1.Types.ObjectId.isValid(customerId)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid customer id');
            }
            const customer = await customer_service_1.CustomerService.findById(customerId);
            if (!customer) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'Customer not found');
            }
            const loggedUser = req.user;
            const userFranchiseId = loggedUser && Number(loggedUser.role) === constants_1.ROLES.FRANCHISE_ADMIN
                ? toObjectIdOrNull(loggedUser.id)
                : (loggedUser && Number(loggedUser.role) === constants_1.ROLES.MASTER_ADMIN
                    ? (req.query.franchiseId ? toObjectIdOrNull(req.query.franchiseId) : null)
                    : null);
            // Master admin can access all customers' invoices
            if (loggedUser && Number(loggedUser.role) !== constants_1.ROLES.MASTER_ADMIN) {
                if (!franchiseAccessAllowed(customer.franchiseId, userFranchiseId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
            }
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.max(1, Number(req.query.limit) || 25);
            const filter = { customerId: new mongoose_1.Types.ObjectId(customerId), isDeleted: false };
            // Additional filters from query params
            if (req.query.status !== undefined) {
                filter.status = Number(req.query.status);
            }
            if (req.query.fromDate || req.query.toDate) {
                filter.createdAt = {};
                if (req.query.fromDate)
                    filter.createdAt.$gte = new Date(String(req.query.fromDate));
                if (req.query.toDate)
                    filter.createdAt.$lte = new Date(String(req.query.toDate));
                if (Object.keys(filter.createdAt).length === 0)
                    delete filter.createdAt;
            }
            let sort = { createdAt: -1 };
            if (req.query.sortBy) {
                const parts = String(req.query.sortBy).split(':');
                sort = { [parts[0]]: parts[1] === 'asc' ? 1 : -1 };
            }
            const result = await invoice_service_1.InvoiceService.paginate(filter, { page, limit, sort });
            return (0, response_1.successResponse)(res, result, 'Customer invoices retrieved successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get customer invoices', { error });
        }
    },
    async createTransaction(req, res) {
        try {
            const customerId = req?.query?.id;
            console.log("customerId", customerId);
            if (!mongoose_1.Types.ObjectId.isValid(customerId)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid customer id');
            }
            const customer = await customer_service_1.CustomerService.findById(customerId);
            console.log("customer", customer);
            if (!customer) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'Customer not found');
            }
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            const userFranchiseId = role === constants_1.ROLES.FRANCHISE_ADMIN ? toObjectIdOrNull(loggedUser.id) : null;
            // Check permissions
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                // Master admin can add transaction to any customer
            }
            else if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                if (!franchiseAccessAllowed(customer.franchiseId, userFranchiseId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
            }
            else {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
            }
            const { amount, type, purpose, date } = req.body;
            const { TransactionService } = await Promise.resolve().then(() => __importStar(require('../../transaction/services/transaction.service')));
            const { InvoiceService } = await Promise.resolve().then(() => __importStar(require('../../invoice/services/invoice.service')));
            const { PAYMENT_TYPE, TRANSACTION_TYPE } = await Promise.resolve().then(() => __importStar(require('../../../common/constants')));
            let result;
            // Type 1: WITHDRAW (Charge/Debt Increase) -> Create Invoice
            if (Number(type) === TRANSACTION_TYPE.WITHDRAW) {
                // Create Invoice which will automatically create the transaction
                const invoicePayload = {
                    franchiseId: customer.franchiseId,
                    customerId: new mongoose_1.Types.ObjectId(customerId),
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
                    createdBy: new mongoose_1.Types.ObjectId(loggedUser.id),
                    transactionRemarks: purpose
                };
                result = await InvoiceService.createInvoice(invoicePayload);
            }
            // Type 2: DEPOSIT (Payment) -> Create Transaction
            else {
                // Create transaction directly
                result = await TransactionService.createTransaction({
                    franchiseId: customer.franchiseId,
                    customerId: new mongoose_1.Types.ObjectId(customerId),
                    type: Number(type), // 2: Deposit
                    amount: Number(amount),
                    paymentType: PAYMENT_TYPE.CASH,
                    remarks: purpose,
                    date: new Date(date),
                    createdBy: new mongoose_1.Types.ObjectId(loggedUser.id)
                });
            }
            return (0, response_1.successResponse)(res, result, 'Transaction created successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create transaction', { error });
        }
    },
    async sendStatement(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const { customerId, fromDate, toDate } = req.body;
            if (!customerId || !mongoose_1.Types.ObjectId.isValid(customerId)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid customer id');
            }
            const from = new Date(fromDate);
            const to = new Date(toDate);
            if (isNaN(from.getTime()) || isNaN(to.getTime())) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid date range');
            }
            // Ensure end of day for 'to' date
            to.setUTCHours(23, 59, 59, 999);
            const customer = await customer_service_1.CustomerService.findById(customerId);
            if (!customer) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'Customer not found');
            }
            const role = Number(loggedUser.role);
            const userFranchiseId = role === constants_1.ROLES.FRANCHISE_ADMIN ? toObjectIdOrNull(loggedUser.id) : null;
            // Check permissions
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                if (!franchiseAccessAllowed(customer.franchiseId, userFranchiseId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
            }
            else if (role !== constants_1.ROLES.MASTER_ADMIN) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
            }
            const { TransactionService } = await Promise.resolve().then(() => __importStar(require('../../transaction/services/transaction.service')));
            const { TransactionModel } = await Promise.resolve().then(() => __importStar(require('../../transaction/models/transaction.model')));
            const { TRANSACTION_TYPE } = await Promise.resolve().then(() => __importStar(require('../../../common/constants')));
            const { sendStatementEmail } = await Promise.resolve().then(() => __importStar(require('../../../services/statement.mailer')));
            // 1. Calculate Opening Balance
            // Sum all transactions BEFORE the fromDate
            const preTransactions = await TransactionService.find({
                customerId: customer._id,
                isDeleted: false,
                date: { $lt: from }
            });
            let openingBalance = 0;
            preTransactions.forEach((txn) => {
                const amount = Math.abs(txn.amount || 0);
                if (txn.type === TRANSACTION_TYPE.WITHDRAW) {
                    openingBalance -= amount; // Customer charged (owes money)
                }
                else {
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
            transactions.forEach((txn) => {
                const amount = Math.abs(txn.amount || 0);
                if (txn.type === TRANSACTION_TYPE.WITHDRAW) {
                    closingBalance -= amount; // Customer charged (owes money)
                }
                else {
                    closingBalance += amount; // Customer paid (reduces debt)
                }
            });
            // 4. Send Email
            await sendStatementEmail(customer, transactions, openingBalance, closingBalance, from, to);
            return (0, response_1.successResponse)(res, null, 'Statement sent successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send statement', { error });
        }
    },
};
//# sourceMappingURL=customer.controller.js.map