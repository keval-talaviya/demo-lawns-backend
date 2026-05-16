"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const transaction_model_1 = require("../models/transaction.model");
const customer_model_1 = require("../../customer/model/customer.model");
const constants_1 = require("../../../common/constants");
const base_dao_1 = require("../../../db/base.dao");
class TransactionServiceClass extends base_dao_1.BaseDAO {
    constructor() {
        super(transaction_model_1.TransactionModel);
    }
    /**
     * Create a customer transaction and update their balance
     *
     * BALANCE CONVENTION (CUSTOMER-CENTRIC):
     * - NEGATIVE balance = customer owes money (debt)
     * - POSITIVE balance = customer has credit/prepayment
     *
     * TRANSACTION TYPES:
     * - DEPOSIT (type=2) = Payment received → balance INCREASES (less debt)
     * - WITHDRAW (type=1) = Invoice/charge → balance DECREASES (more debt)
     *
     * EXAMPLES:
     * - Invoice for $100: type=WITHDRAW → balance -= 100 → -100 (owes $100)
     * - Payment of $30: type=DEPOSIT → balance += 30 → -70 (owes $70)
     * - Refund of $10: type=DEPOSIT → balance += 10 → -60 (owes $60)
     */
    async createTransaction(payload) {
        const session = await this.model.startSession();
        session.startTransaction();
        try {
            // Use create with array to support session
            const [transaction] = await this.model.create([payload], { session });
            // Update Customer Balance
            // DEPOSIT (2) -> Balance Decreases (Customer pays debt)
            // WITHDRAW (1) -> Balance Increases (Customer gets money back/refund, or debt increases? - Wait, Withdraw usually means taking money OUT of account. 
            // In accounting for "Customer Balance" (Accounts Receivable):
            // Invoice -> Debit (+ Balance)
            // Payment (Deposit) -> Credit (- Balance)
            // Refund (Withdraw) -> Debit (+ Balance)
            const adjustment = payload.type === constants_1.TRANSACTION_TYPE.DEPOSIT ? payload.amount : -payload.amount;
            await customer_model_1.CustomerModel.findByIdAndUpdate(payload.customerId, { $inc: { balance: adjustment } }, { session });
            await session.commitTransaction();
            return transaction;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    async paginate(filter, options) {
        const result = await super.paginate(filter, options);
        const sanitizedData = result.data.map((txn) => {
            const displayAmount = txn.type === constants_1.TRANSACTION_TYPE.WITHDRAW ? Math.abs(txn.amount) : -Math.abs(txn.amount);
            return {
                id: txn._id,
                purpose: txn.remarks || 'No remarks',
                amount: displayAmount.toFixed(2),
                createdAt: txn.date || txn.createdAt,
                // Include raw values if needed
                type: txn.type,
                rawAmount: txn.amount,
                invoiceId: txn.invoiceId?._id || txn.invoiceId,
                invoiceNumber: txn.invoiceId?.invoiceNumber || null,
            };
        });
        return {
            ...result,
            data: sanitizedData,
        };
    }
    async getByCustomerId(customerId, page, limit, sort) {
        const filter = {
            customerId,
            isDeleted: false,
        };
        const options = {
            page,
            limit,
            sort,
        };
        const result = await super.paginate(filter, options);
        const sanitizedData = result.data.map((txn) => {
            const displayAmount = txn.type === constants_1.TRANSACTION_TYPE.WITHDRAW ? Math.abs(txn.amount) : -Math.abs(txn.amount);
            return {
                id: txn._id,
                purpose: txn.remarks || 'No remarks',
                amount: displayAmount.toFixed(2),
                createdAt: txn.date || txn.createdAt,
                type: txn.type,
                rawAmount: txn.amount,
                invoiceId: txn.invoiceId,
            };
        });
        return {
            ...result,
            data: sanitizedData,
        };
    }
}
exports.TransactionService = new TransactionServiceClass();
//# sourceMappingURL=transaction.service.js.map