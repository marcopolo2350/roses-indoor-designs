import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targets = ["index.html", "scripts"];
const blockedPatterns = [
  /on(?:click|input|change|pointerdown|pointerup|pointerleave|pointercancel)=/i,
  /\.on(?:click|change|pointerdown|pointermove|pointerup|pointerleave|pointercancel)\b/i,
];
const skipNames = new Set(["node_modules", ".git", "output"]);
const skipFiles = new Set([path.normalize("scripts/devtools/validate-inline-handlers.mjs")]);

function collectFiles(entry) {
  const absolute = path.join(root, entry);
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [absolute];
  const files = [];
  for (const child of fs.readdirSync(absolute)) {
    if (skipNames.has(child)) continue;
    files.push(...collectFiles(path.join(entry, child)));
  }
  return files;
}

const failures = [];
for (const file of targets.flatMap(collectFiles)) {
  const relative = path.relative(root, file);
  if (skipFiles.has(path.normalize(relative))) continue;
  if (!/\.(?:html|js|mjs)$/i.test(file)) continue;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (blockedPatterns.some((pattern) => pattern.test(line))) {
      failures.push(`${relative}:${index + 1}: ${line.trim()}`);
    }
  });
}

if (failures.length) {
  console.error("Inline/direct handler audit failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Inline/direct handler audit passed.");
