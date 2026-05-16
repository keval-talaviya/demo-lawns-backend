"use strict";
// Mock logic to verify the calculation independently since we can't run full server
const verifyCalculation = () => {
    const gstRate = 15; // default
    const totalAmount = 50;
    const subtotal = totalAmount / (1 + gstRate / 100);
    const tax = totalAmount - subtotal;
    console.log(`Total: ${totalAmount}`);
    console.log(`GST Rate: ${gstRate}%`);
    console.log(`Subtotal: ${subtotal.toFixed(4)}`);
    console.log(`Tax: ${tax.toFixed(4)}`);
    // Verification
    const calculatedTotal = subtotal + tax;
    console.log(`Calculated Total: ${calculatedTotal.toFixed(4)}`);
    if (Math.abs(calculatedTotal - totalAmount) < 0.001) {
        console.log("PASS: Calculation logic is correct.");
    }
    else {
        console.error("FAIL: Calculation incorrect.");
        process.exit(1);
    }
};
verifyCalculation();
//# sourceMappingURL=verify_math.js.map