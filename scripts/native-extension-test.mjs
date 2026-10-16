// Optional native Chrome test. Uses a disposable profile and synthetic game, no user saves.
import { chromium } from 'playwright';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { gameFixture } from '../tests/fixtures.mjs';
await mkdir('artifacts', { recursive:true });
const context = await chromium.launchPersistentContext(path.resolve('artifacts/native-profile'), {
  executablePath: process.env.COOKIEPILOT_CHROME_PATH || path.join(process.env.PROGRAMFILES || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe'),
  headless:true, ignoreDefaultArgs:['--disable-extensions'], args:['--enable-unsafe-extension-debugging'],
  viewport:{width:1280,height:800}
});
const results = [], errors = [];
try {
  const browser = context.browser(), cdp = await browser.newBrowserCDPSession();
  const { id } = await cdp.send('Extensions.loadUnpacked', { path:path.resolve('extension') });
  results.push('Manifest V3 extension installed natively in isolated Chrome profile');
  const worker = context.serviceWorkers().find(w=>w.url().startsWith(`chrome-extension://${id}/`)) ||
    await context.waitForEvent('serviceworker', {predicate:w=>w.url().startsWith(`chrome-extension://${id}/`)});
  await worker.evaluate(()=>chrome.storage.local.clear());
  await context.route('https://orteil.dashnet.org/cookieclicker/', route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Native extension synthetic game</title><body><p>Test fixture only</p></body>'}));
  const page=await context.newPage(); page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript({content:`window.Game=(${gameFixture.toString()})();`});
  await page.goto('https://orteil.dashnet.org/cookieclicker/');
  await page.waitForFunction(()=>window.CookiePilot?.status().initialized);
  assert.deepEqual(await page.evaluate(()=>({achievements:Array.isArray(Game.AchievementsById),upgrades:Array.isArray(Game.UpgradesById),tieredAchievs:Array.isArray(Game.Objects.Bank.tieredAchievs),tieredUpgrades:Array.isArray(Game.Objects.Bank.tieredUpgrades)})),{achievements:false,upgrades:false,tieredAchievs:false,tieredUpgrades:false});
  assert.ok(await page.evaluate(()=>Object.keys(Game.Objects.Bank.tieredAchievs).length && Object.keys(Game.Objects.Bank.tieredUpgrades).length));
  assert.equal(await page.evaluate(()=>CookiePilot.status().running),false);
  results.push('MAIN-world engine initialized with original object registries through real content-script configuration');
  const {targetInfos}=await cdp.send('Target.getTargets',{filter:[{type:'tab',exclude:false}]});
  const tabTarget=targetInfos.find(t=>t.url==='https://orteil.dashnet.org/cookieclicker/');
  if (!tabTarget) throw new Error('Native test tab target unavailable: '+JSON.stringify(targetInfos));
  await cdp.send('Extensions.triggerAction',{id,targetId:tabTarget.targetId});
  await new Promise(resolve=>setTimeout(resolve,500));
  // A background tab showing the packaged popup exercises the same extension page APIs.
  const popup=await context.newPage();
  popup.on('pageerror',e=>errors.push(e.message));
  await page.bringToFront();
  await popup.goto(`chrome-extension://${id}/popup.html`);
  await popup.waitForFunction(()=>!document.getElementById('toggle').disabled);
  assert.equal(await popup.locator('#error').isVisible(),false);
  results.push('Packaged popup reads status through native chrome.tabs messaging and isolated-world bridge');
  await popup.locator('#toggle').click();
  await page.waitForFunction(()=>CookiePilot.status().running);
  await page.waitForTimeout(600);
  assert.equal(await page.evaluate(()=>Game.cookieClicks),0);
  const stored=await worker.evaluate(()=>chrome.storage.local.get(null));
  const backups=Object.entries(stored).find(([key])=>key.startsWith('backups:'))?.[1];
  assert.ok(backups?.length); assert.ok(backups[0].save);
  results.push('Native extension start confirms a backup in real chrome.storage.local and protects Neverclick');
  await popup.locator('#toggle').click();
  await page.waitForFunction(()=>!CookiePilot.status().running);
  await page.evaluate(()=>{
    Object.values(Game.AchievementsById).forEach(a=>a.won=1);Game.AchievementsById[82].won=0;
    Game.resets=1;Game.prestige=1;Game.cookies=1e9;Game.cookiesPs=Game.unbuffedCps=100000;
    Game.ObjectsById.forEach(b=>b.locked=true);Game.Objects.Cursor.storedTotalCps=100000;
    Object.assign(Game.Objects.Bank,{locked:false,basePrice:17e6,storedCps:8700});
    Object.assign(Game.Objects.Temple,{locked:false,basePrice:80e6,storedCps:20000});
  });
  // Keep this test focused on economic actions; native window resizing is exercised separately.
  await worker.evaluate(()=>new Promise(resolve=>chrome.tabs.query({url:'https://orteil.dashnet.org/cookieclicker/'},tabs=>{
    chrome.tabs.sendMessage(tabs[0].id,{channel:'cookiepilot-legit-v1',command:'settings',value:{windowAchievements:false,autoAscend:false}},resolve);
  })));
  await page.evaluate(()=>CookiePilot.start()); await page.waitForTimeout(1000);
  const status=await page.evaluate(()=>CookiePilot.status());
  assert.equal(status.error,'');assert.equal(status.running,true);assert.equal(status.plan.target.name,'Bank');
  results.push('Native installed engine buys Bank before Temple in the user example');
  await popup.locator('#toggle').click(); // refresh first if the most recent status is still paused
  await page.evaluate(()=>CookiePilot.pause());
  await popup.reload(); await popup.waitForFunction(()=>document.getElementById('decision').textContent.includes('Bank'));
  await popup.setViewportSize({width:440,height:1300});
  await popup.evaluate(()=>window.scrollTo(0,0));
  await popup.screenshot({path:'artifacts/native-popup.png',fullPage:true});
  assert.deepEqual(errors,[]);
  await writeFile('artifacts/native-results.json',JSON.stringify({date:new Date().toISOString(),browser:browser.version(),kind:'Native unpacked MV3 extension and real extension transport/storage; synthetic Game fixture',results,errors},null,2));
  console.log(results.map(r=>'PASS: '+r).join('\n'));
} finally {await context.close();}
