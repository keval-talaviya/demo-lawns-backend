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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("../src/config");
async function debugCustomerTransactions() {
    try {
        await mongoose_1.default.connect(config_1.config.mongoUri);
        console.log('Connected to MongoDB\n');
        const { CustomerModel } = await Promise.resolve().then(() => __importStar(require('../src/modules/customer/model/customer.model')));
        const { TransactionModel } = await Promise.resolve().then(() => __importStar(require('../src/modules/transaction/models/transaction.model')));
        // Find customer with name containing 'kp' or with balance 20
        const customers = await CustomerModel.find({
            $or: [
                { name: /kp/i },
                { balance: 20 }
            ],
            isDeleted: false
        });
        for (const customer of customers) {
            console.log(`\n========== Customer: ${customer.name} ==========`);
            console.log(`Balance: ${customer.balance}`);
            console.log(`\nTransactions:`);
            const transactions = await TransactionModel.find({
                customerId: customer._id,
                isDeleted: false
            }).sort({ date: 1 });
            let calculatedBalance = 0;
            transactions.forEach((txn, index) => {
                const effect = txn.type === 1 ? 'ADD' : 'SUBTRACT';
                const oldBalance = calculatedBalance;
                if (txn.type === 1) { // WITHDRAW
                    calculatedBalance += txn.amount;
                }
                else { // DEPOSIT
                    calculatedBalance -= txn.amount;
                }
                console.log(`\n${index + 1}. ${txn.remarks || 'No remarks'}`);
                console.log(`   Type: ${txn.type} (${txn.type === 1 ? 'WITHDRAW' : 'DEPOSIT'})`);
                console.log(`   Amount: ${txn.amount}`);
                console.log(`   Effect: ${effect} ${txn.amount}`);
                console.log(`   Balance: ${oldBalance} → ${calculatedBalance}`);
            });
            console.log(`\n----- Summary -----`);
            console.log(`Calculated Balance: ${calculatedBalance}`);
            console.log(`Actual DB Balance: ${customer.balance}`);
            console.log(`Difference: ${Math.abs(calculatedBalance - customer.balance)}`);
            if (Math.abs(calculatedBalance - customer.balance) > 0.01) {
                console.log(`❌ MISMATCH!`);
            }
            else {
                console.log(`✅ Correct`);
            }
        }
        await mongoose_1.default.disconnect();
        console.log('\n\nDisconnected from MongoDB');
    }
    catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
}
debugCustomerTransactions();
//# sourceMappingURL=debug-transactions.js.map