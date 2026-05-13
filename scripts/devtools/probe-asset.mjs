// One-shot: load a GLB through Three.js + GLTFLoader (via the live app) and
// report its actual bbox so we can sanity-check the qa-audit parser.
// Usage: node scripts/devtools/probe-asset.mjs <assetKey> [<assetKey>...]
import { chromium } from "playwright";
import { startStaticServer } from "./static-server.mjs";

const keys = process.argv.slice(2);
if (keys.length === 0) {
  console.error("Usage: node scripts/devtools/probe-asset.mjs <assetKey> [...]");
  process.exit(2);
}

const server = await startStaticServer(process.cwd());
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("[pageerror]", e.message));

await page.goto(`http://127.0.0.1:${server.port}/index.html`, {
  waitUntil: "domcontentloaded",
});
await page.waitForSelector('body[data-runtime-ready="1"]');
await page.waitForTimeout(500);

const results = await page.evaluate(async (assetKeys) => {
  // Use the existing loadModelAsset to fetch + parse the GLBs, then measure
  // each scene's natural bbox before any catalog-time scaling.
  const out = {};
  for (const key of assetKeys) {
    try {
      const model = await window.loadModelAsset(key);
      if (!model) {
        out[key] = { error: "load returned null" };
        continue;
      }
      const box = new window.THREE.Box3().setFromObject(model);
      const size = new window.THREE.Vector3();
      box.getSize(size);
      out[key] = {
        x: +size.x.toFixed(3),
        y: +size.y.toFixed(3),
        z: +size.z.toFixed(3),
      };
    } catch (e) {
      out[key] = { error: e.message };
    }
  }
  return out;
}, keys);

console.log(JSON.stringify(results, null, 2));

await browser.close();
await server.close();
