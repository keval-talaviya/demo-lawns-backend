import mongoose from 'mongoose';
import { CustomerModel } from '../src/modules/customer/model/customer.model';
import { config } from '../src/config';

/**
 * Reverse all customer balances (multiply by -1)
 * This changes the sign convention from positive=owes to negative=owes
 */
async function reverseCustomerBalances() {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB\n');

        const customers = await CustomerModel.find({ isDeleted: false });
        console.log(`Found ${customers.length} active customers\n`);

        let updatedCount = 0;

        for (const customer of customers) {
            const oldBalance = customer.balance || 0;
            const newBalance = -oldBalance;

            await CustomerModel.findByIdAndUpdate(customer._id, {
                balance: newBalance,
            });

            console.log(`✅ ${customer.name}: ${oldBalance.toFixed(2)} → ${newBalance.toFixed(2)}`);
            updatedCount++;
        }

        console.log(`\n========== SUMMARY ==========`);
        console.log(`Total customers updated: ${updatedCount}`);
        console.log(`============================\n`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
}

reverseCustomerBalances();
