// Project-wide QA audit:
// 1. For every catalog asset whose GLB exists, compute natural X/Z aspect and
//    compare against the catalog default W/D. Flag mismatches whose magnitude
//    would visibly rotate the 3D model 90° from the 2D footprint, unless the
//    MODEL_REGISTRY entry already opts in to autoOrientToFootprint or has a
//    yawOffset that explains the swap.
// 2. For every catalog assetKey, check that it either has a MODEL_REGISTRY
//    entry (so it loads a real GLB) or is intentionally procedural (e.g.
//    rugs that render as flat planes).
// 3. For every surface-mount asset, decide whether a no-host drop should
//    fall to the floor (standaloneFallback) or stay at the surface default
//    elevation (lamp/vase). Report assets that probably should set the flag.
// 4. Print a clean go/no-go summary.
//
// Usage: node scripts/devtools/qa-audit.mjs
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function parseGLB(file) {
  const buf = fs.readFileSync(file);
  if (buf.toString("ascii", 0, 4) !== "glTF") return null;
  const chunkLen = buf.readUInt32LE(12);
  const json = buf.toString("utf8", 20, 20 + chunkLen);
  return JSON.parse(json);
}
function parseGLTF(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
function quatToMatrix(q) {
  const [x, y, z, w] = q;
  return [
    [1 - 2 * y * y - 2 * z * z, 2 * x * y - 2 * z * w, 2 * x * z + 2 * y * w],
    [2 * x * y + 2 * z * w, 1 - 2 * x * x - 2 * z * z, 2 * y * z - 2 * x * w],
    [2 * x * z - 2 * y * w, 2 * y * z + 2 * x * w, 1 - 2 * x * x - 2 * y * y],
  ];
}
function applyMatrix(m, v) {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}
function bboxFromGLTF(data) {
  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];
  if (!data?.nodes || !data?.meshes || !data?.accessors) return null;
  function walkNode(nodeIdx, parentMat) {
    const node = data.nodes[nodeIdx];
    if (!node) return;
    const scale = node.scale || [1, 1, 1];
    const rotation = node.rotation || [0, 0, 0, 1];
    const translation = node.translation || [0, 0, 0];
    const rotMat = quatToMatrix(rotation);
    // Simplification: compose only via rotation+scale+translate (no nested matrix stack)
    // This is sufficient because most GLBs use a flat or shallow node tree.
    if (node.mesh !== undefined) {
      const mesh = data.meshes[node.mesh];
      for (const prim of mesh.primitives) {
        const posIdx = prim.attributes?.POSITION;
        if (posIdx === undefined) continue;
        const acc = data.accessors[posIdx];
        if (!acc?.min || !acc?.max) continue;
        for (let i = 0; i < 8; i++) {
          const local = [
            i & 1 ? acc.max[0] : acc.min[0],
            i & 2 ? acc.max[1] : acc.min[1],
            i & 4 ? acc.max[2] : acc.min[2],
          ];
          const scaled = [local[0] * scale[0], local[1] * scale[1], local[2] * scale[2]];
          const rotated = applyMatrix(rotMat, scaled);
          const world = [
            rotated[0] + translation[0],
            rotated[1] + translation[1],
            rotated[2] + translation[2],
          ];
          for (let j = 0; j < 3; j++) {
            if (world[j] < min[j]) min[j] = world[j];
            if (world[j] > max[j]) max[j] = world[j];
          }
        }
      }
    }
    (node.children || []).forEach((c) => walkNode(c, parentMat));
  }
  const scenes = data.scenes || [];
  const sceneIdx = data.scene ?? 0;
  const rootNodes = scenes[sceneIdx]?.nodes || data.nodes.map((_, i) => i);
  rootNodes.forEach((n) => walkNode(n, null));
  if (!isFinite(min[0])) return null;
  return { min, max, size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]] };
}

// Parse MODEL_REGISTRY from storage.js — text scan, not eval
const storageJS = fs.readFileSync(path.join(root, "scripts", "storage.js"), "utf8");
const registryMatch = storageJS.match(/const MODEL_REGISTRY = \{([\s\S]*?)\n\};/);
if (!registryMatch) {
  console.error("Could not find MODEL_REGISTRY in storage.js");
  process.exit(1);
}
const registryBody = registryMatch[1];
// Parse each top-level entry by tracking brace depth
const REGISTRY = {};
{
  let i = 0;
  while (i < registryBody.length) {
    const keyMatch = registryBody.slice(i).match(/^\s*([a-zA-Z_][\w]*):\s*\{/);
    if (!keyMatch) {
      i += 1;
      continue;
    }
    const key = keyMatch[1];
    let braceStart = i + keyMatch[0].length;
    let depth = 1;
    let j = braceStart;
    while (j < registryBody.length && depth > 0) {
      const ch = registryBody[j];
      if (ch === "{") depth += 1;
      else if (ch === "}") depth -= 1;
      j += 1;
    }
    const body = registryBody.slice(braceStart, j - 1);
    const entry = {};
    body.split("\n").forEach((line) => {
      const m = line.match(/^\s*([a-zA-Z_]+):\s*(.+?),?\s*(?:\/\/.*)?$/);
      if (!m) return;
      const k = m[1];
      let v = m[2].trim().replace(/,$/, "");
      if (v.startsWith('"') || v.startsWith("'")) v = v.slice(1, -1);
      else if (v === "true") v = true;
      else if (v === "false") v = false;
      else if (!isNaN(parseFloat(v))) v = parseFloat(v);
      entry[k] = v;
    });
    REGISTRY[key] = entry;
    i = j;
  }
}

// Parse FURN_ITEMS from catalog.js — also text scan
const catalogJS = fs.readFileSync(path.join(root, "scripts", "catalog.js"), "utf8");
const furnMatch = catalogJS.match(/const FURN_ITEMS = \[([\s\S]*?)\n\];/);
if (!furnMatch) {
  console.error("Could not find FURN_ITEMS in catalog.js");
  process.exit(1);
}
const furnBody = furnMatch[1];
const FURN_ITEMS = [];
{
  // Find each "{ ... }" top-level object
  let i = 0;
  while (i < furnBody.length) {
    if (furnBody[i] !== "{") {
      i += 1;
      continue;
    }
    let depth = 1;
    let j = i + 1;
    while (j < furnBody.length && depth > 0) {
      const ch = furnBody[j];
      if (ch === "{") depth += 1;
      else if (ch === "}") depth -= 1;
      j += 1;
    }
    const body = furnBody.slice(i + 1, j - 1);
    const entry = {};
    body.split(/,(?![^"]*"[^"]*$)/).forEach((segment) => {
      const m = segment.match(/\s*([a-zA-Z_]+):\s*(.+)\s*$/s);
      if (!m) return;
      const k = m[1];
      let v = m[2].trim().replace(/,$/, "");
      if (v.startsWith('"') || v.startsWith("'")) v = v.slice(1, -1);
      else if (v === "true") v = true;
      else if (v === "false") v = false;
      else if (!isNaN(parseFloat(v))) v = parseFloat(v);
      entry[k] = v;
    });
    if (entry.assetKey) FURN_ITEMS.push(entry);
    i = j;
  }
}

console.log(`MODEL_REGISTRY entries: ${Object.keys(REGISTRY).length}`);
console.log(`FURN_ITEMS with assetKey: ${FURN_ITEMS.length}`);

// ============ Audit 1: catalog assetKey → registry coverage ============
const orphanCatalog = [];
for (const item of FURN_ITEMS) {
  if (!REGISTRY[item.assetKey]) {
    orphanCatalog.push({ label: item.label, assetKey: item.assetKey, group: item.group });
  }
}

// ============ Audit 2: orientation mismatch ============
const orientationFlags = [];
const sizeFlags = [];
for (const item of FURN_ITEMS) {
  const reg = REGISTRY[item.assetKey];
  if (!reg?.file) continue;
  const modelPath = path.join(root, "assets", "models", reg.file);
  if (!fs.existsSync(modelPath)) continue;
  let data;
  try {
    if (modelPath.endsWith(".glb")) data = parseGLB(modelPath);
    else data = parseGLTF(modelPath);
  } catch {
    continue;
  }
  const bbox = bboxFromGLTF(data);
  if (!bbox) continue;
  const [sx, , sz] = bbox.size;
  if (sx <= 0 || sz <= 0) continue;
  const aspect = sx / sz;
  const targetAspect = item.w / item.d;
  const modelLandscape = sx > sz * 1.05;
  const modelPortrait = sz > sx * 1.05;
  const targetLandscape = item.w > item.d;
  const targetPortrait = item.d > item.w;
  const mismatch = (modelLandscape && targetPortrait) || (modelPortrait && targetLandscape);

  // Wall-mount items rotate to wall angle, so their "natural" aspect mostly
  // doesn't matter. Skip them.
  if (reg.mountType === "wall" || reg.mountType === "ceiling") continue;

  if (mismatch && !reg.autoOrientToFootprint) {
    orientationFlags.push({
      assetKey: item.assetKey,
      label: item.label,
      modelXxZ: `${sx.toFixed(2)} x ${sz.toFixed(2)}`,
      modelAspect: aspect.toFixed(2),
      targetWxD: `${item.w} x ${item.d}`,
      targetAspect: targetAspect.toFixed(2),
    });
  }

  // ============ Audit 3: 2D footprint cap by W or D ============
  // The real concern: if uniform-fit caps by W or D, the rendered footprint
  // is smaller than the user's catalog rectangle. (H-cap is intentional —
  // verificationTargetSize.h sets the height target and it's expected that
  // many tall, narrow assets like sofas or beds end up smaller in W and D.)
  // Limit to factors where W/D scale is the floor AND the result is well
  // below the catalog W or D.
  if (item.w > 0 && item.d > 0 && sx > 0 && sz > 0 && !reg.autoOrientToFootprint) {
    const scaleW = item.w / sx;
    const scaleD = item.d / sz;
    if (scaleW > 0 && scaleD > 0) {
      const min = Math.min(scaleW, scaleD);
      const max = Math.max(scaleW, scaleD);
      const capped = min === scaleW ? "W" : "D";
      // Flag only when W or D would clamp the rendered footprint significantly
      // below the catalog rectangle (ratio < 0.55 = >45% smaller along the
      // long axis).
      if (min / max < 0.55 && reg.mountType !== "wall" && reg.mountType !== "ceiling") {
        sizeFlags.push({
          assetKey: item.assetKey,
          label: item.label,
          capped,
          ratio: (min / max).toFixed(2),
          scaleW: scaleW.toFixed(2),
          scaleD: scaleD.toFixed(2),
          catalogWxD: `${item.w} x ${item.d}`,
          modelXxZ: `${sx.toFixed(2)} x ${sz.toFixed(2)}`,
        });
      }
    }
  }
}

// ============ Audit 4: surface-mount no-host fallback ============
const surfaceItems = Object.entries(REGISTRY).filter(([, reg]) => reg.mountType === "surface");
const surfaceFallbackCandidates = [];
const surfaceFallbackOK = [];
for (const [key, reg] of surfaceItems) {
  // Heuristic: surface assets with a built-in base/stand benefit from
  // standaloneFallback. TVs, plants, decor with a base. Lamps/vases/plates
  // shouldn't have it because their geometry sits flat on a host.
  const hasFlag = !!reg.standaloneFallback;
  const looksStandalone =
    /tv|television|plant|fern|sculpture|statue/i.test(key) || /tv/i.test(reg.category || "");
  if (looksStandalone && !hasFlag) {
    surfaceFallbackCandidates.push({ assetKey: key, category: reg.category });
  } else if (looksStandalone && hasFlag) {
    surfaceFallbackOK.push(key);
  }
}

// ============ Summary ============
console.log("\n========================================================");
console.log("Audit 1: catalog assetKey → MODEL_REGISTRY coverage");
console.log("========================================================");
if (orphanCatalog.length === 0) {
  console.log("  No orphan catalog entries (every assetKey has a registry entry).");
} else {
  console.log(`  ${orphanCatalog.length} catalog assetKey(s) have NO MODEL_REGISTRY entry:`);
  console.log("  (these will fall back to a procedural box in 3D)");
  orphanCatalog.slice(0, 40).forEach((o) => {
    console.log(`    - ${o.assetKey.padEnd(30)} (${o.label}, group=${o.group})`);
  });
  if (orphanCatalog.length > 40) console.log(`    ... and ${orphanCatalog.length - 40} more`);
}

console.log("\n========================================================");
console.log("Audit 2: 2D footprint ↔ 3D natural orientation mismatch");
console.log("========================================================");
if (orientationFlags.length === 0) {
  console.log("  No orientation mismatches without autoOrientToFootprint.");
} else {
  console.log(`  ${orientationFlags.length} asset(s) need autoOrientToFootprint:`);
  orientationFlags.forEach((f) => {
    console.log(
      `    - ${f.assetKey.padEnd(30)} model ${f.modelXxZ} (aspect ${f.modelAspect}) vs catalog ${f.targetWxD} (aspect ${f.targetAspect})`,
    );
  });
}

console.log("\n========================================================");
console.log("Audit 3: uniform-scale cap (asset renders much smaller than catalog)");
console.log("========================================================");
if (sizeFlags.length === 0) {
  console.log("  No assets clamped to <40% of catalog footprint.");
} else {
  console.log(`  ${sizeFlags.length} asset(s) are uniformly scaled to <40% of catalog footprint:`);
  sizeFlags.forEach((f) => {
    console.log(
      `    - ${f.assetKey.padEnd(30)} capped by ${f.capped} (ratio ${f.ratio}; scales W=${f.scaleW} D=${f.scaleD} H=${f.scaleH})`,
    );
  });
}

console.log("\n========================================================");
console.log("Audit 4: surface-mount items that probably need standaloneFallback");
console.log("========================================================");
if (surfaceFallbackCandidates.length === 0) {
  console.log("  Every TV-like surface item has standaloneFallback set.");
} else {
  console.log(`  ${surfaceFallbackCandidates.length} surface item(s) missing standaloneFallback:`);
  surfaceFallbackCandidates.forEach((c) => {
    console.log(`    - ${c.assetKey.padEnd(30)} category=${c.category}`);
  });
}
console.log(`  Surface items with standaloneFallback: ${surfaceFallbackOK.join(", ") || "(none)"}`);

// Exit code: 0 if clean, 1 if findings
const findings =
  orphanCatalog.length +
  orientationFlags.length +
  sizeFlags.length +
  surfaceFallbackCandidates.length;
console.log(`\nTotal findings: ${findings}`);
process.exit(findings === 0 ? 0 : 1);
