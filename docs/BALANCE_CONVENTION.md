# Customer Balance Accounting Convention

## Quick Reference

**BALANCE CONVENTION (CUSTOMER-CENTRIC):**
- **NEGATIVE balance (-)** = Customer OWES money (debt)  
- **POSITIVE balance (+)** = Customer has CREDIT/PREPAYMENT

**TRANSACTION TYPES:**
- **WITHDRAW (type=1)** = Invoice/charge → balance DECREASES (more negative)
- **DEPOSIT (type=2)** = Payment → balance INCREASES (less negative)

**EXAMPLE:**
```
Starting balance: 0
Invoice $100 → balance = 0 - 100 = -100 (owes $100)
Payment $30 → balance = -100 + 30 = -70 (owes $70)
```

## Full Documentation
See the complete documentation in the artifacts: `BALANCE_CONVENTION.md`

## Testing
```bash
# Verify all customer balances are correct
npm run verify-balances

# Debug specific customer transactions  
npm run debug-transactions
```

## Code Location
Balance calculation: `src/modules/transaction/services/transaction.service.ts`

**IMPORTANT**: Read the JSDoc comments in the code before modifying balance logic!
