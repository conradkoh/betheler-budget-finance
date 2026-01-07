# Transaction Editing Feature Specification

## Purpose & User Problem

Users need the ability to edit existing transactions to correct mistakes, update details, or modify transaction information after creation. Currently, users can only create and delete transactions, which forces them to delete and recreate transactions for any changes.

## Success Criteria

1. ✅ Users can edit any field of an existing transaction (amount, category, description, datetime, transactionType)
2. ✅ Edit functionality is accessible from the transaction list/item view
3. ✅ Form validation matches create transaction validation
4. ✅ Users can only edit their own transactions
5. ✅ UI/UX is consistent with existing budget editing pattern
6. ✅ Changes are immediately reflected in the UI after successful update

## Scope & Constraints

### In Scope

- **Backend**: Create `update` mutation in `services/backend/convex/transactions.ts`
  - Accept transaction ID and all editable fields
  - Validate user ownership
  - Apply same amount adjustment logic as create (expense = negative, income = positive, savings = both)
  - Apply same category defaults as create

- **Frontend**: Add edit functionality to transaction components
  - Add edit button to `TransactionItem.tsx` (similar to BudgetItem)
  - Add edit mode support to `TransactionForm.tsx` (accept initialData prop)
  - Add edit dialog in `TransactionItem.tsx` (similar to BudgetItem edit dialog)
  - Update `TransactionModal.tsx` to support edit mode (optional, for future use)

### Out of Scope

- Bulk editing multiple transactions
- Transaction history/audit trail
- Undo/redo functionality
- Editing transactions from other users (already prevented by ownership check)

## Technical Considerations

### Backend Implementation

**File**: `services/backend/convex/transactions.ts`

**New Mutation**: `update`
```typescript
export const update = mutation({
  args: {
    ...SessionIdArg,
    transactionId: v.id('transactions'),
    amount: v.number(),
    category: v.optional(v.string()),
    datetime: v.string(),
    description: v.string(),
    transactionType: v.union(v.literal('expense'), v.literal('income'), v.literal('savings')),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate user
    // 2. Fetch transaction and verify ownership
    // 3. Apply amount adjustment logic (same as create)
    // 4. Apply category defaults (same as create)
    // 5. Update transaction with ctx.db.patch
    // 6. Return transaction ID
  },
});
```

**Key Points**:
- Reuse amount adjustment logic from `create` mutation
- Reuse category default logic from `create` mutation
- Verify transaction ownership (same pattern as `remove` mutation)
- Use `ctx.db.patch` to update (not replace)

### Frontend Implementation

**1. TransactionForm.tsx**
- Add `initialData` prop (optional, similar to BudgetForm)
- Populate form with initialData when provided
- Use `updateTransaction` mutation when initialData exists
- Use `createTransaction` mutation when initialData is undefined
- Update button text: "Update Transaction" vs "Add Transaction"

**2. TransactionItem.tsx**
- Add edit button (Edit2Icon from lucide-react, similar to BudgetItem)
- Add `isEditing` state
- Add edit dialog (similar to BudgetItem edit dialog)
- Pass transaction data as `initialData` to TransactionForm
- Call `onDelete` callback after successful edit (to refresh list)

**3. TransactionModal.tsx** (Optional Enhancement)
- Add support for edit mode via props
- Could be used for inline editing in the future

### Validation

- Same validation rules as create transaction:
  - Amount must be valid number
  - Expense amounts must be positive (will be converted to negative)
  - Income amounts must be positive
  - Savings amounts can be positive or negative
  - Description is required
  - Datetime is required
  - TransactionType is required

### Error Handling

- Backend: Throw appropriate errors for:
  - Unauthorized access
  - Transaction not found
  - Transaction doesn't belong to user
- Frontend: Display errors via:
  - Form validation messages
  - Toast notifications (using sonner, if available)
  - Console errors for debugging

## User Experience Flow

1. User views transaction list
2. User clicks edit button (pencil icon) on a transaction item
3. Edit dialog opens with form pre-filled with transaction data
4. User modifies desired fields
5. User clicks "Update Transaction" button
6. Form validates input
7. On success:
   - Dialog closes
   - Transaction list refreshes (via onDelete callback pattern)
   - Updated transaction appears with new values
8. On error:
   - Error message displayed
   - Dialog remains open
   - User can correct and retry

## Implementation Plan

1. **Backend** (services/backend/convex/transactions.ts)
   - [ ] Add `update` mutation
   - [ ] Test mutation with Convex dashboard

2. **Frontend - TransactionForm** (apps/webapp/src/components/TransactionForm.tsx)
   - [ ] Add `initialData` prop interface
   - [ ] Add `updateTransaction` mutation hook
   - [ ] Update form defaultValues to use initialData
   - [ ] Update onSubmit to handle both create and update
   - [ ] Update button text based on mode

3. **Frontend - TransactionItem** (apps/webapp/src/components/TransactionItem.tsx)
   - [ ] Add Edit2Icon import
   - [ ] Add edit button next to delete button
   - [ ] Add `isEditing` state
   - [ ] Add edit dialog
   - [ ] Pass transaction as initialData to TransactionForm
   - [ ] Handle edit success callback

4. **Testing**
   - [ ] Test editing expense transaction
   - [ ] Test editing income transaction
   - [ ] Test editing savings transaction (both positive and negative)
   - [ ] Test validation errors
   - [ ] Test unauthorized access (if possible)
   - [ ] Test UI updates after edit

## Design Consistency

Follow the existing Budget editing pattern:
- Same icon (Edit2Icon)
- Same button placement and styling
- Same dialog structure
- Same form reuse pattern
- Same success callback pattern

## Questions for Clarification

1. Should we allow changing transaction type (expense → income, etc.)? **Assumption: Yes, same flexibility as create**
2. Should edited transactions maintain original creation timestamp? **Assumption: Yes, only update the data fields**
3. Should we add an "updatedAt" timestamp field? **Assumption: Not needed for MVP, can add later if needed**
4. Should TransactionModal support edit mode? **Assumption: Not needed for MVP, can add later**

