// Headless visual check for doors. Adds a door to the south wall and renders
// the room in 3D so we can confirm the door leaf is at 90° (open) and the
// doorway is a clear opening.
import { chromium } from "playwright";
import { startStaticServer } from "./static-server.mjs";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "output", "verify-doors");
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
  // Find the south wall (highest average y across its two endpoints).
  const walls = room.walls;
  const southWall = walls.reduce((best, wall) => {
    const wallY = (room.polygon[wall.startIdx].y + room.polygon[wall.endIdx].y) / 2;
    if (!best) return wall;
    const bestY = (room.polygon[best.startIdx].y + room.polygon[best.endIdx].y) / 2;
    return wallY > bestY ? wall : best;
  }, null);
  const wallLength = window.wL(room, southWall);
  room.openings = room.openings || [];
  room.openings.push({
    id: "test-door-1",
    wallId: southWall.id,
    type: "door",
    offset: wallLength / 2,
    width: 3,
    height: 7,
    swing: "in",
    hinge: "left",
  });
  window.draw?.();
  return { wallId: southWall.id, wallLength };
});

await page.screenshot({ path: path.join(outDir, "01-plan-with-door.png") });

await page.evaluate(() => window.toggle3D?.());
await page.waitForTimeout(6000);
await page.screenshot({ path: path.join(outDir, "02-3d-with-door.png") });

// Pose the camera close to the doorway so the leaf is visible.
await page.evaluate(() => {
  if (typeof window.setViewPreset === "function") window.setViewPreset("corner");
});
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(outDir, "03-corner-with-door.png") });

await browser.close();
await server.close();
console.log("Output in", outDir);
