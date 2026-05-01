import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifest = JSON.parse(readFileSync(path.join(root, "data", "asset-manifest.json"), "utf8"));
const sources = JSON.parse(readFileSync(path.join(root, "data", "asset-sources.json"), "utf8"));
const items = Array.isArray(manifest) ? manifest : manifest.assets || [];
const errors = [];
const sourceIds = new Set();
const statusCounts = new Map();

for (const source of sources) {
  if (!source || typeof source !== "object") {
    errors.push("Asset source registry contains a non-object entry.");
    continue;
  }
  if (!source.id || typeof source.id !== "string") {
    errors.push("Asset source registry entry is missing a string id.");
    continue;
  }
  if (sourceIds.has(source.id)) errors.push(`Duplicate asset source id: ${source.id}`);
  sourceIds.add(source.id);
  for (const field of ["label", "license", "reviewStatus"]) {
    if (!source[field] || typeof source[field] !== "string") {
      errors.push(`Asset source ${source.id} is missing required string field ${field}.`);
    }
  }
  if (!["cleared", "needs-review"].includes(source.reviewStatus)) {
    errors.push(`Asset source ${source.id} has invalid reviewStatus: ${source.reviewStatus}`);
  }
}

for (const item of items) {
  const id = item.assetKey || item.id || "<missing id>";
  if (!item.sourceId || typeof item.sourceId !== "string") {
    errors.push(`Asset ${id} is missing sourceId.`);
    continue;
  }
  if (!sourceIds.has(item.sourceId)) {
    errors.push(`Asset ${id} references unknown sourceId: ${item.sourceId}`);
    continue;
  }
  statusCounts.set(item.sourceId, (statusCounts.get(item.sourceId) || 0) + 1);
  if (!item.source || typeof item.source !== "string") {
    errors.push(`Asset ${id} is missing human-readable source.`);
  }
}

if (errors.length) {
  console.error("Asset source validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const summary = [...statusCounts.entries()]
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([sourceId, count]) => `${sourceId}:${count}`)
  .join(", ");

console.log(`Asset source validation passed for ${items.length} assets (${summary}).`);
