import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { parse } from 'acorn';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
await mkdir('extension/vendor', { recursive: true });
const upstream = await readFile('vendor/cookieAutoPlayBeta.js', 'utf8');
const expected = JSON.parse(await readFile('vendor/provenance.json', 'utf8'));
if (createHash('sha256').update(upstream).digest('hex') !== expected.sha256) {
  throw new Error('Upstream source changed. Review the source and transformations first.');
}
let source = upstream.replace(/\r\n/g, '\n').replace(/[\t ]+$/gm, '');
const cut = (start, end) => {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  if (a < 0 || b < 0) throw new Error(`Missing source marker: ${start}`);
  source = source.slice(0, a) + source.slice(b);
};
cut('//===================== Menu', '//===================== Auxiliary');
source = source.slice(0, source.indexOf('//===================== Init & Start'));
cut('/* farming golden sugar lumps', 'AutoPlay.handleMinigames =');
const replacements = new Set([
  'run', 'runJustRight', 'preNightMode', 'nightMode', 'nightAtPantheon', 'nightAtGarden', 'nightAtStocks',
  'cheatGoldenCookies', 'cheatSugarLumps', 'grindingCheat', 'handleClicking', 'speedClicking',
  'handleSugarLumps', 'handleWrinklers', 'handleSmallAchievements', 'unDunk', 'redeemPresent',
  'canContinue', 'doReincarnate', 'doAscend', 'checkAllAchievementsOK', 'handleNotes',
  'findNextAchievement', 'assignPermanentSlot',
  'leaveGame', 'debugLogging', 'logging', 'showLog', 'cleanLog', 'info', 'whatTheBotIsDoing',
  'handleSeasons', 'unElf', 'handleGoldenCookies', 'handleStockMarket', 'bestBuy'
]);
const tree = parse(source, { ecmaVersion: 'latest' });
const ranges = [];
for (const node of tree.body) {
  const expr = node.expression;
  if (expr?.type === 'AssignmentExpression' && expr.left.type === 'MemberExpression' &&
      expr.left.object.name === 'AutoPlay' && replacements.has(expr.left.property.name)) {
    ranges.push([node.start, node.end]);
  }
  // The upstream startup renames the bakery before the bot has been started.
  if (node.type === 'IfStatement' && source.slice(node.start, node.end).includes('Game.bakeryName')) {
    ranges.push([node.start, node.end]);
  }
}
for (const [a, b] of ranges.sort((a, b) => b[0] - a[0])) source = source.slice(0, a) + source.slice(b);
source = source.replaceAll('AutoPlay.grindingCheat()', 'false').replaceAll('AutoPlay.Config.CheatGolden', '0');
source = source.replace("if (AutoPlay.endPhase() && !Game.Achievements[\"Endless cycle\"].won &&", "if (!Game.Achievements[\"Endless cycle\"].won &&");
source = source.replace('AutoPlay.handleAscend = function() {', 'AutoPlay.handleAscend = function() {\n  if (!hooks.settings.autoAscend) return;');
// These declarations no longer have a feature or a setting in this fork.
source = source.replace(/^AutoPlay\.cheat\w* = .*;.*$/gm, '');
const overrides = await readFile('src/strategy-overrides.js', 'utf8');
const output = `/* CookiePilot Legit. GPL-3.0-only. Derived from prinzstani/CookieBot ${expected.commit}.\n * See LICENSE.txt and THIRD_PARTY.md. Built locally; no remote code. */\n` +
  `(function(root) {\nroot.createCookiePilotStrategy = function(Game, hooks) {\n${source}\n${overrides}\nreturn AutoPlay;\n};\n})(globalThis);\n`;
parse(output, { ecmaVersion: 'latest' });
await writeFile('extension/vendor/strategy.js', output);
await copyFile('LICENSE', 'extension/LICENSE.txt');
await copyFile('THIRD_PARTY.md', 'extension/THIRD_PARTY.md');
console.log(`Built extension/vendor/strategy.js (${output.length} characters)`);
