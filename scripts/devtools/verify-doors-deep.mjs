// Deeper visual check: add 4 doors with every swing×hinge combination
// to one wall and see which (if any) render as closed.
import { chromium } from "playwright";
import { startStaticServer } from "./static-server.mjs";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "output", "verify-doors-deep");
fs.mkdirSync(outDir, { recursive: true });

const server = await startStaticServer(root);
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.error("[pageerror]", e.message));

await page.goto(`http://127.0.0.1:${server.port}/index.html`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('body[data-runtime-ready="1"]');
await page.locator(".w-btn").click();
await page.locator('[data-action="open-create-room"]').first().click();
await page.locator('[data-action="select-create-room-preset"]').first().click();
await page.locator('[data-action="create-room-from-preset"]').click();
await page.waitForSelector("#scrEd.on");
await page.evaluate(() => {
  // eslint-disable-next-line no-undef
  if (typeof endTut === "function") endTut();
});
await page.waitForTimeout(400);

await page.evaluate(() => {
  const room = window.appState.getCurrentRoom();
  // Make the room wider so 4 doors fit.
  room.polygon = [
    { x: 0, y: 0 },
    { x: 30, y: 0 },
    { x: 30, y: 14 },
    { x: 0, y: 14 },
  ];
  if (window.genWalls) room.walls = window.genWalls(room);
  room.openings = [];
  // South wall is index 2 (y=14 → y=14 across).
  const southWall = room.walls.find((w) => {
    const a = room.polygon[w.startIdx],
      b = room.polygon[w.endIdx];
    return a.y > 7 && b.y > 7;
  });
  const cases = [
    { swing: "in", hinge: "left", offset: 4 },
    { swing: "in", hinge: "right", offset: 11 },
    { swing: "out", hinge: "left", offset: 18 },
    { swing: "out", hinge: "right", offset: 26 },
  ];
  cases.forEach((c, i) => {
    room.openings.push({
      id: `door-${i}`,
      wallId: southWall.id,
      type: "door",
      offset: c.offset,
      width: 3,
      height: 7,
      swing: c.swing,
      hinge: c.hinge,
    });
  });
  window.draw?.();
  return cases.map((c, i) => ({ idx: i, ...c }));
});

await page.screenshot({ path: path.join(outDir, "01-plan.png") });

await page.evaluate(() => window.toggle3D?.());
await page.waitForTimeout(6000);
await page.screenshot({ path: path.join(outDir, "02-3d-default.png") });

// Use the Corner preset for a closer look at the wall
await page.evaluate(() => {
  if (typeof window.setViewPreset === "function") window.setViewPreset("corner");
});
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(outDir, "03-3d-corner.png") });

await page.evaluate(() => {
  if (typeof window.setViewPreset === "function") window.setViewPreset("eye");
});
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(outDir, "04-3d-eye.png") });

await browser.close();
await server.close();
console.log("Output in", outDir);
