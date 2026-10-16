import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { gameFixture } from '../tests/fixtures.mjs';

await mkdir('artifacts', { recursive: true });
const executablePath = process.env.COOKIEPILOT_CHROME_PATH ||
  (process.platform === 'win32' ? path.join(process.env.PROGRAMFILES || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe') : undefined);
const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const errors = [];
const results = [];
try {
  // Fully synthetic game page: no real user profile, cloud service or save is used.
  await context.route('https://orteil.dashnet.org/cookieclicker/', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>CookiePilot synthetic contract fixture</title><body><p>Isolated fixture</p></body>' }));
  const sources = await Promise.all(['bridge.js','economy.js','vendor/strategy.js','runner.js'].map(f => readFile('extension/' + f, 'utf8')));
  const storageMock = `window.__messageHandler = null;
  window.chrome = { runtime: { getManifest: () => ({ version:'1.0.0' }),
    sendMessage: async () => ({ok:true}), onMessage: {addListener(fn) { window.__messageHandler=fn; }} },
    storage: { local: { async get(keys) { const out={}; for(const k of (Array.isArray(keys)?keys:[keys])) {const v=localStorage.getItem('mock-extension:'+k); if(v!==null) out[k]=JSON.parse(v);} return out; },
      async set(values) {for(const [k,v] of Object.entries(values)) localStorage.setItem('mock-extension:'+k,JSON.stringify(v));} } } };`;
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript({ content: storageMock + `\nwindow.Game=(${gameFixture.toString()})();\n` + sources.join('\n;\n') });
  await page.goto('https://orteil.dashnet.org/cookieclicker/');
  await page.waitForFunction(() => window.CookiePilot?.status().initialized);
  assert.deepEqual(await page.evaluate(() => ({ achievements:Array.isArray(Game.AchievementsById), upgrades:Array.isArray(Game.UpgradesById) })), { achievements:false, upgrades:false });
  async function command(command, value, target = page) {
    return target.evaluate(({ command, value }) => new Promise(resolve => {
      window.__messageHandler({ channel: 'cookiepilot-legit-v1', command, value }, {}, resolve);
    }), { command, value });
  }
  let status = await command('status'); assert.equal(status.running, false); results.push('Default paused until explicit start');
  status = await command('start'); assert.equal(status.running, true); assert.ok(status.lastBackup); results.push('Start waits for storage-confirmed backup');
  await page.waitForTimeout(650);
  assert.equal(await page.evaluate(() => Game.cookieClicks), 0); results.push('Fresh-game Neverclick protected');
  await command('pause');
  await page.evaluate(() => {
    Object.values(Game.AchievementsById).forEach(a => a.won=1); Game.AchievementsById[82].won=0;
    Game.resets=1; Game.prestige=1; Game.cookies=1e9; Game.cookiesPs=Game.unbuffedCps=100000;
    Game.ObjectsById.forEach(b => b.locked=true);
    Game.Objects.Cursor.storedTotalCps=100000;
    Object.assign(Game.Objects.Bank,{locked:false,basePrice:17e6,storedCps:8700});
    Object.assign(Game.Objects.Temple,{locked:false,basePrice:80e6,storedCps:20000});
  });
  await command('settings', { autoAscend:false, windowAchievements:false, speed:'fast' });
  await command('start'); await page.waitForTimeout(900);
  status = await command('status'); assert.equal(status.running, true, status.error);
  assert.equal(status.plan.target.name, 'Bank'); assert.ok(await page.evaluate(() => Game.Objects.Bank.amount > 0));
  assert.ok(await page.evaluate(() => Game.cookieClicks > 0)); results.push('Real runner buys Bank ahead of Temple and performs normal click calls');
  await command('pause'); const clicks = await page.evaluate(() => Game.cookieClicks); await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => Game.cookieClicks), clicks); results.push('Pause stops actions');
  const exported = await command('export'); assert.ok(exported.save.length > 10); results.push('Save export returns a real fixture snapshot');
  const report = await command('achievements');
  assert.equal(report.achievements.find(a => a.name === 'Cheated cookies taste awful').excluded, true);
  results.push('Dynamic achievement report excludes cheat-only achievement');
  await command('start');
  const second = await context.newPage();
  await second.addInitScript({ content: storageMock + `\nwindow.Game=(${gameFixture.toString()})();\n` + sources.join('\n;\n') });
  await second.goto('https://orteil.dashnet.org/cookieclicker/');
  await second.waitForFunction(() => window.CookiePilot?.status().initialized);
  await second.waitForFunction(() => !window.CookiePilot.status().startPending);
  const duplicate = await command('start', undefined, second);
  assert.equal(duplicate.ok, false); assert.match(duplicate.error, /anderen Tab/); results.push('Web Locks reject duplicate players');
  await second.close();
  await command('start'); // running flag may have been cleared by the rejected duplicate's pause
  await command('settings', { resume:true });
  await page.reload(); await page.waitForFunction(() => window.CookiePilot?.status().running);
  await page.waitForTimeout(1000);
  assert.equal((await command('status')).error, '');
  results.push('Resume state survives a page reload');
  await command('pause');
  // Test the actual popup DOM and events, with only extension transport replaced by a relay.
  const popup = await context.newPage();
  popup.on('pageerror', e => errors.push(e.message));
  await popup.exposeFunction('relayCookiePilot', async message => command(message.command, message.value));
  await popup.addInitScript({ content: `window.chrome={ runtime:{getManifest:()=>({version:'1.0.0'})}, tabs:{query:async()=>[{id:1,url:'https://orteil.dashnet.org/cookieclicker/'}],sendMessage:async(id,m)=>window.relayCookiePilot(m)},storage:{local:{get:async()=>({})}}};` });
  await popup.goto('file:///' + path.resolve('extension/popup.html').replaceAll('\\', '/'));
  await popup.waitForFunction(() => !document.getElementById('toggle').disabled);
  await popup.locator('#toggle').click(); await popup.waitForFunction(() => document.getElementById('state').textContent === 'Läuft');
  await popup.waitForTimeout(1000);
  assert.equal((await command('status')).error, '');
  await popup.locator('#toggle').click(); await popup.waitForFunction(() => document.getElementById('state').textContent === 'Pausiert');
  results.push('Popup start/pause buttons reach the runner and update status');
  await popup.setViewportSize({ width:440,height:1300 });
  await popup.evaluate(() => window.scrollTo(0,0));
  await popup.screenshot({path:'artifacts/popup.png',fullPage:true});
  assert.deepEqual(errors, []);
  console.log(results.map(r => 'PASS: '+r).join('\n'));
  await writeFile('artifacts/browser-results.json', JSON.stringify({ date:new Date().toISOString(), kind:'Synthetic game contract and popup, installed Chrome headless; browser transport mocked. Native unpacked-extension installation not tested.', results, errors },null,2));
} finally { await context.close(); await browser.close(); }
