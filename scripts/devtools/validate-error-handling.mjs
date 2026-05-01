import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const scanRoots = ["scripts"];
const skippedDirs = new Set([".git", "node_modules", "output"]);
const findings = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (skippedDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
      continue;
    }
    if (!/\.(mjs|js)$/.test(entry.name)) continue;
    await scanFile(fullPath);
  }
}

async function scanFile(filePath) {
  const text = await readFile(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  const emptyCatch = /catch\s*(?:\([^)]*\))?\s*\{\s*\}/;

  lines.forEach((line, index) => {
    if (emptyCatch.test(line)) {
      findings.push({
        file: path.relative(root, filePath),
        line: index + 1,
        text: line.trim(),
      });
    }
  });
}

for (const scanRoot of scanRoots) {
  await walk(path.join(root, scanRoot));
}

if (findings.length) {
  console.error("Silent catch audit failed:");
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} ${finding.text}`);
  }
  process.exit(1);
}

console.log("Silent catch audit passed.");
