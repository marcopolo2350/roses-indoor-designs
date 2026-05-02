import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const gitignore = readFileSync(path.join(root, ".gitignore"), "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);
const ignored = new Set(gitignore);
const errors = [];

const requiredPatterns = [
  ".edge-headless/",
  ".edge-profile/",
  "tmp_playwright/",
  "tmp_playwright_quick/",
  "tmp_playwright_selftest/",
  "tmpshots/",
  "output/",
  "debug_*.png",
  "output_*.png",
  "preview_existing_room_*.png",
  "rose-selftest.png",
  "presentation-*.png",
  ".selftest-dom.html",
  ".selftest-server.pid",
  "tmp_actions.json",
  "poly_bundle_test.bin",
];

for (const pattern of requiredPatterns) {
  if (!ignored.has(pattern)) {
    errors.push(`.gitignore is missing generated artifact pattern: ${pattern}`);
  }
}

if (errors.length) {
  console.error("Clean/ignore validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Clean/ignore validation passed for ${requiredPatterns.length} patterns.`);
