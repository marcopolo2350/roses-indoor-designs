import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));
const lockfile = JSON.parse(read("package-lock.json"));
const version = pkg.version;
const errors = [];

function expectMatch(label, value) {
  if (value !== version) {
    errors.push(`${label} version mismatch: expected ${version}, found ${value || "<missing>"}`);
  }
}

expectMatch(
  "index.html application-version",
  read("index.html").match(
    /<meta\s+name=["']application-version["']\s+content=["']([^"']+)["']/i,
  )?.[1],
);
expectMatch(
  "scripts/core/app-config.js",
  read("scripts/core/app-config.js").match(/version:\s*["']([^"']+)["']/)?.[1],
);
expectMatch(
  "docs/hardening-status.md",
  read("docs/hardening-status.md").match(/Current app version:\s*`([^`]+)`/)?.[1],
);
expectMatch("CHANGELOG.md latest heading", read("CHANGELOG.md").match(/^##\s+([^\s]+)/m)?.[1]);
expectMatch("package-lock.json root", lockfile.version);
expectMatch("package-lock.json package root", lockfile.packages?.[""]?.version);

if (errors.length) {
  console.error("Version validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Version validation passed for ${version}.`);
