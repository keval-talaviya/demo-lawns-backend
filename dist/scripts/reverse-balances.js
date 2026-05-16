"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const customer_model_1 = require("../src/modules/customer/model/customer.model");
const config_1 = require("../src/config");
/**
 * Reverse all customer balances (multiply by -1)
 * This changes the sign convention from positive=owes to negative=owes
 */
async function reverseCustomerBalances() {
    try {
        await mongoose_1.default.connect(config_1.config.mongoUri);
        console.log('Connected to MongoDB\n');
        const customers = await customer_model_1.CustomerModel.find({ isDeleted: false });
        console.log(`Found ${customers.length} active customers\n`);
        let updatedCount = 0;
        for (const customer of customers) {
            const oldBalance = customer.balance || 0;
            const newBalance = -oldBalance;
            await customer_model_1.CustomerModel.findByIdAndUpdate(customer._id, {
                balance: newBalance,
            });
            console.log(`✅ ${customer.name}: ${oldBalance.toFixed(2)} → ${newBalance.toFixed(2)}`);
            updatedCount++;
        }
        console.log(`\n========== SUMMARY ==========`);
        console.log(`Total customers updated: ${updatedCount}`);
        console.log(`============================\n`);
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
    catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
}
reverseCustomerBalances();
//# sourceMappingURL=reverse-balances.js.map