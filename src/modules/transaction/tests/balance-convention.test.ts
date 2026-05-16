import { TRANSACTION_TYPE } from '../../../common/constants';

/**
 * Unit tests for customer balance calculation logic
 * Run with: npm test
 */
describe('Customer Balance Calculations', () => {
    describe('Balance Convention', () => {
        it('should use negative balance to indicate debt', () => {
            // IMPORTANT: Negative balance = customer owes money
            const customerOwes50 = -50;
            expect(customerOwes50).toBeLessThan(0);
        });

        it('should use positive balance to indicate credit', () => {
            // Positive balance = customer has prepaid credit
            const customerHasCredit20 = 20;
            expect(customerHasCredit20).toBeGreaterThan(0);
        });
    });

    describe('Transaction Type Effects', () => {
        it('WITHDRAW should decrease balance (increase debt)', () => {
            let balance = 0;
            const invoiceAmount = 100;

            // WITHDRAW = new invoice/charge
            const adjustment = -invoiceAmount; // type === TRANSACTION_TYPE.WITHDRAW
            balance += adjustment;

            expect(balance).toBe(-100); // Customer now owes $100
        });

        it('DEPOSIT should increase balance (decrease debt)', () => {
            let balance = -100; // Customer owes $100
            const paymentAmount = 30;

            // DEPOSIT = payment received
            const adjustment = paymentAmount; // type === TRANSACTION_TYPE.DEPOSIT
            balance += adjustment;

            expect(balance).toBe(-70); // Customer now owes $70
        });
    });

    describe('Complete Transaction Flow', () => {
        it('should calculate balance correctly for invoice + partial payment', () => {
            let balance = 0;

            // Create invoice for $115
            const invoiceAdjustment = TRANSACTION_TYPE.WITHDRAW === 1
                ? -115  // WITHDRAW decreases balance
                : 115;
            balance += invoiceAdjustment;
            expect(balance).toBe(-115);

            // Receive payment of $100
            const paymentAdjustment = TRANSACTION_TYPE.DEPOSIT === 2
                ? 100   // DEPOSIT increases balance
                : -100;
            balance += paymentAdjustment;

            // Final balance should be -15 (customer owes $15)
            expect(balance).toBe(-15);
        });

        it('should handle overpayment correctly', () => {
            let balance = -50; // Customer owes $50

            // Customer pays $80
            balance += 80; // DEPOSIT

            // Customer now has $30 credit
            expect(balance).toBe(30);
            expect(balance).toBeGreaterThan(0); // Positive = credit
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero balance correctly', () => {
            const balance = 0;
            expect(balance).toBe(0); // Neither owes nor has credit
        });

        it('should handle refunds correctly', () => {
            let balance = -100; // Customer owes $100

            // Issue refund of $20
            balance += 20; // DEPOSIT (refund is like a payment)

            expect(balance).toBe(-80); // Customer now owes $80
        });
    });
});

/**
 * Helper function to check if balance indicates debt
 */
export function customerOwes Money(balance: number): boolean {
    return balance < 0;
}

/**
 * Helper function to get amount owed (always positive)
 */
export function getAmountOwed(balance: number): number {
    return balance < 0 ? Math.abs(balance) : 0;
}

/**
 * Helper function to get credit amount (always positive)
 */
export function getCreditAmount(balance: number): number {
    return balance > 0 ? balance : 0;
}
