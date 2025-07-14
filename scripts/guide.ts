// formatting functions
const dim = (str: string) => `\x1b[2m${str}\x1b[0m`;
const green = (str: string) => `\x1b[32m${str}\x1b[0m`;

const padCommand = (cmd: string, width = 30) => green(cmd.padEnd(width));

const printEntry = (cmd: string, description: string) =>
  console.log(" ".repeat(3) + `${padCommand(cmd)}${dim(description)}`);

console.log("🧠 GitGud Practice CLI");
// prettier-ignore
console.log(dim("A CLI toolkit for practicing structured TypeScript/DSA problems.\n"));

console.log("🚧 Problem Scaffolding");
printEntry(
  "pnpm new <problem-name>",
  "Create a new problem (camelCase, with index.ts/test/README)",
);
printEntry(
  "pnpm test",
  "Select an uncompleted problem to test (vitest --watch)",
);
printEntry("pnpm test --all", "Test any problem, even completed");

console.log("\n" + "📓 Completion Tracking");
printEntry("pnpm mark", "Mark a single problem as complete");
printEntry("pnpm mark:multi", "Mark multiple problems at once");
printEntry("pnpm mark:undo", "Unmark selected problems from completed");
printEntry("pnpm mark:reset", "Clear all completed problems");

console.log("\n" + "📁 Dotfiles");
printEntry(".problems", "List of problem folder names in camelCase");
printEntry(".completed", "Tracks which problems you've completed");

console.log("\n" + "🆘 Help");
printEntry("pnpm guide", "Show this help menu");
console.log("\n");
