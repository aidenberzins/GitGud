import {describe, it, expect, beforeEach} from "vitest";
import {BankingSystem} from ".";

describe("Banking System", () => {
  let bank: BankingSystem;

  beforeEach(() => {
    bank = new BankingSystem();
  });

  describe("Level 1", () => {
    it("should create accounts successfully", () => {
      expect(bank.createAccount(1, "acc1")).toBe(true);
      expect(bank.createAccount(2, "acc1")).toBe(false); // duplicate
      expect(bank.createAccount(3, "acc2")).toBe(true);
    });

    it("should fail deposit on unknown account", () => {
      expect(bank.deposit(4, "ghost", 100)).toBeNull();
    });

    it("should allow deposits to existing accounts and return updated balance", () => {
      bank.createAccount(5, "acc1");
      expect(bank.deposit(6, "acc1", 100)).toBe(100);
      expect(bank.deposit(7, "acc1", 50)).toBe(150);
    });

    it("should fail pay from unknown account", () => {
      expect(bank.pay(8, "ghost", 20)).toBeNull();
    });

    it("should not allow overdraw and return null", () => {
      bank.createAccount(9, "acc1");
      bank.deposit(10, "acc1", 100);
      expect(bank.pay(11, "acc1", 150)).toBeNull();
    });

    it("should process valid payments and return new balance", () => {
      bank.createAccount(12, "acc1");
      bank.deposit(13, "acc1", 200);
      expect(bank.pay(14, "acc1", 50)).toBe(150);
      expect(bank.pay(15, "acc1", 150)).toBe(0);
    });

    it("should handle zero and negative amounts (based on rules)", () => {
      bank.createAccount(16, "acc1");

      // Define your rule — here we reject negatives and allow 0
      expect(bank.deposit(1, "acc1", 0)).toBe(0);
      expect(bank.deposit(2, "acc1", -10)).toBeNull();

      expect(bank.pay(1, "acc1", 0)).toBe(0);
      expect(bank.pay(2, "acc1", -5)).toBeNull();
    });

    it("should handle many accounts independently", () => {
      for (let i = 0; i < 100; i++) {
        expect(bank.createAccount(i, `acc${i}`)).toBe(true);
        expect(bank.deposit(i + 1000, `acc${i}`, i)).toBe(i);
      }

      expect(bank.pay(1100, "acc50", 25)).toBe(25);
      expect(bank.pay(1101, "acc99", 99)).toBe(0);
    });
  });
  describe("Level 2", () => {
    it("should return empty list if no accounts exist", () => {
      expect(bank.topAccounts(1, 3)).toEqual([]);
    });

    it("should return top accounts sorted by total activity amount", () => {
      bank.createAccount(1, "charlie");
      bank.createAccount(2, "alpha");
      bank.createAccount(3, "bravo");

      bank.deposit(4, "charlie", 300); // 300
      bank.deposit(5, "alpha", 500); // 500
      bank.pay(6, "alpha", 100); // +100 → 600 total
      bank.deposit(7, "bravo", 700); // 700

      const result = bank.topAccounts(8, 3);
      expect(result).toEqual(["bravo(700)", "alpha(600)", "charlie(300)"]);
    });

    it("should return fewer accounts if not enough exist", () => {
      bank.createAccount(1, "alpha");
      bank.deposit(2, "alpha", 200);
      expect(bank.topAccounts(3, 5)).toEqual(["alpha(200)"]);
    });

    it("should return only top n accounts", () => {
      bank.createAccount(1, "a");
      bank.createAccount(2, "b");
      bank.createAccount(3, "c");
      bank.deposit(4, "a", 100); // 100
      bank.deposit(5, "b", 300); // 300
      bank.deposit(6, "c", 200); // 200

      expect(bank.topAccounts(7, 2)).toEqual(["b(300)", "c(200)"]);
    });

    it("should break ties alphabetically", () => {
      bank.createAccount(1, "alpha");
      bank.createAccount(2, "bravo");
      bank.deposit(3, "alpha", 100);
      bank.deposit(4, "bravo", 100);

      const result = bank.topAccounts(5, 2);
      expect(result).toEqual(["alpha(100)", "bravo(100)"]); // tie → sort by accountId
    });
  });
  describe("Level 3", () => {
    it("should return null for transfer if source or target does not exist", () => {
      expect(bank.transfer(1, "a", "b", 100)).toBeNull();

      bank.createAccount(2, "a");
      expect(bank.transfer(3, "a", "b", 100)).toBeNull();

      bank.createAccount(4, "b");
      expect(bank.transfer(5, "ghost", "b", 100)).toBeNull();
    });

    it("should fail transfer if source has insufficient balance", () => {
      bank.createAccount(1, "a");
      bank.createAccount(2, "b");
      expect(bank.transfer(3, "a", "b", 50)).toBeNull(); // a has 0
    });

    it("should transfer funds and allow recipient to accept with correct transferId", () => {
      bank.createAccount(1, "alice");
      bank.createAccount(2, "bob");
      bank.deposit(3, "alice", 200);

      const transferId = bank.transfer(4, "alice", "bob", 150);
      expect(transferId).toBe("transfer0");

      expect(bank.acceptTransfer(5, "bob", transferId!)).toBe(true);
      expect(bank.pay(6, "bob", 150)).toBe(0);
    });

    it("should generate sequential transferIds per recipient", () => {
      bank.createAccount(1, "src");
      bank.createAccount(2, "target");
      bank.deposit(2, "src", 500);

      expect(bank.transfer(3, "src", "target", 100)).toBe("transfer0");
      expect(bank.transfer(4, "src", "target", 200)).toBe("transfer1");
      expect(bank.transfer(5, "src", "target", 50)).toBe("transfer2");
    });

    it("should fail to accept the same transferId twice", () => {
      bank.createAccount(1, "a");
      bank.createAccount(2, "b");
      bank.deposit(2, "a", 100);

      const transferId = bank.transfer(3, "a", "b", 100);
      expect(bank.acceptTransfer(4, "b", transferId!)).toBe(true);
      expect(bank.acceptTransfer(5, "b", transferId!)).toBe(false); // duplicate
    });

    it("should fail to accept transfer if account is not the target", () => {
      bank.createAccount(1, "a");
      bank.createAccount(2, "b");
      bank.createAccount(3, "c");
      bank.deposit(2, "a", 150);

      const transferId = bank.transfer(3, "a", "b", 100);
      expect(bank.acceptTransfer(4, "c", transferId!)).toBe(false);
    });

    it("should fail to accept nonexistent transferId", () => {
      bank.createAccount(1, "a");
      expect(bank.acceptTransfer(2, "a", "transfer999")).toBe(false);
    });

    it("should fail to accept expired transfer and refund source balance", () => {
      bank.createAccount(1, "sender");
      bank.createAccount(2, "receiver");
      bank.deposit(2, "sender", 100);

      const transferId = bank.transfer(10, "sender", "receiver", 100);
      expect(transferId).toBe("transfer0");

      const day = 24 * 60 * 60 * 1000;
      // should fail as it expires the second 1 day has passed
      const result = bank.acceptTransfer(
        11 + day + day,
        "receiver",
        transferId!,
      );

      expect(result).toBe(false);
      expect(bank.pay(17, "sender", 100)).toBe(0); // refund successful
      expect(bank.pay(18, "receiver", 1)).toBeNull(); // no funds
    });
  });
  describe("Level 4", () => {
    // transfer → revoke → refund → block accept
    it("should revoke a pending transfer and refund the source", () => {
      bank.createAccount(1, "sender");
      bank.createAccount(2, "receiver");
      bank.deposit(2, "sender", 100);

      const transferId = bank.transfer(3, "sender", "receiver", 100);
      expect(bank.revokeTransfer(4, "sender", transferId!)).toBe(true);

      // Should now be refunded
      expect(bank.pay(5, "sender", 100)).toBe(0);

      // Receiver should not be able to accept it
      expect(bank.acceptTransfer(6, "receiver", transferId!)).toBe(false);
    });

    it("should not allow a revoked transfer to be revoked again", () => {
      bank.createAccount(1, "sender");
      bank.createAccount(2, "receiver");
      bank.deposit(2, "sender", 50);

      const transferId = bank.transfer(3, "sender", "receiver", 50);
      bank.revokeTransfer(4, "sender", transferId!);
      expect(bank.revokeTransfer(5, "sender", transferId!)).toBe(false);
    });

    it("should not allow a transfer to be revoked after being accepted", () => {
      bank.createAccount(1, "s");
      bank.createAccount(2, "r");
      bank.deposit(2, "s", 200);

      const id = bank.transfer(3, "s", "r", 200);
      bank.acceptTransfer(4, "r", id!);

      expect(bank.revokeTransfer(5, "s", id!)).toBe(false);
    });

    it("should not allow someone other than the sender to revoke the transfer", () => {
      bank.createAccount(1, "src");
      bank.createAccount(2, "dst");
      bank.createAccount(3, "evil");
      bank.deposit(2, "src", 100);

      const id = bank.transfer(3, "src", "dst", 100);
      expect(bank.revokeTransfer(4, "evil", id!)).toBe(false);
    });

    it("should fail to revoke a nonexistent transfer", () => {
      bank.createAccount(1, "src");
      expect(bank.revokeTransfer(2, "src", "transfer999")).toBe(false);
    });

    it("should restore sender balance after revoke, not duplicate refund", () => {
      bank.createAccount(1, "a");
      bank.createAccount(2, "b");
      bank.deposit(2, "a", 100);
      const id = bank.transfer(3, "a", "b", 100);

      expect(bank.revokeTransfer(4, "a", id!)).toBe(true);
      expect(bank.revokeTransfer(5, "a", id!)).toBe(false); // already revoked

      expect(bank.pay(6, "a", 100)).toBe(0); // should have 100 refunded
      expect(bank.pay(7, "a", 1)).toBeNull(); // nothing left
    });
  });
});
