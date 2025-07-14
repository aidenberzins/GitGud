const DAY = 24 * 60 * 60 * 1000; // milliseconds in a day

export class BankingSystem {
  private accounts: any = {}
  private transactions: any = {}
  private transfers: any = {}

  private addTransaction(timestamp: number, accountId: string, amount: number, action: string) {
    if (!this.transactions[accountId]) {
      this.transactions[accountId] = [];
    }
    this.transactions[accountId].push({ timestamp, amount, action });
  }

  private findTransactionByReceiver(timestamp, toAccountId, transferId) {
    if (!this.accounts[toAccountId]) return null;
    return this.transfers[toAccountId]
      ? this.transfers[toAccountId].find(transfer => transfer.transferId === transferId)
      : null;
  }

  private setTransferStatus(timestamp, toAccountId, transferId, status) {
    const ordinalStr = transferId.replace(/^transfer/, "");
    const ordinal = Number(ordinalStr);

    if (!isNaN(ordinal) && this.transfers[toAccountId][ordinal]) {
      this.transfers[toAccountId][ordinal].status = status;
    }
  }

  private findTransactionBySender(timestamp, fromAccountId, transferId) {
    if (!this.accounts[fromAccountId]) return null;
    const transferStub = this.accounts[fromAccountId].transfers[transferId];
    return this.findTransactionByReceiver(timestamp, transferStub.toAccountId, transferId);
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

  // prettier-ignore
  transfer(timestamp: number,fromAccountId: string,toAccountId: string,amount: number): string | null {
    if (!this.accounts[fromAccountId] || !this.accounts[toAccountId])
      return null;
    if (this.accounts[fromAccountId].balance < amount) return null;

    
    if (!this.transfers[toAccountId]) {
      this.transfers[toAccountId] = []
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
      status: "pending"
    });

    const transferStub = {
      transferId,
      fromAccountId,
      toAccountId,
      expiration,
    };
    this.accounts[fromAccountId].transfers[transferId] = transferStub
    this.accounts[fromAccountId].balance -= amount;
    return transferId;
  }

  acceptTransfer(timestamp: number, accountId: string, transferId: string): boolean {
    if (!this.accounts[accountId] || !this.transfers[accountId]) return false;

    const transfer = this.findTransactionByReceiver(timestamp, accountId, transferId);

    if (!transfer) return false;

    if (transfer.toAccountId !== accountId) return false;
    if (transfer.status !== "pending") return false;

    if (timestamp > transfer.expiration) {
      this.setTransferStatus(timestamp, accountId, transferId, "expired")
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

    const transfer = this.findTransactionBySender(timestamp, sourceAccountId, transferId);

    if (!transfer || transfer.status !== "pending" || transfer.expiration < timestamp) return false;

    this.accounts[sourceAccountId].balance += transfer.amount;

    this.setTransferStatus(timestamp, transfer.toAccountId, transferId, "revoked");

    return true;
  }
}
