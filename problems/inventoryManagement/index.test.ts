import { describe, it, expect, beforeEach } from "vitest";
import { InventoryManagement } from "./index";

describe("inventoryManagement", () => {
  let inventory: InventoryManagement;

  beforeEach(() => {
    inventory = new InventoryManagement();
  });

  describe("Level 1", () => {
    it("creates a product", () => {
      expect(inventory.createProduct(1, "productID_1")).toBe(true);
    });
    it("doesn't allow duplicate products", () => {
      expect(inventory.createProduct(1, "productID_1")).toBe(true);
      expect(inventory.createProduct(2, "productID_1")).toBe(false);
      expect(inventory.createProduct(2, "productID_2")).toBe(true);
    });
    it("restocking a product increases its quantity", () => {
      inventory.createProduct(1, "productID_1");
      expect(inventory.restock(1, "productID_1", 10)).toBe(10);
      expect(inventory.restock(1, "productID_1", 10)).toBe(20);
    });
    it("should reject restocking a missing product", () => {
      expect(inventory.restock(1, "ghost", 10)).toBeNull();
    });
    it("should reject restocking with negative quantity", () => {
      inventory.createProduct(1, "productID_1");
      expect(inventory.restock(1, "productID_1", -10)).toBeNull();
    });
    it("should allow restocking with zero quantity (no-op)", () => {
      inventory.createProduct(1, "productID_1");
      expect(inventory.restock(1, "productID_1", 0)).toBe(0);
    });
    it("purchasing decrease a product quantity", () => {
      inventory.createProduct(1, "productID_1");
      inventory.restock(1, "productID_1", 10);
      expect(inventory.purchase(1, "productID_1", 10)).toBe(10);
      expect(inventory.purchase(1, "productID_1", 10)).toBe(20);
    });
    it("does not allow purchase if no product", () => {
      expect(inventory.purchase(1, "missingProduct", 1)).toBeNull();
    });
    it("does not allow purchase if no inventory", () => {
      inventory.createProduct(1, "productID_1");
      expect(inventory.purchase(1, "productID_1", 10)).toBe(null);
    });
    it("does not allow purchase if not enough quantity", () => {
      inventory.createProduct(1, "productID_1");
      inventory.restock(1, "productID_1", 1);
      expect(inventory.purchase(1, "productID_1", 2)).toBe(null);
    });
    it("should reject purchase of negative or zero quantity", () => {
      inventory.createProduct(1, "productID_1");
      inventory.restock(1, "productID_1", 10);
      expect(inventory.purchase(1, "productID_1", 0)).toBeNull();
      expect(inventory.purchase(1, "productID_1", -5)).toBeNull();
    });
    it("should maintain correct quantity after partial success/failure", () => {
      inventory.createProduct(1, "p1");
      inventory.restock(1, "p1", 5);
      expect(inventory.purchase(1, "p1", 3)).toBe(3);
      expect(inventory.purchase(1, "p1", 3)).toBeNull(); // only 2 left
      expect(inventory.purchase(1, "p1", 2)).toBe(5); // now at 0
    });
  });
  describe("Level 2", () => {
    it("getStock returns null for unknown product", () => {
      expect(inventory.getStock("ghost")).toBeNull();
    });
    it("getStock reflects correct quantity after restock and purchase", () => {
      inventory.createProduct(1, "productID_1");
      inventory.restock(2, "productID_1", 10);
      inventory.purchase(3, "productID_1", 3);
      expect(inventory.getStock("productID_1")).toBe(7);
    });
    it("returns audit log in FIFO order", () => {
      inventory.createProduct(1, "p");
      inventory.restock(2, "p", 5);
      inventory.purchase(3, "p", 2);
      inventory.restock(4, "p", 1);

      expect(inventory.getAuditLog("p")).toEqual([
        { timestamp: 2, action: "restock", quantity: 5 },
        { timestamp: 3, action: "purchase", quantity: 2 },
        { timestamp: 4, action: "restock", quantity: 1 },
      ]);
    });
    it("audit log is empty for new product", () => {
      inventory.createProduct(1, "p");
      expect(inventory.getAuditLog("p")).toEqual([]);
    });
    it("audit log handles nonexistent product", () => {
      expect(inventory.getAuditLog("ghost")).toBe([]);
    });
    it("audit log is independent for each product", () => {
      inventory.createProduct(1, "p1");
      inventory.createProduct(2, "p2");
      inventory.restock(3, "p1", 1);
      inventory.restock(4, "p2", 5);

      expect(inventory.getAuditLog("p1")).toEqual([{ timestamp: 3, action: "restock", quantity: 1 }]);
      expect(inventory.getAuditLog("p2")).toEqual([{ timestamp: 4, action: "restock", quantity: 5 }]);
    });
  });
  describe("Level 3", () => {
    it("returns false if no threshold is set", () => {
      inventory.createProduct(1, "p1");
      inventory.restock(2, "p1", 5);
      expect(inventory.needsRestock("p1")).toBe(false);
    });
    it("returns false if stock is above threshold", () => {
      inventory.createProduct(1, "p1");
      inventory.restock(2, "p1", 10);
      inventory.setReorderThreshold("p1", 5);
      expect(inventory.needsRestock("p1")).toBe(false);
    });
    it("returns true if stock equals threshold", () => {
      inventory.createProduct(1, "p1");
      inventory.restock(2, "p1", 5);
      inventory.setReorderThreshold("p1", 5);
      expect(inventory.needsRestock("p1")).toBe(true);
    });
    it("returns true if stock is below threshold", () => {
      inventory.createProduct(1, "p1");
      inventory.restock(2, "p1", 3);
      inventory.setReorderThreshold("p1", 5);
      expect(inventory.needsRestock("p1")).toBe(true);
    });
    it("reflects updated stock after purchase", () => {
      inventory.createProduct(1, "p1");
      inventory.restock(2, "p1", 10);
      inventory.setReorderThreshold("p1", 5);
      inventory.purchase(3, "p1", 6); // stock now 4
      expect(inventory.needsRestock("p1")).toBe(true);
    });
    it("returns false for unknown product", () => {
      expect(inventory.needsRestock("ghost")).toBe(false);
    });
    it("overwrites previous threshold", () => {
      inventory.createProduct(1, "p1");
      inventory.restock(2, "p1", 10);
      inventory.setReorderThreshold("p1", 3);
      inventory.setReorderThreshold("p1", 11);
      expect(inventory.needsRestock("p1")).toBe(true);
      inventory.setReorderThreshold("p1", -100);
      expect(inventory.needsRestock("p1")).toBe(true);
    });
  });
  describe("Level 4", () => {
    it("batchRestock restocks multiple products", () => {
      inventory.createProduct(1, "a");
      inventory.createProduct(2, "b");

      inventory.batchRestock(3, [
        { productId: "a", quantity: 5 },
        { productId: "b", quantity: 10 },
      ]);

      expect(inventory.getStock("a")).toBe(5);
      expect(inventory.getStock("b")).toBe(10);
    });
    it("batchRestock skips or ignores missing products", () => {
      inventory.createProduct(1, "a");

      inventory.batchRestock(2, [
        { productId: "a", quantity: 5 },
        { productId: "ghost", quantity: 10 },
      ]);

      expect(inventory.getStock("a")).toBe(5);
      expect(inventory.getStock("ghost")).toBeNull(); // or undefined
    });
    it("batchRestock logs each restock event", () => {
      inventory.createProduct(1, "a");
      inventory.createProduct(2, "b");

      inventory.batchRestock(3, [
        { productId: "a", quantity: 3 },
        { productId: "b", quantity: 4 },
      ]);

      const logA = inventory.getAuditLog("a");
      const logB = inventory.getAuditLog("b");

      expect(logA).toEqual([{ timestamp: 3, action: "restock", quantity: 3 }]);
      expect(logB).toEqual([{ timestamp: 3, action: "restock", quantity: 4 }]);
    });
    it("restores stock on rollback of last purchase", () => {
      inventory.createProduct(1, "a");
      inventory.restock(2, "a", 5);
      inventory.purchase(3, "a", 3); // stock = 2

      const result = inventory.rollbackPurchase(4, "a");
      expect(result).toBe(true);
      expect(inventory.getStock("a")).toBe(5);
    });
    it("does not delete audit log on rollback", () => {
      inventory.createProduct(1, "a");
      inventory.restock(2, "a", 5);
      inventory.purchase(3, "a", 3);

      inventory.rollbackPurchase(4, "a");

      const log = inventory.getAuditLog("a");
      expect(log.length).toBe(2); // restock + purchase
    });
    it("fails rollback with no purchases", () => {
      inventory.createProduct(1, "a");
      inventory.restock(2, "a", 5);

      expect(inventory.rollbackPurchase(3, "a")).toBe(false);
    });
    it("rolls back only the most recent purchase", () => {
      inventory.createProduct(1, "a");
      inventory.restock(2, "a", 10);
      inventory.purchase(3, "a", 4); // balance = 6
      inventory.purchase(4, "a", 2); // balance = 4

      inventory.rollbackPurchase(5, "a"); // restores last 2
      expect(inventory.getStock("a")).toBe(6);
    });
    it("fails to rollback for nonexistent product", () => {
      expect(inventory.rollbackPurchase(1, "ghost")).toBe(false);
    });
  });
});
