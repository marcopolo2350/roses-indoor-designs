import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const plannerSource = readFileSync(path.join(root, "scripts", "planner2d.js"), "utf8");
const referenceSource = readFileSync(
  path.join(root, "scripts", "planner2d", "reference-overlay.js"),
  "utf8",
);
const mainSource = readFileSync(path.join(root, "scripts", "main.js"), "utf8");
const errors = [];

function expect(label, condition) {
  if (!condition) errors.push(label);
}

globalThis.window = globalThis;
globalThis.curRoom = null;

await import("../planner2d/reference-overlay.js");

const reference = window.Planner2DReferenceOverlay;
const requiredFunctions = [
  "roomReference",
  "roomReferenceVisible",
  "roomReferenceWorldSize",
  "roomReferenceBounds",
  "referencePointToWorld",
  "referenceWorldToLocal",
  "referenceDisplayLabel",
];

expect("Planner2DReferenceOverlay bridge must be registered", Boolean(reference));
for (const name of requiredFunctions) {
  expect(
    `reference-overlay.js must define ${name}()`,
    new RegExp(`function\\s+${name}\\s*\\(`).test(referenceSource),
  );
  expect(
    `planner2d.js must not define ${name}()`,
    !new RegExp(`function\\s+${name}\\s*\\(`).test(plannerSource),
  );
  expect(`Planner2DReferenceOverlay must expose ${name}`, typeof reference?.[name] === "function");
}

const ref = {
  src: "data:image/png;base64,AA==",
  sourceType: "pdf",
  pdfPage: 2,
  pdfPageCount: 4,
  visible: true,
  locked: false,
  centerX: 10,
  centerY: 20,
  baseWidth: 8,
  scale: 1.5,
  naturalWidth: 400,
  naturalHeight: 200,
};
const room = { referenceOverlay: ref };

expect("roomReference should return room reference overlay", reference.roomReference(room) === ref);
expect("visible reference should be true", reference.roomReferenceVisible(room) === true);

const size = reference.roomReferenceWorldSize(ref);
expect("reference width should honor base width and scale", size.width === 12);
expect("reference height should honor source aspect ratio", size.height === 6);

const bounds = reference.roomReferenceBounds(ref);
expect("reference bounds should center on centerX", bounds.x0 === 4 && bounds.x1 === 16);
expect("reference bounds should center on centerY", bounds.y0 === 17 && bounds.y1 === 23);

const world = reference.referencePointToWorld({ u: 0.25, v: 0.5 }, ref);
expect("local reference point should map to world x", world.x === 7);
expect("local reference point should map to world y", world.y === 20);

const local = reference.referenceWorldToLocal({ x: 13, y: 21.5 }, ref);
expect("world reference point should map to local u", local.u === 0.75);
expect("world reference point should map to local v", local.v === 0.75);
expect(
  "world point outside the reference should miss",
  reference.referenceWorldToLocal({ x: 40, y: 40 }, ref) === null,
);

expect(
  "display label should include pdf page count",
  reference.referenceDisplayLabel(ref).includes("page 2/4"),
);
expect(
  "calibration label should guide first point",
  reference.referenceDisplayLabel({
    src: "x",
    calibrationActive: true,
    calibrationPoints: [],
  }) === "Tap the first known point",
);

const order = [...mainSource.matchAll(/["'](\.\/scripts\/[^"']+)["']/g)].map((match) => match[1]);
const referenceIndex = order.indexOf("./scripts/planner2d/reference-overlay.js");
const plannerIndex = order.indexOf("./scripts/planner2d.js");
expect("runtime modules must include planner2d/reference-overlay.js", referenceIndex >= 0);
expect("runtime modules must include planner2d.js", plannerIndex >= 0);
expect(
  "planner2d/reference-overlay.js must load before planner2d.js",
  referenceIndex >= 0 && plannerIndex >= 0 && referenceIndex < plannerIndex,
);
expect(
  "reference boundary should register window.Planner2DReferenceOverlay",
  /window\.Planner2DReferenceOverlay\s*=\s*Object\.freeze/.test(referenceSource),
);

if (errors.length) {
  console.error("Reference overlay validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Reference overlay validation passed.");
