"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transaction_service_1 = require("../modules/transaction/services/transaction.service");
const userWallet_service_1 = require("../modules/userWallet/services/userWallet.service");
const invoice_model_1 = require("../modules/invoice/model/invoice.model");
const customer_model_1 = require("../modules/customer/model/customer.model");
const userWallet_model_1 = require("../modules/userWallet/models/userWallet.model");
const constants_1 = require("../common/constants");
/**
 * 🔄 Unified Transaction Manager
 *
 * This service coordinates both:
 * 1. Customer Transactions (Accounts Receivable)
 * 2. Staff Wallet Transactions (Cash Management)
 *
 * Ensures consistency and provides unified reporting
 */
class TransactionManagerClass {
    /**
     * Handle payment for an invoice
     * Creates appropriate transactions based on payment type
     */
    async handleInvoicePayment(params) {
        const { invoiceId, amountPaid, paymentType, staffUserId, createdBy, remarks } = params;
        if (amountPaid <= 0) {
            throw new Error('Payment amount must be greater than 0');
        }
        // Get invoice details
        const invoice = await invoice_model_1.InvoiceModel.findById(invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }
        const transactions = {
            customerTransaction: null,
            staffWalletTransaction: null,
        };
        try {
            // 1. Create customer transaction
            const customerTransactionData = {
                franchiseId: invoice.franchiseId,
                customerId: invoice.customerId,
                invoiceId: invoice._id,
                type: constants_1.TRANSACTION_TYPE.DEPOSIT,
                amount: amountPaid,
                paymentType: paymentType,
                remarks: remarks || `Payment for Invoice #${invoice.invoiceNumber}`,
                createdBy: createdBy,
                date: new Date(),
            };
            transactions.customerTransaction = await transaction_service_1.TransactionService.createTransaction(customerTransactionData);
            // 2. Create staff wallet transaction if CASH
            if (paymentType === constants_1.PAYMENT_TYPE.CASH) {
                if (!staffUserId) {
                    throw new Error('Staff user ID is required for CASH payments');
                }
                const walletTransactionData = {
                    userId: staffUserId,
                    franchiseId: invoice.franchiseId,
                    jobId: invoice.jobId,
                    invoiceId: invoice._id,
                    type: 2, // DEPOSIT
                    amount: amountPaid,
                    purpose: `Cash payment for Invoice #${invoice.invoiceNumber} - ${remarks || 'Customer payment'}`,
                    date: new Date(),
                    createdBy: createdBy,
                };
                transactions.staffWalletTransaction = await userWallet_service_1.UserWalletService.createTransaction(walletTransactionData);
            }
            return {
                success: true,
                message: 'Payment processed successfully',
                transactions,
            };
        }
        catch (error) {
            console.error('Error in handleInvoicePayment:', error);
            throw error;
        }
    }
    /**
     * Handle refund to customer
     */
    async handleCustomerRefund(params) {
        const { invoiceId, refundAmount, refundMethod, staffUserId, createdBy, remarks } = params;
        if (refundAmount <= 0) {
            throw new Error('Refund amount must be greater than 0');
        }
        const invoice = await invoice_model_1.InvoiceModel.findById(invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }
        const transactions = {
            customerTransaction: null,
            staffWalletTransaction: null,
        };
        try {
            // 1. Create customer transaction (Refund)
            const customerTransactionData = {
                franchiseId: invoice.franchiseId,
                customerId: invoice.customerId,
                invoiceId: invoice._id,
                type: constants_1.TRANSACTION_TYPE.WITHDRAW,
                amount: refundAmount,
                paymentType: refundMethod,
                remarks: `Refund for Invoice #${invoice.invoiceNumber} - ${remarks}`,
                createdBy: createdBy,
                date: new Date(),
            };
            transactions.customerTransaction = await transaction_service_1.TransactionService.createTransaction(customerTransactionData);
            // 2. Create staff wallet transaction if CASH refund
            if (refundMethod === constants_1.PAYMENT_TYPE.CASH) {
                if (!staffUserId) {
                    throw new Error('Staff user ID is required for CASH refunds');
                }
                const walletTransactionData = {
                    userId: staffUserId,
                    franchiseId: invoice.franchiseId,
                    jobId: invoice.jobId,
                    invoiceId: invoice._id,
                    type: 1, // WITHDRAW
                    amount: refundAmount,
                    purpose: `Cash refund for Invoice #${invoice.invoiceNumber} - ${remarks}`,
                    date: new Date(),
                    createdBy: createdBy,
                };
                transactions.staffWalletTransaction = await userWallet_service_1.UserWalletService.createTransaction(walletTransactionData);
            }
            return {
                success: true,
                message: 'Refund processed successfully',
                transactions,
            };
        }
        catch (error) {
            console.error('Error in handleCustomerRefund:', error);
            throw error;
        }
    }
    /**
     * Get unified transaction report
     */
    async getUnifiedTransactionReport(filters) {
        try {
            const customerTransactions = await transaction_service_1.TransactionService.paginate({
                franchiseId: filters.franchiseId,
                isDeleted: false,
                ...(filters.startDate && { date: { $gte: filters.startDate } }),
                ...(filters.endDate && { date: { $lte: filters.endDate } }),
                ...(filters.paymentType && { paymentType: filters.paymentType }),
            }, { page: 1, limit: 1000 });
            const staffWalletData = await userWallet_service_1.UserWalletService.getAllUserBalances(filters.franchiseId ? filters.franchiseId.toString() : undefined);
            return {
                success: true,
                data: {
                    customerTransactions: customerTransactions.data || [],
                    staffWalletBalances: staffWalletData || [],
                    summary: {
                        totalCustomerTransactions: customerTransactions.data?.length || 0,
                        totalStaffWithCash: staffWalletData?.length || 0,
                    },
                },
            };
        }
        catch (error) {
            console.error('Error in getUnifiedTransactionReport:', error);
            throw error;
        }
    }
    /**
     * Reconcile transactions
     */
    async reconcileTransactions(franchiseId, date) {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            const customerCashTransactions = await transaction_service_1.TransactionService.paginate({
                franchiseId: franchiseId,
                paymentType: constants_1.PAYMENT_TYPE.CASH,
                type: constants_1.TRANSACTION_TYPE.DEPOSIT,
                date: { $gte: startOfDay, $lte: endOfDay },
                isDeleted: false,
            }, { page: 1, limit: 1000 });
            // Get all staff wallet transactions for the franchise for the date
            const staffWalletTransactions = await userWallet_model_1.UserWalletTransactionModel.find({
                franchiseId: franchiseId,
                isDeleted: false,
                date: { $gte: startOfDay, $lte: endOfDay },
            }).lean();
            // Filter for DEPOSIT type only
            const staffDeposits = staffWalletTransactions.filter((txn) => txn.type === 2);
            const customerCashTotal = (customerCashTransactions.data || []).reduce((sum, txn) => sum + (txn.rawAmount || txn.amount || 0), 0);
            const staffWalletTotal = staffDeposits.reduce((sum, txn) => sum + (txn.amount || 0), 0);
            const discrepancy = customerCashTotal - staffWalletTotal;
            return {
                success: true,
                data: {
                    date: date,
                    customerCashTransactions: customerCashTransactions.data || [],
                    staffWalletDeposits: staffDeposits,
                    totals: {
                        customerCashTotal: customerCashTotal,
                        staffWalletTotal: staffWalletTotal,
                        discrepancy: discrepancy,
                    },
                    status: discrepancy === 0 ? 'BALANCED' : 'DISCREPANCY',
                    message: discrepancy === 0
                        ? 'All transactions reconciled successfully'
                        : `Discrepancy of ${Math.abs(discrepancy).toFixed(2)} detected`,
                },
            };
        }
        catch (error) {
            console.error('Error in reconcileTransactions:', error);
            throw error;
        }
    }
    /**
     * Get transaction summary
     */
    async getTransactionSummary(franchiseId, startDate, endDate) {
        try {
            const customers = await customer_model_1.CustomerModel.find({
                franchiseId: franchiseId,
                isDeleted: false,
            }).select('name balance');
            const totalCustomerBalance = customers.reduce((sum, customer) => sum + (customer.balance || 0), 0);
            const staffWalletData = await userWallet_service_1.UserWalletService.getAllUserBalances(franchiseId.toString());
            const totalStaffCash = (staffWalletData || []).reduce((sum, user) => sum + (user.balance || 0), 0);
            return {
                success: true,
                data: {
                    period: {
                        startDate: startDate,
                        endDate: endDate,
                    },
                    customerAccounts: {
                        totalCustomers: customers.length,
                        totalOutstanding: totalCustomerBalance,
                        customers: customers.map((c) => ({
                            id: c._id,
                            name: c.name,
                            balance: c.balance,
                        })),
                    },
                    staffWallets: {
                        totalStaff: staffWalletData?.length || 0,
                        totalCashHeld: totalStaffCash,
                        staff: staffWalletData || [],
                    },
                    overall: {
                        totalCustomerDebt: totalCustomerBalance,
                        totalStaffCash: totalStaffCash,
                    },
                },
            };
        }
        catch (error) {
            console.error('Error in getTransactionSummary:', error);
            throw error;
        }
    }
}
exports.default = new TransactionManagerClass();
//# sourceMappingURL=transactionManager.service.js.map