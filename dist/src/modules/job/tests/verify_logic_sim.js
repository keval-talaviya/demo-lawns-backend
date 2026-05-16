"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../../common/constants");
// Mock values for totalAmount and input amountPaid
const totalAmount = 100;
function simulateLogic(paymentType, inputAmountPaid) {
    let amountPaid = inputAmountPaid;
    // THE LOGIC WE JUST IMPLEMENTED
    if (paymentType === constants_1.PAYMENT_TYPE.CASH && amountPaid === 0) {
        amountPaid = totalAmount;
    }
    let invoiceStatus = 1; // Default: UNPAID
    if (amountPaid >= totalAmount) {
        invoiceStatus = 3; // PAID
    }
    else if (amountPaid > 0) {
        invoiceStatus = 2; // PARTIAL
    }
    return { amountPaid, invoiceStatus };
}
console.log("--- TEST CASES ---");
// Case 1: Bank Transfer, no amount provided
const case1 = simulateLogic(constants_1.PAYMENT_TYPE.BANK_TRANSFER, 0);
console.log(`Bank Transfer (0 paid): AmountPaid=${case1.amountPaid}, Status=${case1.invoiceStatus === 1 ? 'UNPAID' : 'PAID'}`);
// Case 2: Cash, no amount provided
const case2 = simulateLogic(constants_1.PAYMENT_TYPE.CASH, 0);
console.log(`Cash (0 paid input): AmountPaid=${case2.amountPaid}, Status=${case2.invoiceStatus === 3 ? 'PAID' : 'UNPAID'}`);
// Case 3: Bank Transfer, partial amount provided
const case3 = simulateLogic(constants_1.PAYMENT_TYPE.BANK_TRANSFER, 50);
console.log(`Bank Transfer (50 paid): AmountPaid=${case3.amountPaid}, Status=${case3.invoiceStatus === 2 ? 'PARTIAL' : 'NOT PARTIAL'}`);
// Case 4: Drop Invoice
const case4 = simulateLogic(constants_1.PAYMENT_TYPE.DROP_INVOICE, 0);
console.log(`Drop Invoice (0 paid): AmountPaid=${case4.amountPaid}, Status=${case4.invoiceStatus === 1 ? 'UNPAID' : 'PAID'}`);
//# sourceMappingURL=verify_logic_sim.js.map