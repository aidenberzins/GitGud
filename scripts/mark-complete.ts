import {readFileSync, writeFileSync, appendFileSync, existsSync} from "fs";
import {join} from "path";
import inquirer from "inquirer";

const PROBLEMS_FILE = join(process.cwd(), ".problems");
const COMPLETED_FILE = join(process.cwd(), ".completed");

const green = (str: string) => `\x1b[32m${str}\x1b[0m`;
const dim = (str: string) => `\x1b[2m${str}\x1b[0m`;
const warn = (str: string) => `\x1b[33m${str}\x1b[0m`;

const toSentenceCase = (camel: string) =>
  camel.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());

function markProblemComplete() {
  const readLines = (path: string): string[] =>
    existsSync(path)
      ? readFileSync(path, "utf-8")
          .split("\n")
          .map(line => line.trim())
          .filter(Boolean)
      : [];

  const writeCompletedFile = (completedList: string[]) => {
    const content = completedList.sort().join("\n") + "\n";
    writeFileSync(COMPLETED_FILE, content);
  };

  const markProblems = async (multi = false) => {
    const allProblems = readLines(PROBLEMS_FILE);
    const completed = new Set(readLines(COMPLETED_FILE));
    const uncompleted = allProblems.filter(p => !completed.has(p));

    if (uncompleted.length === 0) {
      console.log(green("🎉 All projects are complete!"));
      console.log(
        dim("Add a new project to continue. (pnpm new <project-name>)\n"),
      );
      return;
    }

    const choices = uncompleted.map(name => ({
      name: toSentenceCase(name),
      value: name,
    }));

    const {selected} = await inquirer.prompt([
      {
        type: multi ? "checkbox" : "list",
        name: "selected",
        message: multi
          ? "Select problems to mark as complete:"
          : "Select a problem to mark complete:",
        choices,
      },
    ]);

    const toMark = Array.isArray(selected) ? selected : [selected];

    const current = readLines(COMPLETED_FILE);
    const set = new Set([...current, ...toMark]);

    writeCompletedFile([...set]);
    console.log(
      `${green("✅ Marked complete")}: ${toMark
        .map(toSentenceCase)
        .join(", ")}`,
    );
  };

  const unmarkProblems = async () => {
    const completed = readLines(COMPLETED_FILE);

    if (completed.length === 0) {
      console.log("✅ No problems are marked complete.");
      return;
    }

    const {selected} = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selected",
        message: "Select problems to unmark:",
        choices: completed.map(name => ({
          name: toSentenceCase(name),
          value: name,
        })),
      },
    ]);

    const updated = completed.filter(p => !selected.includes(p));
    writeCompletedFile(updated);

    console.log(
      `${green("↩️ Unmarked")}: ${selected.map(toSentenceCase).join(", ")}`,
    );
  };

  const resetCompleted = async () => {
    const {confirm} = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: warn("Are you sure you want to reset ALL completed problems?"),
        default: false,
      },
    ]);

    if (!confirm) {
      console.log("Reset cancelled. \n");
      return;
    }

    writeCompletedFile([]);
    console.log(green("🧹 All completed problems have been reset.\n"));
  };

  const args = process.argv.slice(2);
  const multi = args.includes("--multi");
  const undo = args.includes("--undo");
  const reset = args.includes("--reset");

  if (undo) {
    unmarkProblems();
  } else if (reset) {
    resetCompleted();
  } else {
    markProblems(multi);
  }
}

markProblemComplete();
