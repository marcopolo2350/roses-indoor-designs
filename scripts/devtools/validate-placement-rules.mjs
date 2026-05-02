import { readFileSync } from "node:fs";
import path from "node:path";

globalThis.window = globalThis;

await import("../catalog/placement-rules.js");

const root = process.cwd();
const errors = [];
const rules = window.CatalogPlacementRules;

function expect(label, condition) {
  if (!condition) errors.push(label);
}

expect("CatalogPlacementRules bridge must be registered", Boolean(rules));
expect(
  "wall art should default to art hanging height",
  rules.defaultElevation({ mountType: "wall", assetKey: "wall_art_01" }) === 5.2,
);
expect(
  "wall sconce should default above eye height",
  rules.defaultElevation({ mountType: "wall", assetKey: "lamp_wall" }) === 5.8,
);
expect(
  "bath towel bars should default below art height",
  rules.defaultElevation({ mountType: "wall", assetKey: "bathroom_towel_bar" }) === 4.2,
);
expect(
  "ceiling lights should track room height",
  rules.defaultElevation({ mountType: "ceiling", assetKey: "lamp_ceiling", roomHeight: 10 }) ===
    9.45,
);
expect(
  "pendants should hang lower than flush ceiling lights",
  rules.defaultElevation({ mountType: "ceiling", assetKey: "lamp_pendant", roomHeight: 10 }) ===
    9.4,
);
expect(
  "surface pieces should default to tabletop height",
  rules.defaultElevation({ mountType: "surface", assetKey: "lamp_table" }) === 2.8,
);
expect(
  "floor pieces should stay on the floor",
  rules.defaultElevation({ mountType: "floor", assetKey: "sofa" }) === 0,
);

const stateSource = readFileSync(path.join(root, "scripts", "state.js"), "utf8");
const defaultElevationBlock =
  stateSource.match(/function\s+defaultElevation\s*\([\s\S]*?\n}\nfunction\s+axisYawOffset/)?.[0] ||
  "";
expect(
  "state defaultElevation should delegate to catalog placement rules",
  /CatalogPlacementRules\.defaultElevation/.test(defaultElevationBlock),
);
expect(
  "state defaultElevation should not hard-code wall art keys",
  !/wall_art_0[146]/.test(defaultElevationBlock),
);
expect(
  "state defaultElevation should not hard-code mirror/sconce keys",
  !/(lamp_wall|mirror|curtains|shelving|plant_small)/.test(defaultElevationBlock),
);

if (errors.length) {
  console.error("Placement-rule validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Placement-rule validation passed.");
