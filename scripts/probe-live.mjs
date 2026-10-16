import { chromium } from 'playwright';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('artifacts', { recursive: true });
const extension = path.resolve('extension');
const browser = await chromium.launchPersistentContext(path.resolve('artifacts/live-profile'), {
  executablePath: process.env.COOKIEPILOT_CHROME_PATH || path.join(process.env.PROGRAMFILES || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe'), headless: true,
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  for (const url of ['https://orteil.dashnet.org/cookieclicker/', 'https://cookieclicker.eu/cookieclicker/']) {
    await page.goto(url, { timeout: 30000, waitUntil: 'domcontentloaded' }).catch(e => console.log(e.message.split('\n')[0]));
    await page.waitForFunction(() => window.Game?.ready, null, { timeout: 15000 }).catch(() => {});
    console.log(JSON.stringify(await page.evaluate(() => ({ url: location.href, title: document.title,
      ready: !!window.Game?.ready, version: window.Game?.version, status: window.CookiePilot?.status(),
      body: document.body.innerText.slice(0, 250) }))));
    if (await page.evaluate(() => !!window.Game?.ready)) {
      await writeFile('artifacts/live-index.html', await page.content());
      await page.screenshot({ path: 'artifacts/live-game.png' });
      break;
    }
  }
  console.log(JSON.stringify({ errors }));
} finally { await browser.close(); }
