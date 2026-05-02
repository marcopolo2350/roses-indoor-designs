import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const plannerSource = readFileSync(path.join(root, "scripts", "planner3d.js"), "utf8");
const loaderSource = readFileSync(
  path.join(root, "scripts", "planner3d", "model-loader.js"),
  "utf8",
);
const mainSource = readFileSync(path.join(root, "scripts", "main.js"), "utf8");
const errors = [];

const requiredFunctions = [
  "ensureGLTFLoader",
  "warnAssetFallback",
  "cloneAssetScene",
  "loadModelAsset",
];

for (const name of requiredFunctions) {
  if (!new RegExp(`function\\s+${name}\\s*\\(`).test(loaderSource)) {
    errors.push(`scripts/planner3d/model-loader.js must define ${name}().`);
  }
  if (new RegExp(`function\\s+${name}\\s*\\(`).test(plannerSource)) {
    errors.push(`scripts/planner3d.js must not define ${name}().`);
  }
}

if (!/window\.Planner3DModelLoader\s*=\s*Object\.freeze/.test(loaderSource)) {
  errors.push("scripts/planner3d/model-loader.js must register window.Planner3DModelLoader.");
}
if (!/assetCache\.set\(\s*assetKey,\s*resolveAndLoadModelAsset\(assetKey\)/s.test(loaderSource)) {
  errors.push("model-loader must own the asset-cache load path.");
}
if (!/trackModelStatus\(["']ok["'],\s*assetKey,\s*result\.url\)/.test(loaderSource)) {
  errors.push("model-loader must track successful model loads.");
}
if (!/trackModelStatus\(["']fail["'],\s*assetKey/.test(loaderSource)) {
  errors.push("model-loader must track failed model loads.");
}
if (!/assetWarned\s*=\s*true/.test(loaderSource)) {
  errors.push("model-loader must keep the single-toast fallback warning guard.");
}

const order = [...mainSource.matchAll(/["'](\.\/scripts\/[^"']+)["']/g)].map((match) => match[1]);
const loaderIndex = order.indexOf("./scripts/planner3d/model-loader.js");
const plannerIndex = order.indexOf("./scripts/planner3d.js");
if (loaderIndex < 0) errors.push("runtime modules are missing planner3d/model-loader.js.");
if (plannerIndex < 0) errors.push("runtime modules are missing planner3d.js.");
if (loaderIndex >= 0 && plannerIndex >= 0 && loaderIndex > plannerIndex) {
  errors.push("planner3d/model-loader.js must load before planner3d.js.");
}

if (errors.length) {
  console.error("3D model-loader validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("3D model-loader validation passed.");
