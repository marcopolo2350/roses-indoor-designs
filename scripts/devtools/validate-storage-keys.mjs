import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const scriptsDir = path.join(root, "scripts");
const errors = [];
const literalLocalStoragePattern =
  /localStorage\.(?:getItem|setItem|removeItem)\(\s*["'`](.+?)["'`]/g;
const directLocalStoragePattern = /localStorage\.(?:getItem|setItem|removeItem)\(/;
const directStorageAllowlist = new Set([
  "scripts/core/storage-keys.js",
  "scripts/cloud/supabase.js",
]);

function collectFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) files.push(...collectFiles(fullPath));
    if (stat.isFile() && /\.(?:js|mjs)$/.test(entry)) files.push(fullPath);
  }
  return files;
}

for (const filePath of collectFiles(scriptsDir)) {
  const relative = path.relative(root, filePath).replace(/\\/g, "/");
  if (relative === "scripts/core/storage-keys.js") continue;
  const source = readFileSync(filePath, "utf8");
  if (!directStorageAllowlist.has(relative) && directLocalStoragePattern.test(source)) {
    errors.push(`${relative} uses direct localStorage access outside the storage-key boundary.`);
  }
  for (const match of source.matchAll(literalLocalStoragePattern)) {
    errors.push(`${relative} uses a raw localStorage key literal: ${match[1]}`);
  }
}

const cloudSource = readFileSync(path.join(root, "scripts", "cloud", "supabase.js"), "utf8");
if (!/storageKey\(["']cloud::url["'],\s*\{\s*global:\s*true\s*\}\)/.test(cloudSource)) {
  errors.push("Cloud sync config keys must use the global storageKey registry.");
}
if (!/LEGACY_CLOUD_KEYS/.test(cloudSource)) {
  errors.push("Cloud sync must retain legacy key fallback while migrating storage keys.");
}

if (errors.length) {
  console.error("Storage-key validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Storage-key validation passed.");
