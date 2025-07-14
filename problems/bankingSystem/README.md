## Requirements

You are tasked with building a class BankingSystem that models account creation, money transfer, and transaction handling. Each level introduces additional requirements as outlined below:

---

### Level 1: Account Management

- `createAccount()` - Creates a new account. Returns true on success, false if the account exists.

- `deposit()` - Adds funds to the specified account.

- `pay()` - Deducts funds from the account.

### Level 2: Leaderboard

- `topAccounts()` - Returns a list of the top `n` accounts by total transaction amount regardless of the effects to account balance.

### Level 3: Transfers

- `transfer()` - Initiates a pending transfer. Deducts the amount from the sender immediately. The ordinal is unique per recipient, not globally.

- `acceptTransfer()` - Finalizes the transfer, crediting the recipient.

### Level 4: Transfer Revocation

- `revokeTransfer()` - Allows the sender to cancel a pending transfer before it's accepted or expired.

---

#### Examples

| Query                                     | Explanation                                    |
| ----------------------------------------- | ---------------------------------------------- |
| `createAccount(1, "alice")`               | returns `true`                                 |
| `deposit(2, "alice", 100)`                | returns `100` (current account balance)        |
| `pay(3, "alice", 50)`                     | returns `50` (current account balance)         |
| `topAccounts(6, 1)`                       | returns `["alice(100)"]`                       |
| `transfer(4, "alice", "bob", 50)`         | returns `"transfer0"`, alice's balance = 0     |
| `acceptTransfer(5, "bob", "transfer0")`   | returns `50` (current account balance)         |
| `revokeTransfer(7, "alice", "transfer0")` | returns `true` (transfer successfully revoked) |
