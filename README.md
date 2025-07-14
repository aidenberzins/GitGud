# 🧠 GitGud Practice CLI

A TypeScript-driven CLI toolkit for practicing structured coding problems in a real-world, class-based format — inspired by CodeSignal, LeetCode, and other interview platforms.

---

## 🚀 Getting Started

Install dependencies:

```bash
pnpm install
```

Create your first problem:

```bash
pnpm new practice-problem
```

Run tests for any incomplete problem:

```bash
pnpm test practice-problem
```

---

# 📖 CLI Guide

```bash
pnpm guide
```

## 🛠 Commands

### 🏗️ Problem Scaffolding

- `pnpm new <name>` Create a new problem (camelCase folder with starter files)
- `pnpm test` Select and run tests for an uncompleted problem
- `pnpm test --all` Test any problem, even completed ones

### 📓 Completion Tracking

- `pnpm mark` Mark a single problem as complete
- `pnpm mark:multi` Mark multiple problems at once
- `pnpm mark:undo` Unmark selected problems from completed
- `pnpm mark:reset` Wipe the entire completed list (with confirmation)

### 📘 Help & Docs

- `pnpm guide` Show this help menu with usage info
