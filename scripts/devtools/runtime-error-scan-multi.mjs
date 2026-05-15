// Wider sweep: multi-room layout + multi-floor + time-of-day + design preset
// + walk + minimap. Collects every runtime error and failed network request.
import { chromium } from "playwright";
import { startStaticServer } from "./static-server.mjs";

const root = process.cwd();
const server = await startStaticServer(root);
const url = `http://127.0.0.1:${server.port}/index.html`;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

const errors = [];
const pageErrors = [];
const failedRequests = [];

page.on("pageerror", (err) => pageErrors.push(err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("response", (resp) => {
  if (resp.status() >= 400 && resp.status() < 600 && !/favicon|sourcemap/.test(resp.url())) {
    failedRequests.push(`${resp.url()} HTTP ${resp.status()}`);
  }
});

await page.goto(url, { waitUntil: "domcontentloaded" });
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

console.log("== Add a second adjacent room ==");
await page.evaluate(() => {
  if (typeof window.attachAdjacentRoom === "function") window.attachAdjacentRoom("east");
});
await page.waitForTimeout(800);

console.log("== Enter 3D and cycle time-of-day ==");
await page.evaluate(() => window.toggle3D?.());
await page.waitForTimeout(5000);
for (const preset of ["dawn", "noon", "golden", "dusk", "night"]) {
  await page.evaluate((p) => {
    if (typeof window.setTimeOfDay === "function") window.setTimeOfDay(p);
  }, preset);
  await page.waitForTimeout(900);
}

console.log("== Apply each lighting preset via setLightingPreset ==");
for (const lp of ["daylight", "warm_evening", "soft_lamp_glow", "moody", "bright_studio"]) {
  await page.evaluate((id) => {
    // eslint-disable-next-line no-undef
    if (typeof setLightingPreset === "function") setLightingPreset(id);
  }, lp);
  await page.waitForTimeout(900);
}

console.log("== View presets cycle ==");
for (const view of ["overview", "eye", "corner", "hero", "orbit"]) {
  await page.evaluate((v) => {
    if (typeof window.setViewPreset === "function") window.setViewPreset(v);
  }, view);
  await page.waitForTimeout(900);
}

console.log("== Back to 2D, save, reload ==");
await page.evaluate(() => window.toggle3D?.());
await page.waitForTimeout(800);
await page.evaluate(() => window.saveAll?.());
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector('body[data-runtime-ready="1"]');
await page.waitForTimeout(800);

console.log("\npageerrors:", pageErrors.length);
pageErrors.forEach((e) => console.log("  PAGEERROR:", e));
console.log("console.error:", errors.length);
errors.forEach((e) => console.log("  ERROR:", e));
console.log("failed requests:", failedRequests.length);
failedRequests.forEach((e) => console.log("  FAIL:", e));

await browser.close();
await server.close();
process.exit(pageErrors.length + errors.length + failedRequests.length === 0 ? 0 : 1);
