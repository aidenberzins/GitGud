interface Account {
  balance: number;
  deposits: Record<number, number>;
  transfers: Record<string, TransferStub>;
}

interface Transfer {
  transferId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  expiration: number;
  status: "pending" | "accepted" | "revoked" | "expired";
}

interface TransferStub {
  transferId: string;
  fromAccountId: string;
  toAccountId: string;
  expiration: number;
}

interface Transaction {
  timestamp: number;
  amount: number;
  action: "deposit" | "pay" | "transfer";
}

const DAY = 24 * 60 * 60 * 1000; // milliseconds in a day

export class BankingSystem {
  private accounts: Record<string, Account> = {};
  private transfers: Record<string, Transfer[]> = {};
  private transactions: Record<string, Transaction[]> = {};

  private addTransaction(timestamp: number, accountId: string, amount: number, action: Transaction["action"]) {
    if (!this.transactions[accountId]) {
      this.transactions[accountId] = [];
    }
    this.transactions[accountId].push({ timestamp, amount, action });
  }

  private getTransactionByRecipient(timestamp: number, toAccountId: string, transferId: string) {
    if (!this.accounts[toAccountId]) return null;
    return this.transfers[toAccountId]
      ? this.transfers[toAccountId].find(transfer => transfer.transferId === transferId)
      : null;
  }

  private getTransferBySender(timestamp: number, fromAccountId: string, transferId: string) {
    if (!this.accounts[fromAccountId]) return null;
    const transferStub = this.accounts[fromAccountId].transfers[transferId];
    if (!transferStub) return null;
    return this.getTransactionByRecipient(timestamp, transferStub.toAccountId, transferId);
  }

  private setTransferStatus(timestamp: number, toAccountId: string, transferId: string, status: Transfer["status"]) {
    const ordinalStr = transferId.replace(/^transfer/, "");
    const ordinal = Number(ordinalStr);

    if (!isNaN(ordinal) && this.transfers[toAccountId][ordinal]) {
      this.transfers[toAccountId][ordinal].status = status;
    }
  }

  createAccount(timestamp: number, accountId: string): boolean {
    if (!this.accounts[accountId]) {
      this.accounts[accountId] = {
        balance: 0,
        deposits: {},
        transfers: {},
      };
      return true;
    }
    return false;
  }

  deposit(timestamp: number, accountId: string, amount: number): number | null {
    if (amount < 0) return null;
    if (!this.accounts[accountId]) return null;

    this.accounts[accountId].balance += amount;
    this.accounts[accountId].deposits[timestamp] = amount;
    this.addTransaction(timestamp, accountId, amount, "deposit");

    return this.accounts[accountId].balance;
  }

  pay(timestamp: number, accountId: string, amount: number): number | null {
    if (amount < 0) return null;
    if (!this.accounts[accountId]) return null;

    const balance = this.accounts[accountId].balance;
    if (balance < amount) return null;
    this.accounts[accountId].balance -= amount;
    this.addTransaction(timestamp, accountId, amount, "pay");
    return this.accounts[accountId].balance;
  }

  topAccounts(timestamp: number, n: number): string[] {
    if (Object.keys(this.accounts).length === 0) return [];

    const accounts = Object.keys(this.accounts)
      .map(accountId => {
        const transactionsCount = !this.transactions[accountId]
          ? 0
          : this.transactions[accountId].reduce((acc, t) => acc + t.amount, 0);
        return {
          accountId,
          transactionsCount,
        };
      })
      .sort((a, b) => a.accountId.localeCompare(b.accountId))
      .sort((a, b) => b.transactionsCount - a.transactionsCount)
      .map(account => `${account.accountId}(${account.transactionsCount})`);

    return accounts.slice(0, n);
  }

  transfer(timestamp: number, fromAccountId: string, toAccountId: string, amount: number): string | null {
    if (!this.accounts[fromAccountId] || !this.accounts[toAccountId]) return null;
    if (this.accounts[fromAccountId].balance < amount) return null;

    if (!this.transfers[toAccountId]) {
      this.transfers[toAccountId] = [];
    }

    const ordinal = this.transfers[toAccountId].length;
    const transferId = `transfer${ordinal}`;
    const expiration = timestamp + DAY;

    this.transfers[toAccountId].push({
      transferId,
      fromAccountId,
      toAccountId,
      amount,
      expiration,
      status: "pending",
    });

    const transferStub = {
      transferId,
      fromAccountId,
      toAccountId,
      expiration,
    };
    this.accounts[fromAccountId].transfers[transferId] = transferStub;
    this.accounts[fromAccountId].balance -= amount;
    return transferId;
  }

  acceptTransfer(timestamp: number, accountId: string, transferId: string): boolean {
    if (!this.accounts[accountId] || !this.transfers[accountId]) return false;

    const transfer = this.getTransactionByRecipient(timestamp, accountId, transferId);

    if (!transfer) return false;

    if (transfer.toAccountId !== accountId) return false;
    if (transfer.status !== "pending") return false;

    if (timestamp > transfer.expiration) {
      this.setTransferStatus(timestamp, accountId, transferId, "expired");
      this.accounts[transfer.fromAccountId].balance += transfer.amount;
      return false;
    }

    this.accounts[transfer.toAccountId].balance += transfer.amount;
    this.setTransferStatus(timestamp, transfer.toAccountId, transferId, "accepted");

    this.addTransaction(timestamp, transfer.toAccountId, transfer.amount, "transfer");
    this.addTransaction(timestamp, transfer.fromAccountId, transfer.amount, "transfer");

    return true;
  }

  revokeTransfer(timestamp: number, sourceAccountId: string, transferId: string): boolean {
    if (!this.accounts[sourceAccountId] || !this.accounts[sourceAccountId].transfers[transferId]) return false;

    const transfer = this.getTransferBySender(timestamp, sourceAccountId, transferId);

    if (!transfer || transfer.status !== "pending" || transfer.expiration < timestamp) return false;

    this.accounts[sourceAccountId].balance += transfer.amount;

    this.setTransferStatus(timestamp, transfer.toAccountId, transferId, "revoked");

    return true;
  }
}
