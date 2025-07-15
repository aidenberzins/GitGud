# 📦 Inventory Management System

## 🧭 Instructions

Your task is to implement a simple inventory tracking system for a small warehouse. The system should allow adding products, updating stock levels, and querying stock availability. Each level adds complexity and new features.

You are not required to provide the most efficient implementation. Any code that passes the tests is sufficient.

### 🧩 Level 1: Basic Stock Tracking

Implement the following methods:

`createProduct(timestamp: number, productId: string): boolean`
`restock(timestamp: number, productId: string, quantity: number): number | null`
`purchase(timestamp: number, productId: string, quantity: number): number | null`

Requirements
You can only create a product once.

Restocking a product increases its quantity.

Purchasing decreases quantity. Return null if the product doesn’t exist or stock is insufficient.

## 📊 Level 2: Stock Auditing and History

Add support for querying stock levels and audit logs.

`getStock(productId: string): number | null`
`getAuditLog(productId: string): { timestamp: number; action: "restock" | "purchase"; quantity: number }[]`

Requirements
Return null for unknown products.

Audit log should be returned in order of operations (FIFO).

Keep audit logs per product.

### 🧮 Level 3: Reorder Threshold Alerts

Track low inventory with a configurable threshold.

`setReorderThreshold(productId: string, threshold: number): void`
`needsRestock(productId: string): boolean`

Requirements
If current stock is below or equal to the threshold, return true.

If no threshold is set, needsRestock should return false.

### 🔁 Level 4: Batching and Rollbacks

Support batch operations and ability to rollback a previous purchase.

`batchRestock(timestamp: number, items: { productId: string; quantity: number }[]): void`
`rollbackPurchase(timestamp: number, productId: string): boolean`

Requirements
`rollbackPurchase` undoes the most recent purchase by restoring the quantity (but does not remove the audit entry).

Can only roll back if there is at least one purchase in the audit log for that product.