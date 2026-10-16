import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'acorn';
function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  if (node.type) visit(node);
  for (const key of Object.keys(node)) if (key !== 'start' && key !== 'end') {
    if (Array.isArray(node[key])) node[key].forEach(n => walk(n, visit));
    else if (node[key]?.type) walk(node[key], visit);
  }
}
const files = ['extension/economy.js','extension/runner.js','extension/vendor/strategy.js'];
test('Delivered engine has no reward grants, RNG/clock overrides, remote loaders or save imports', () => {
  const forbidden = new Set(['Win','Earn','Spend','Unlock','gainLumps','LoadSave','ImportSave','OpenSesame','LoadMod','SpawnWrinkler','shimmer','eval']);
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    walk(parse(source, { ecmaVersion: 'latest' }), n => {
      if (n.type === 'CallExpression' || n.type === 'NewExpression') {
        const prop = n.callee.property?.name || n.callee.name;
        assert.ok(!forbidden.has(prop), `${file}: forbidden direct call ${prop}`);
        if (prop === 'ClickCookie') assert.equal(n.arguments.length, 0, 'Never supply synthetic click rewards');
      }
      if (n.type === 'AssignmentExpression' || n.type === 'UpdateExpression') {
        const left = n.left || n.argument;
        const prop = left.property?.name;
        const internalTimestamp = prop === 'now' && left.object?.name === 'AutoPlay';
        assert.ok(internalTimestamp || !new Set(['cookies','cookiesEarned','handmadeCookies','lumps','lumpT','lumpCurrentType','lastClick','hp','won','bought','unlocked','magic','time','random','now','CalculateGains','ClickCookie']).has(prop), `${file}: direct state write ${prop}`);
      }
    });
  }
});
test('Manifest only injects into game hosts and ships every referenced file', () => {
  const manifest = JSON.parse(readFileSync('extension/manifest.json', 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['storage','activeTab']);
  for (const entry of manifest.content_scripts) {
    for (const pattern of entry.matches) assert.match(pattern, /^https?:\/\/(orteil\.dashnet\.org|cookieclicker\.eu)\/cookieclicker\/\*$/);
    for (const file of entry.js) assert.ok(readFileSync('extension/' + file).length);
  }
  assert.ok(!manifest.externally_connectable);
});
