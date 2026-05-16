import { Types } from 'mongoose';
import { TransactionService } from '../modules/transaction/services/transaction.service';
import { UserWalletService } from '../modules/userWallet/services/userWallet.service';
import { InvoiceModel } from '../modules/invoice/model/invoice.model';
import { CustomerModel } from '../modules/customer/model/customer.model';
import { UserWalletTransactionModel } from '../modules/userWallet/models/userWallet.model';
import { TRANSACTION_TYPE, PAYMENT_TYPE } from '../common/constants';

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
    async handleInvoicePayment(params: {
        invoiceId: Types.ObjectId | string;
        amountPaid: number;
        paymentType: number;
        staffUserId?: Types.ObjectId | string;
        createdBy: Types.ObjectId | string;
        remarks?: string;
    }) {
        const { invoiceId, amountPaid, paymentType, staffUserId, createdBy, remarks } = params;

        if (amountPaid <= 0) {
            throw new Error('Payment amount must be greater than 0');
        }

        // Get invoice details
        const invoice = await InvoiceModel.findById(invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }

        const transactions: any = {
            customerTransaction: null,
            staffWalletTransaction: null,
        };

        try {
            // 1. Create customer transaction
            const customerTransactionData = {
                franchiseId: invoice.franchiseId,
                customerId: invoice.customerId,
                invoiceId: invoice._id,
                type: TRANSACTION_TYPE.DEPOSIT,
                amount: amountPaid,
                paymentType: paymentType,
                remarks: remarks || `Payment for Invoice #${invoice.invoiceNumber}`,
                createdBy: createdBy,
                date: new Date(),
            };

            transactions.customerTransaction = await TransactionService.createTransaction(
                customerTransactionData
            );

            // 2. Create staff wallet transaction if CASH
            if (paymentType === PAYMENT_TYPE.CASH) {
                if (!staffUserId) {
                    throw new Error('Staff user ID is required for CASH payments');
                }

                const walletTransactionData = {
                    userId: staffUserId,
                    franchiseId: invoice.franchiseId,
                    jobId: invoice.jobId,
                    invoiceId: invoice._id as Types.ObjectId,
                    type: 2 as 1 | 2, // DEPOSIT
                    amount: amountPaid,
                    purpose: `Cash payment for Invoice #${invoice.invoiceNumber} - ${remarks || 'Customer payment'}`,
                    date: new Date(),
                    createdBy: createdBy,
                };

                transactions.staffWalletTransaction = await UserWalletService.createTransaction(
                    walletTransactionData
                );
            }

            return {
                success: true,
                message: 'Payment processed successfully',
                transactions,
            };
        } catch (error) {
            console.error('Error in handleInvoicePayment:', error);
            throw error;
        }
    }

    /**
     * Handle refund to customer
     */
    async handleCustomerRefund(params: {
        invoiceId: Types.ObjectId | string;
        refundAmount: number;
        refundMethod: number;
        staffUserId?: Types.ObjectId | string;
        createdBy: Types.ObjectId | string;
        remarks: string;
    }) {
        const { invoiceId, refundAmount, refundMethod, staffUserId, createdBy, remarks } = params;

        if (refundAmount <= 0) {
            throw new Error('Refund amount must be greater than 0');
        }

        const invoice = await InvoiceModel.findById(invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }

        const transactions: any = {
            customerTransaction: null,
            staffWalletTransaction: null,
        };

        try {
            // 1. Create customer transaction (Refund)
            const customerTransactionData = {
                franchiseId: invoice.franchiseId,
                customerId: invoice.customerId,
                invoiceId: invoice._id,
                type: TRANSACTION_TYPE.WITHDRAW,
                amount: refundAmount,
                paymentType: refundMethod,
                remarks: `Refund for Invoice #${invoice.invoiceNumber} - ${remarks}`,
                createdBy: createdBy,
                date: new Date(),
            };

            transactions.customerTransaction = await TransactionService.createTransaction(
                customerTransactionData
            );

            // 2. Create staff wallet transaction if CASH refund
            if (refundMethod === PAYMENT_TYPE.CASH) {
                if (!staffUserId) {
                    throw new Error('Staff user ID is required for CASH refunds');
                }

                const walletTransactionData = {
                    userId: staffUserId,
                    franchiseId: invoice.franchiseId,
                    jobId: invoice.jobId,
                    invoiceId: invoice._id as Types.ObjectId,
                    type: 1 as 1 | 2, // WITHDRAW
                    amount: refundAmount,
                    purpose: `Cash refund for Invoice #${invoice.invoiceNumber} - ${remarks}`,
                    date: new Date(),
                    createdBy: createdBy,
                };

                transactions.staffWalletTransaction = await UserWalletService.createTransaction(
                    walletTransactionData
                );
            }

            return {
                success: true,
                message: 'Refund processed successfully',
                transactions,
            };
        } catch (error) {
            console.error('Error in handleCustomerRefund:', error);
            throw error;
        }
    }

    /**
     * Get unified transaction report
     */
    async getUnifiedTransactionReport(filters: {
        franchiseId?: Types.ObjectId | string;
        startDate?: Date;
        endDate?: Date;
        paymentType?: number;
    }) {
        try {
            const customerTransactions = await TransactionService.paginate(
                {
                    franchiseId: filters.franchiseId,
                    isDeleted: false,
                    ...(filters.startDate && { date: { $gte: filters.startDate } }),
                    ...(filters.endDate && { date: { $lte: filters.endDate } }),
                    ...(filters.paymentType && { paymentType: filters.paymentType }),
                },
                { page: 1, limit: 1000 }
            );

            const staffWalletData = await UserWalletService.getAllUserBalances(
                filters.franchiseId ? filters.franchiseId.toString() : undefined
            );

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
        } catch (error) {
            console.error('Error in getUnifiedTransactionReport:', error);
            throw error;
        }
    }

    /**
     * Reconcile transactions
     */
    async reconcileTransactions(franchiseId: Types.ObjectId | string, date: Date) {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const customerCashTransactions = await TransactionService.paginate(
                {
                    franchiseId: franchiseId,
                    paymentType: PAYMENT_TYPE.CASH,
                    type: TRANSACTION_TYPE.DEPOSIT,
                    date: { $gte: startOfDay, $lte: endOfDay },
                    isDeleted: false,
                },
                { page: 1, limit: 1000 }
            );

            // Get all staff wallet transactions for the franchise for the date
            const staffWalletTransactions = await UserWalletTransactionModel.find({
                franchiseId: franchiseId,
                isDeleted: false,
                date: { $gte: startOfDay, $lte: endOfDay },
            }).lean();

            // Filter for DEPOSIT type only
            const staffDeposits = staffWalletTransactions.filter((txn: any) => txn.type === 2);

            const customerCashTotal = (customerCashTransactions.data || []).reduce(
                (sum: number, txn: any) => sum + (txn.rawAmount || txn.amount || 0),
                0
            );

            const staffWalletTotal = staffDeposits.reduce(
                (sum: number, txn: any) => sum + (txn.amount || 0),
                0
            );

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
                    message:
                        discrepancy === 0
                            ? 'All transactions reconciled successfully'
                            : `Discrepancy of ${Math.abs(discrepancy).toFixed(2)} detected`,
                },
            };
        } catch (error) {
            console.error('Error in reconcileTransactions:', error);
            throw error;
        }
    }

    /**
     * Get transaction summary
     */
    async getTransactionSummary(
        franchiseId: Types.ObjectId | string,
        startDate: Date,
        endDate: Date
    ) {
        try {
            const customers = await CustomerModel.find({
                franchiseId: franchiseId,
                isDeleted: false,
            }).select('name balance');

            const totalCustomerBalance = customers.reduce(
                (sum, customer) => sum + (customer.balance || 0),
                0
            );

            const staffWalletData = await UserWalletService.getAllUserBalances(
                franchiseId.toString()
            );

            const totalStaffCash = (staffWalletData || []).reduce(
                (sum: any, user: any) => sum + (user.balance || 0),
                0
            );

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
        } catch (error) {
            console.error('Error in getTransactionSummary:', error);
            throw error;
        }
    }
}

export default new TransactionManagerClass();
