// Boot the app, run through the key flows (create room → furnish → 3D
// → walk → minimap → save/load), and report every console error/warning,
// pageerror, and failed network request. Used as a "things that secretly
// break at runtime" sweep before pushing.
import { chromium } from "playwright";
import { startStaticServer } from "./static-server.mjs";

const root = process.cwd();
const server = await startStaticServer(root);
const url = `http://127.0.0.1:${server.port}/index.html`;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

const errors = [];
const warnings = [];
const pageErrors = [];
const failedRequests = [];

page.on("pageerror", (err) => pageErrors.push(err.message));
page.on("console", (msg) => {
  const type = msg.type();
  const text = msg.text();
  if (type === "error") errors.push(text);
  else if (type === "warning" || type === "warn") warnings.push(text);
});
page.on("requestfailed", (req) => {
  // Ignore the harmless missing favicons / dev tools.
  if (/favicon|sourcemap/.test(req.url())) return;
  failedRequests.push(`${req.url()}: ${req.failure()?.errorText || "unknown"}`);
});
page.on("response", (resp) => {
  if (resp.status() >= 400 && resp.status() < 600) {
    if (/favicon|sourcemap/.test(resp.url())) return;
    failedRequests.push(`${resp.url()} HTTP ${resp.status()}`);
  }
});

console.log("== STEP 1: Boot ==");
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForSelector('body[data-runtime-ready="1"]');
console.log("App ready");

console.log("== STEP 2: Dismiss welcome + create Living Room ==");
await page.locator(".w-btn").click();
await page.locator('[data-action="open-create-room"]').first().click();
await page.locator('[data-action="select-create-room-preset"]').first().click();
await page.locator('[data-action="create-room-from-preset"]').click();
await page.waitForSelector("#scrEd.on");
await page.evaluate(() => {
  // eslint-disable-next-line no-undef
  if (typeof endTut === "function") endTut();
});
await page.waitForTimeout(600);

console.log("== STEP 3: Inject test scene (TV, sofas, stairs, door) ==");
await page.evaluate(() => {
  const room = window.appState.getCurrentRoom();
  room.polygon = [
    { x: 0, y: 0 },
    { x: 24, y: 0 },
    { x: 24, y: 18 },
    { x: 0, y: 18 },
  ];
  if (window.genWalls) room.walls = window.genWalls(room);
  room.furniture.length = 0;
  // TV console + TV
  room.furniture.push({
    id: "c1",
    label: "TV Console",
    assetKey: "tv_console",
    w: 5,
    d: 1.4,
    x: 12,
    z: 1.5,
    rotation: 0,
    mountType: "floor",
  });
  room.furniture.push({
    id: "tv1",
    label: "Flat-Screen TV",
    assetKey: "kn_tv_modern",
    w: 4.5,
    d: 0.85,
    x: 12,
    z: 1.5,
    rotation: 0,
    mountType: "surface",
  });
  room.furniture.push({
    id: "sf1",
    label: "Sofa Medium",
    assetKey: "sofa_modern",
    w: 5.2,
    d: 2.55,
    x: 12,
    z: 16,
    rotation: 180,
    mountType: "floor",
  });
  // Floor lamp
  room.furniture.push({
    id: "fl",
    label: "Floor Lamp",
    assetKey: "lamp_floor",
    w: 1.2,
    d: 1.3,
    x: 4,
    z: 14,
    rotation: 0,
    mountType: "floor",
  });
  // Round rug
  room.furniture.push({
    id: "rg",
    label: "Round Rug",
    assetKey: "rug_round",
    w: 4.2,
    d: 4.2,
    x: 12,
    z: 9,
    rotation: 0,
    mountType: "floor",
  });
  // Wall art on each wall
  ["north", "south", "west", "east"].forEach((side, i) => {
    const pos = {
      north: { x: 6, z: 0.05 },
      south: { x: 18, z: 17.95 },
      west: { x: 0.05, z: 9 },
      east: { x: 23.95, z: 9 },
    }[side];
    room.furniture.push({
      id: `wa-${i}`,
      label: `Wall Art ${side}`,
      assetKey: "wall_art_01",
      w: 2.4,
      d: 0.15,
      x: pos.x,
      z: pos.z,
      rotation: 0,
      mountType: "wall",
    });
  });
  // Add a door to the south wall
  const southWall = room.walls.find((w) => {
    const a = room.polygon[w.startIdx],
      b = room.polygon[w.endIdx];
    return a.y > 9 && b.y > 9;
  });
  if (southWall) {
    room.openings = room.openings || [];
    room.openings.push({
      id: "d1",
      wallId: southWall.id,
      type: "door",
      offset: window.wL(room, southWall) / 2,
      width: 3,
      height: 7,
      swing: "in",
      hinge: "left",
    });
  }
  // Add stairs
  room.structures = room.structures || [];
  room.structures.push({
    id: "st1",
    type: "stairs",
    rect: { x: 19, y: 3, w: 4, h: 8 },
    height: room.height,
    riseHeight: room.height,
    direction: "up",
    linkedFloorId: "",
  });
  window.draw?.();
});

console.log("== STEP 4: Enter 3D ==");
await page.evaluate(() => window.toggle3D?.());
await page.waitForTimeout(6000);

console.log("== STEP 5: Cycle view presets ==");
for (const view of ["overview", "eye", "corner", "hero"]) {
  await page.evaluate((v) => {
    if (typeof window.setViewPreset === "function") window.setViewPreset(v);
  }, view);
  await page.waitForTimeout(1500);
}

console.log("== STEP 6: Enter walk mode and move ==");
await page.evaluate(() => {
  // Set walk mode via the existing toggle / cam mode setter
  if (typeof window.setCamMode === "function") window.setCamMode("walk");
});
await page.waitForTimeout(1500);

console.log("== STEP 7: Exit 3D ==");
await page.evaluate(() => window.toggle3D?.());
await page.waitForTimeout(800);

console.log("== STEP 8: Reshape room (drag a vertex inward) ==");
await page.evaluate(() => {
  const room = window.appState.getCurrentRoom();
  if (room?.polygon?.length >= 2) room.polygon[1].x -= 4;
  if (window.genWalls) room.walls = window.genWalls(room);
  if (typeof window.reSnapWallFurniture === "function") window.reSnapWallFurniture(room);
  window.draw?.();
});
await page.waitForTimeout(400);

console.log("== STEP 9: Save and reload via IndexedDB ==");
await page.evaluate(() => window.saveAll?.());
await page.waitForTimeout(500);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector('body[data-runtime-ready="1"]');
await page.waitForTimeout(800);

console.log("\n========== RESULTS ==========");
console.log(`pageerrors: ${pageErrors.length}`);
pageErrors.forEach((e) => console.log("  PAGEERROR:", e));
console.log(`console.error: ${errors.length}`);
errors.slice(0, 20).forEach((e) => console.log("  ERROR:", e));
console.log(`console.warn: ${warnings.length}`);
warnings.slice(0, 20).forEach((e) => console.log("  WARN:", e));
console.log(`failed requests: ${failedRequests.length}`);
failedRequests.slice(0, 20).forEach((e) => console.log("  FAIL:", e));

await browser.close();
await server.close();

const totalBad = pageErrors.length + errors.length + failedRequests.length;
process.exit(totalBad === 0 ? 0 : 1);
