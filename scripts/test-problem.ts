import {readFileSync} from "fs";
import {join} from "path";
import {spawn} from "child_process";
import {select} from "@inquirer/prompts";

// CONSTANTS
const PROBLEMS_FILE = join(process.cwd(), ".problems");
const COMPLETED_FILE = join(process.cwd(), ".completed");

const green = (str: string) => `\x1b[32m${str}\x1b[0m`;
const dim = (str: string) => `\x1b[2m${str}\x1b[0m`;
const check = green("✅");

const toSentenceCase = (camel: string) =>
  camel.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());

/**
 * Runs a test for a selected problem from a list of available problems.
 *
 * This function reads a list of all problems and completed problems from their respective files.
 * It then filters the problems to show either all or only incomplete ones, based on the `showAll` flag.
 * The user is prompted to select a problem to test, and upon selection, the function spawns a child process
 * to run the tests for the chosen problem using Vitest in watch mode.
 *
 * @param args - Command-line arguments passed to the script.
 * @param showAll - If true, shows all problems (including completed ones); otherwise, shows only incomplete problems.
 */
function runTestProblem(args: string[], showAll = false) {
  const readLines = (path: string): string[] =>
    readFileSync(path, "utf-8")
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);

  // 1. Read all problems
  const allProblems = readLines(PROBLEMS_FILE);

  // 2. Read completed problems
  const completed = new Set(
    (COMPLETED_FILE &&
      readFileSync(COMPLETED_FILE, "utf-8")
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean)) ||
      [],
  );

  // 3. Filter problems
  const availableProblems = showAll
    ? allProblems
    : allProblems.filter(p => !completed.has(p));

  if (availableProblems.length === 0) {
    console.log(green("🎉 All problems are complete!"));
    process.exit(0);
  }

  // 4. Build choice list
  const choices = (showAll ? allProblems : availableProblems).map(name => {
    const displayName = toSentenceCase(name);
    const isDone = completed.has(name);

    return {
      name: showAll && isDone ? `${green(displayName)} ${check}` : displayName,
      value: name,
    };
  });

  // 5. Prompt user
  const run = async () => {
    const problem = await select({
      message: showAll
        ? "Select a problem (✅ = completed):"
        : "Select a problem to test:",
      choices,
    });

    console.log(`▶ Running tests for: ${problem}`);
    const child = spawn(
      "npx",
      ["vitest", "watch", "--root", process.cwd(), `problems/${problem}`],
      {
        stdio: "inherit",
      },
    );

    child.on("exit", code => process.exit(code ?? 1));
  };

  run();
}

const args = process.argv.slice(2);
const showAll = args.includes("--all");

runTestProblem(args, showAll);
