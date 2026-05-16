import mongoose from 'mongoose';
import { CustomerModel } from '../src/modules/customer/model/customer.model';
import { TransactionModel } from '../src/modules/transaction/models/transaction.model';
import { TRANSACTION_TYPE } from '../src/common/constants';
import { config } from '../src/config';

/**
 * Verify and fix customer balances by recalculating from transaction history
 * 
 * BALANCE CONVENTION (CUSTOMER-CENTRIC):
 * - NEGATIVE balance = customer owes money (debt)
 * - POSITIVE balance = customer has credit/prepayment
 * 
 * TRANSACTION TYPES:
 * - WITHDRAW (type=1) = Invoice/new charge → DECREASES balance (more negative)
 * - DEPOSIT (type=2) = Payment received → INCREASES balance (less negative)
 */
async function verifyAndFixCustomerBalances() {
    try {
        // Connect to MongoDB using application config
        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB');

        const customers = await CustomerModel.find({ isDeleted: false });
        console.log(`\nFound ${customers.length} active customers\n`);

        let fixedCount = 0;
        let correctCount = 0;
        let errorCount = 0;

        for (const customer of customers) {
            try {
                // Get all transactions for this customer
                const transactions = await TransactionModel.find({
                    customerId: customer._id,
                    isDeleted: false,
                }).sort({ date: 1 });

                // Calculate balance from transactions (NEW CONVENTION: negative = debt)
                let calculatedBalance = 0;
                for (const txn of transactions) {
                    if (txn.type === TRANSACTION_TYPE.WITHDRAW) {
                        // Invoice/debt - DECREASES balance (becomes more negative)
                        calculatedBalance -= txn.amount;
                    } else if (txn.type === TRANSACTION_TYPE.DEPOSIT) {
                        // Payment - INCREASES balance (becomes less negative)
                        calculatedBalance += txn.amount;
                    }
                }

                const currentBalance = customer.balance || 0;
                const difference = Math.abs(calculatedBalance - currentBalance);

                if (difference > 0.01) {
                    // Balance is incorrect - fix it
                    console.log(`❌ Customer: ${customer.name}`);
                    console.log(`   Current balance: ${currentBalance.toFixed(2)}`);
                    console.log(`   Calculated balance: ${calculatedBalance.toFixed(2)}`);
                    console.log(`   Difference: ${difference.toFixed(2)}`);
                    console.log(`   Transactions: ${transactions.length}`);

                    // Update the balance
                    await CustomerModel.findByIdAndUpdate(customer._id, {
                        balance: calculatedBalance,
                    });

                    console.log(`   ✅ Fixed!\n`);
                    fixedCount++;
                } else {
                    // Balance is correct
                    console.log(`✅ Customer: ${customer.name} - Balance: ${currentBalance.toFixed(2)} (Correct)`);
                    correctCount++;
                }
            } catch (error) {
                console.error(`Error processing customer ${customer.name}:`, error);
                errorCount++;
            }
        }

        console.log('\n========== SUMMARY ==========');
        console.log(`Total customers: ${customers.length}`);
        console.log(`Correct balances: ${correctCount}`);
        console.log(`Fixed balances: ${fixedCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log('============================\n');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
}

// Run the script
verifyAndFixCustomerBalances();
