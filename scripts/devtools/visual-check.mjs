// Headless visual smoke for the flat-screen TV + wall-mount work.
//
// Boots the app, drops a controlled scene (TV on console, TV without a host,
// wall art on each of the 4 walls), enters 3D, and writes screenshots to
// output/visual-check/. Use this any time the GLB-driven assets need a real
// "look at it with your eyes" verification pass.
//
// Usage: node scripts/devtools/visual-check.mjs
import { chromium } from "playwright";
import { startStaticServer } from "./static-server.mjs";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "output", "visual-check");
fs.mkdirSync(outDir, { recursive: true });

const server = await startStaticServer(root);
const url = `http://127.0.0.1:${server.port}/index.html`;
console.log("Static server:", url);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const page = await ctx.newPage();
page.on("pageerror", (err) => console.error("[pageerror]", err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") console.error("[console]", msg.text());
});

await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForSelector('body[data-runtime-ready="1"]');

// Step through welcome → create-room flow
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

// Drop the test scene
const placed = await page.evaluate(() => {
  const room = window.appState.getCurrentRoom();
  const xs = room.polygon.map((p) => p.x);
  const zs = room.polygon.map((p) => p.y);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minZ = Math.min(...zs),
    maxZ = Math.max(...zs);
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;

  room.furniture.length = 0;

  // TV console + TV stacked on it (auto-snap test)
  room.furniture.push({
    id: "console-a",
    label: "TV Console",
    assetKey: "tv_console",
    w: 5,
    d: 1.4,
    x: cx - 4,
    z: minZ + 1.0,
    rotation: 0,
    mountType: "floor",
  });
  room.furniture.push({
    id: "tv-on-console",
    label: "Flat-Screen TV",
    assetKey: "kn_tv_modern",
    w: 4.5,
    d: 0.85,
    x: cx - 4,
    z: minZ + 1.0,
    rotation: 0,
    mountType: "surface",
  });

  // TV far from any host (standaloneFallback test — must land on the floor)
  room.furniture.push({
    id: "tv-no-host",
    label: "Flat-Screen TV (no host)",
    assetKey: "kn_tv_modern",
    w: 4.5,
    d: 0.85,
    x: cx + 4,
    z: minZ + 1.0,
    rotation: 0,
    mountType: "surface",
  });

  // Wall art on each of the 4 walls (face_interior orientation test)
  const wa = (id, x, z) =>
    room.furniture.push({
      id,
      label: id,
      assetKey: "wall_art_01",
      w: 2.4,
      d: 0.15,
      x,
      z,
      rotation: 0,
      mountType: "wall",
    });
  wa("wa-north", cx, minZ + 0.05);
  wa("wa-south", cx, maxZ - 0.05);
  wa("wa-west", minX + 0.05, cz);
  wa("wa-east", maxX - 0.05, cz);

  // Floor lamp next to the standalone TV — verify it stands at proper height.
  room.furniture.push({
    id: "floor-lamp",
    label: "Floor Lamp",
    assetKey: "lamp_floor",
    w: 1.2,
    d: 1.3,
    x: cx + 6,
    z: minZ + 1.5,
    rotation: 0,
    mountType: "floor",
  });

  window.draw?.();
  return { placed: room.furniture.length, bounds: { minX, maxX, minZ, maxZ } };
});
console.log("Placed:", JSON.stringify(placed, null, 2));

// 2D plan
await page.screenshot({ path: path.join(outDir, "01-plan.png") });
console.log("Saved 01-plan.png");

// Enter 3D, give GLBs time to load
await page.evaluate(() => window.toggle3D?.());
await page.waitForTimeout(6000);

async function shot(name) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
  console.log(`Saved ${name}.png`);
}

await shot("02-3d-default");

// Cycle through the in-app view presets — drives the camera through angles
// that show each wall, not just the one the rebuild picked.
async function setView(name) {
  await page.evaluate((v) => {
    if (typeof window.setViewPreset === "function") window.setViewPreset(v);
  }, name);
  await page.waitForTimeout(1500);
}

await setView("overview");
await shot("03-overview");
await setView("eye");
await shot("04-eye");
await setView("corner");
await shot("05-corner-1");

await browser.close();
await server.close();
console.log("Done. Output in", outDir);
