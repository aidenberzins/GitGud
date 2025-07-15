import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  appendFileSync,
  existsSync,
} from "fs";
import {join} from "path";

const toCamelCase = (str: string) =>
  str.replace(/-([a-z])/g, (_, g) => g.toUpperCase());

const toTitleCaseFromCamel = (str: string) =>
  str.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());

const green = (str: string) => `\x1b[32m${str}\x1b[0m`;
const dim = (str: string) => `\x1b[2m${str}\x1b[0m`;
const red = (str: string) => `\x1b[31m${str}\x1b[0m`;
const warn = (str: string) => `\x1b[33m${str}\x1b[0m`;
const underline = (str: string) => `\x1b[4m${str}\x1b[0m`;
/**
 * Creates a new problem directory with the specified kebab-case name.
 * It initializes the directory with the following files:
 * - index.ts
 * - index.test.ts
 * - README.md
 */
function createProblemDirectory(rawName: string, force = false) {
  console.clear();
  if (!rawName) {
    console.error(red("❌ Usage: pnpm new <kebab-case-problem-name>\n"));
    process.exit(0);
  }

  const formattedFileName = toCamelCase(rawName);
  const title = toTitleCaseFromCamel(formattedFileName);

  const problemDir = join("problems", formattedFileName);
  const functionName = toCamelCase(formattedFileName);
  const problemListPath = join(process.cwd(), ".problems");

  if (existsSync(problemDir)) {
    if (!force) {
      // prettier-ignore
      console.error(warn(`⚠️  Problem directory already exists: ${underline(problemDir)}\n`));
      process.exit(0);
    } else {
      console.log(warn(`⚠️  Overwriting existing problem: ${problemDir}\n`));
    }
  }

  // 1. Add to `.problems` if not already listed
  if (existsSync(problemListPath)) {
    const contents = readFileSync(problemListPath, "utf-8");
    if (!contents.includes(formattedFileName)) {
      const endsWithNewline = contents.endsWith("\n");
      const entry = `${formattedFileName}\n`;
      appendFileSync(problemListPath, endsWithNewline ? entry : `\n${entry}`);
    }
  } else {
    writeFileSync(problemListPath, `${formattedFileName}\n`);
  }

  // 2. Create directory and files
  mkdirSync(problemDir, {recursive: true});

  // index.ts
  const indexTS = `export function ${functionName}() {
  // TODO: implement
}
`;
  writeFileSync(join(problemDir, "index.ts"), indexTS);

  // index.test.ts
  const testTS = `import { describe, it, expect } from 'vitest';
import { ${functionName} } from './index';

describe('${functionName}', () => {
  it('should work correctly', () => {
    // expect(${functionName}(...)).toBe(...)
  });
});
`;
  writeFileSync(join(problemDir, "index.test.ts"), testTS);

  // README.md
  const readme = `# ${title}

## Requirements

_TODO: Describe the problem and expected inputs/outputs._

## Constraints

- _Input:_
- _Output:_

## Examples

\`\`\`ts
// example usage
\`\`\`
`;
  writeFileSync(join(problemDir, "README.md"), readme);

  // prettier-ignore
  console.log(`✅ Created problem: ${green(title)} ${dim(`(function: ${functionName})\n`)}`);
}

const rawName = process.argv[2];
const force = process.argv.includes("--force");
createProblemDirectory(rawName, force);
