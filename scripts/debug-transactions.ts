import mongoose from 'mongoose';
import { config } from '../src/config';

async function debugCustomerTransactions() {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB\n');

        const { CustomerModel } = await import('../src/modules/customer/model/customer.model');
        const { TransactionModel } = await import('../src/modules/transaction/models/transaction.model');

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
            transactions.forEach((txn: any, index: number) => {
                const effect = txn.type === 1 ? 'ADD' : 'SUBTRACT';
                const oldBalance = calculatedBalance;

                if (txn.type === 1) {  // WITHDRAW
                    calculatedBalance += txn.amount;
                } else {  // DEPOSIT
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
            } else {
                console.log(`✅ Correct`);
            }
        }

        await mongoose.disconnect();
        console.log('\n\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
}

debugCustomerTransactions();
