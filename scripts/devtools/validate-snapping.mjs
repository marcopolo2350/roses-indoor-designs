import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const plannerSource = readFileSync(path.join(root, "scripts", "planner2d.js"), "utf8");
const snappingSource = readFileSync(path.join(root, "scripts", "planner2d", "snapping.js"), "utf8");
const mainSource = readFileSync(path.join(root, "scripts", "main.js"), "utf8");
const errors = [];

function expect(label, condition) {
  if (!condition) errors.push(label);
}

function closestPointOnSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const denom = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / denom));
  const x = a.x + dx * t;
  const y = a.y + dy * t;
  return { x, y, t, distance: Math.hypot(point.x - x, point.y - y) };
}

globalThis.window = globalThis;
globalThis.MODEL_REGISTRY = {
  floor_item: { mountType: "floor" },
  window_art: { mountType: "wall", snapToOpening: true },
  wall_art: { mountType: "wall" },
};
globalThis.closestPointOnSegment = closestPointOnSegment;
globalThis.curRoom = null;
globalThis.findNearestWindowOpening = null;
globalThis.snapFurniturePoint = (x, z) => ({ x, z });
globalThis.wS = (room, wall) => room.polygon[wall.startIdx];
globalThis.wE = (room, wall) => room.polygon[wall.endIdx];
globalThis.wL = (room, wall) => {
  const a = globalThis.wS(room, wall);
  const b = globalThis.wE(room, wall);
  return Math.hypot(b.x - a.x, b.y - a.y);
};
globalThis.wA = (room, wall) => {
  const a = globalThis.wS(room, wall);
  const b = globalThis.wE(room, wall);
  return Math.atan2(b.y - a.y, b.x - a.x);
};

await import("../planner2d/snapping.js");

const snapping = window.Planner2DSnapping;
const requiredFunctions = [
  "isWallMountedFurnitureItem",
  "wallSnapForFurniture",
  "snapFurnitureForItem",
];

expect("Planner2DSnapping bridge must be registered", Boolean(snapping));
for (const name of requiredFunctions) {
  expect(
    `snapping.js must define ${name}()`,
    new RegExp(`function\\s+${name}\\s*\\(`).test(snappingSource),
  );
  expect(
    `planner2d.js must not define ${name}()`,
    !new RegExp(`function\\s+${name}\\s*\\(`).test(plannerSource),
  );
  expect(`Planner2DSnapping must expose ${name}`, typeof snapping?.[name] === "function");
}

const northWall = { id: "north", startIdx: 0, endIdx: 1 };
const room = {
  polygon: [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 8 },
    { x: 0, y: 8 },
  ],
  walls: [northWall, { id: "east", startIdx: 1, endIdx: 2 }],
};

expect(
  "wall-mounted item should be detected from manifest registration",
  snapping.isWallMountedFurnitureItem({ assetKey: "wall_art" }) === true,
);
expect(
  "floor item should not be wall-mounted",
  snapping.isWallMountedFurnitureItem({ assetKey: "floor_item" }) === false,
);

const wallSnap = snapping.wallSnapForFurniture(
  { assetKey: "wall_art", w: 2 },
  { x: 4.2, z: 0.4 },
  room,
);
expect("wall snap should be valid", wallSnap?.valid === true);
expect("wall snap should choose the closest wall", wallSnap?.idx === 0);
expect("wall snap should align x to half-foot grid", wallSnap?.snapped?.x === 4);
expect("wall snap should sit on the wall line", wallSnap?.snapped?.z === 0);
expect("wall snap should preserve wall angle", wallSnap?.angle === 0);

const furnitureSnap = snapping.snapFurnitureForItem({ assetKey: "wall_art", w: 2 }, 7.2, 0.3, room);
expect(
  "snapFurnitureForItem should include wallSnap metadata",
  furnitureSnap?.wallSnap?.valid === true,
);
expect("snapFurnitureForItem should return wall-snapped z", furnitureSnap?.z === 0);

const floorSnap = snapping.snapFurnitureForItem({ assetKey: "floor_item" }, 3.2, 4.7, room);
expect("floor item should use base furniture snap x", floorSnap.x === 3.2);
expect("floor item should use base furniture snap z", floorSnap.z === 4.7);

globalThis.findNearestWindowOpening = () => ({
  wall: northWall,
  opening: { offset: 6 },
});
const openingSnap = snapping.snapFurnitureForItem({ assetKey: "window_art", w: 1.5 }, 1, 1, room);
expect("opening snap should use opening offset", openingSnap.x === 6 && openingSnap.z === 0);
expect(
  "opening snap should retain window target metadata",
  Boolean(openingSnap.wallSnap?.windowTarget),
);

const order = [...mainSource.matchAll(/["'](\.\/scripts\/[^"']+)["']/g)].map((match) => match[1]);
const snappingIndex = order.indexOf("./scripts/planner2d/snapping.js");
const plannerIndex = order.indexOf("./scripts/planner2d.js");
expect("runtime modules must include planner2d/snapping.js", snappingIndex >= 0);
expect("runtime modules must include planner2d.js", plannerIndex >= 0);
expect(
  "planner2d/snapping.js must load before planner2d.js",
  snappingIndex >= 0 && plannerIndex >= 0 && snappingIndex < plannerIndex,
);
expect(
  "snapping boundary should register window.Planner2DSnapping",
  /window\.Planner2DSnapping\s*=\s*Object\.freeze/.test(snappingSource),
);

if (errors.length) {
  console.error("Planner snapping validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Planner snapping validation passed.");
