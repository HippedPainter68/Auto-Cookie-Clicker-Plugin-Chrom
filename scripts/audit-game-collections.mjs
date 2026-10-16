// Read-only inspection of downloaded original game sources. No game code is executed or bundled.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'acorn';
import path from 'node:path';
const directory = process.argv[2];
if (!directory) throw new Error('Usage: node scripts/audit-game-collections.mjs <downloaded-game-source-directory>');
const groups = {
  'main.js': {
    'Game.ObjectsById':'Game.ObjectsById', 'Game.AchievementsById':'Game.AchievementsById',
    'Game.UpgradesById':'Game.UpgradesById', 'Game.UpgradesInStore':'Game.UpgradesInStore',
    'Game.BankAchievements':'Game.BankAchievements', 'Game.CpsAchievements':'Game.CpsAchievements',
    'Game.shimmers':'Game.shimmers', 'Game.wrinklers':'Game.wrinklers', 'Game.dragonLevels':'Game.dragonLevels',
    'Game.Tiers':'Game.Tiers', 'this.tieredAchievs':'building.tieredAchievs',
    'this.tieredUpgrades':'building.tieredUpgrades', 'this.synergies':'building.synergies',
    'this.productionAchievs':'building.productionAchievs', 'this.pics':'building.pics'
  },
  'minigameGarden.js': {'M.plants':'garden.plants','M.soils':'garden.soils','M.plantsById':'garden.plantsById','M.soilsById':'garden.soilsById'},
  'minigameMarket.js': {'M.goodsById':'market.goodsById','M.offices':'market.offices'},
  'minigameGrimoire.js': {'M.spells':'grimoire.spells','M.spellsById':'grimoire.spellsById'},
  'minigamePantheon.js': {'M.gods':'pantheon.gods','M.slot':'pantheon.slot'}
};
function propertyPath(node) {
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'ThisExpression') return 'this';
  if (node.type !== 'MemberExpression' || node.computed) return '';
  return propertyPath(node.object) + '.' + node.property.name;
}
function walk(node, visit) {
  if (!node?.type) return;
  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) for (const entry of value) walk(entry, visit);
    else if (value?.type) walk(value, visit);
  }
}
const sources = [], collections = [];
for (const [file, expected] of Object.entries(groups)) {
  const bytes = await readFile(path.join(directory, file));
  const tree = parse(bytes.toString('utf8'), {ecmaVersion:'latest', locations:true});
  const found = new Map();
  walk(tree, node => {
    if (node.type !== 'AssignmentExpression' || !expected[propertyPath(node.left)]) return;
    const kind = node.right.type === 'ArrayExpression' ? 'array' : node.right.type === 'ObjectExpression' ? 'object' : null;
    if (kind) {
      const field = expected[propertyPath(node.left)], previous = found.get(field);
      if (previous && previous.kind !== kind) throw new Error(`Conflicting collection shape: ${field}`);
      if (!previous) found.set(field, {field,kind,source:file,line:node.loc.start.line});
    }
  });
  for (const field of Object.values(expected)) {
    if (!found.has(field)) throw new Error(`Missing collection declaration: ${file}: ${field}`);
    collections.push(found.get(field));
  }
  sources.push({file,url:'https://orteil.dashnet.org/cookieclicker/'+file,sha256:createHash('sha256').update(bytes).digest('hex')});
}
await writeFile('tests/game-collections.json', JSON.stringify({checked:'2026-10-16',sources,collections},null,2)+'\n');
console.log(`Audited ${collections.length} collection declarations in ${sources.length} original game sources.`);
