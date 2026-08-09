import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'public', 'screenshots');
const baseUrl = process.env.SCREENSHOT_URL || 'http://localhost:5173';

async function waitForSketch(page) {
  await page.waitForSelector('main canvas', { timeout: 15000 });
  await new Promise((resolve) => setTimeout(resolve, 1800));
}

async function capture(page, name) {
  const filePath = path.join(outDir, name);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`Saved ${filePath}`);
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();

  await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });
  await waitForSketch(page);
  await capture(page, '01-pendular-landing-light.png');

  await page.click('main canvas');
  await page.keyboard.press('Space');
  await new Promise((resolve) => setTimeout(resolve, 24000));
  await capture(page, '05-pendular-writing-motion.png');

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
