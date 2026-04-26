import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(repoRoot, 'data', 'asset-manifest.json');
const outDir = path.join(repoRoot, 'assets', 'thumbnails');
const thumbgenUrl = process.env.THUMBGEN_URL || 'http://127.0.0.1:8123/scripts/thumbgen.html';

const categoryFixes = {
  bookshelf: 'Storage',
};

function withThumbnailPath(entry) {
  return {
    ...entry,
    category: categoryFixes[entry.id] || entry.category,
    thumbnailPath: `./assets/thumbnails/${entry.id}.png`,
  };
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function waitForReady(page) {
  await page.waitForFunction(() => document.body.dataset.thumbReady === 'true', null, { timeout: 30000 });
}

async function main() {
  await ensureDir(outDir);
  const raw = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(raw).map(withThumbnailPath);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 640, height: 500 }, deviceScaleFactor: 1.5 });
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('[thumbgen console]', msg.text());
  });
  await page.goto(thumbgenUrl, { waitUntil: 'domcontentloaded' });

  const fallbackIds = [];

  for (const entry of manifest) {
    const modelUrl = `http://127.0.0.1:8123/${entry.modelPath.replace(/^\.\//, '')}`;
    await page.evaluate(async ({ modelUrl, entry }) => {
      await window.thumbgen.renderThumb(modelUrl, entry);
    }, { modelUrl, entry });
    await waitForReady(page);
    const mode = await page.evaluate(() => document.body.dataset.thumbMode || 'render');
    if (mode === 'fallback') fallbackIds.push(entry.id);
    const canvas = page.locator('canvas');
    await canvas.screenshot({ path: path.join(outDir, `${entry.id}.png`) });
  }

  await browser.close();
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({ generated: manifest.length, fallbackIds }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
