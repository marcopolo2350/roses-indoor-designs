import { chromium } from "playwright";
import { startStaticServer } from "./static-server.mjs";

const root = process.cwd();
const server = await startStaticServer(root);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
});
page.on("pageerror", (error) => errors.push(`page: ${error.message}`));

await page.goto(`${server.url}/index.html#selftest`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => !!window.__lastSelfTest, null, { timeout: 120000 });

const summary = await page.evaluate(() => window.__lastSelfTest);
await browser.close();
await server.close();

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

if (!summary || (summary.failed && summary.failed.length)) {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(summary, null, 2));
