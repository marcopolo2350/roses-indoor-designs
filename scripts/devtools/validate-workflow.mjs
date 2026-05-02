import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workflowPath = path.join(root, ".github", "workflows", "verify.yml");
const packagePath = path.join(root, "package.json");
const errors = [];

if (!existsSync(workflowPath)) {
  errors.push("Missing GitHub Verify workflow: .github/workflows/verify.yml");
}

if (!existsSync(packagePath)) {
  errors.push("Missing package.json.");
}

const workflow = existsSync(workflowPath) ? readFileSync(workflowPath, "utf8") : "";
const packageJson = existsSync(packagePath)
  ? JSON.parse(readFileSync(packagePath, "utf8"))
  : { scripts: {} };
const scripts = packageJson.scripts || {};

function requireText(label, text) {
  if (!workflow.includes(text)) {
    errors.push(`Verify workflow is missing ${label}: ${text}`);
  }
}

requireText("main push trigger", "branches:");
requireText("main branch trigger", "- main");
requireText("pull request trigger", "pull_request:");
requireText("manual trigger", "workflow_dispatch:");
requireText("Node 24 action compatibility env", "FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true");
requireText("dependency install", "npm ci");
requireText("bounded Playwright browser install", "timeout-minutes: 5");
requireText("Chromium-only Playwright install", "npx playwright install chromium");
requireText("smoke artifact upload", "name: web-game-smoke");
requireText("Playwright artifact upload", "name: playwright-artifacts");

if (/--with-deps/.test(workflow)) {
  errors.push(
    "Verify workflow must not use Playwright --with-deps; that path wedged hosted runners.",
  );
}

const requiredActionMajors = new Map([
  ["actions/checkout", "v6"],
  ["actions/setup-node", "v6"],
  ["actions/setup-python", "v6"],
  ["actions/upload-artifact", "v7"],
]);

for (const [action, major] of requiredActionMajors) {
  const matches = [...workflow.matchAll(new RegExp(`uses:\\s*${action}@(v\\d+)`, "g"))];
  if (!matches.length) {
    errors.push(`Verify workflow is missing required action ${action}@${major}`);
    continue;
  }
  for (const match of matches) {
    if (match[1] !== major) {
      errors.push(`Verify workflow action ${action} must use ${major}, found ${match[1]}`);
    }
  }
}

function normalizeCommand(command) {
  return command
    .trim()
    .replace(/^cmd\s+\/c\s+/i, "")
    .trim();
}

const testCommands = (scripts.test || "")
  .split("&&")
  .map((command) => normalizeCommand(command))
  .filter(Boolean);

for (const command of testCommands) {
  requireText(`npm test command "${command}"`, `run: ${command}`);
}

for (const command of ["npm run test:playwright", "npm run test:smoke"]) {
  requireText(`browser verification command "${command}"`, `run: ${command}`);
}

if (!scripts["validate:workflow"]) {
  errors.push("package.json is missing validate:workflow.");
} else {
  requireText("workflow validation command", "run: npm run validate:workflow");
}

if (errors.length) {
  console.error("Workflow validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Verify workflow validation passed.");
