# Security Specification for Fresh Tea POS

## Data Invariants
1. Orders must have a non-empty list of items.
2. Orders must have a status from the allowed enum.
3. Users cannot change their own roles in their profile.
4. Products and Categories can only be modified by admins.
5. Users can only read their own orders unless they are admins.

## The Dirty Dozen (Attack Scenarios)
1. **Self-Promotion**: Non-admin user tries to set `role: 'ADMIN'` on their user document.
2. **Order Forgery**: User tries to create an order with `status: 'COMPLETED'` to bypass preparation.
3. **Price Manipulation**: User tries to create an order with `totalAmount: 0` despite having items.
4. **Unauthorized Deletion**: Regular user tries to delete a product from the menu.
5. **ID Poisoning**: Attacker tries to create a product with an extremely long ID string (>1MB).
6. **Time Spoofing**: User tries to set `createdAt` to a future date.
7. **Peeper Attack**: User A tries to read the order details of User B.
8. **Inventory Sabotage**: Regular user tries to set `isAvailable: false` on all products.
9. **Role Hijack**: User tries to update their profile to include `role: 'ADMIN'` during a field update.
10. **Terminal State Break**: Attacker tries to update an order after it has been `CANCELLED`.
11. **Shadow Update**: Attacker tries to add a `discountApplied: true` field to an order.
12. **Anonymous Admin**: Unauthenticated user tries to read the list of all users.

## Test Runner (Security Rules Tests)
Implementation in `firestore.rules.test.ts` follows.
