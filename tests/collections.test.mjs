import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'acorn';
import { gameFixture } from './fixtures.mjs';
const contract = JSON.parse(readFileSync('tests/game-collections.json', 'utf8'));
const kind = value => Array.isArray(value) ? 'array' : value && typeof value === 'object' ? 'object' : typeof value;
test('Fixture collection shapes match audited original game and building declarations', () => {
  const game = gameFixture();
  for (const entry of contract.collections) {
    if (entry.field.startsWith('Game.')) {
      assert.equal(kind(game[entry.field.slice(5)]), entry.kind, entry.field);
    } else if (entry.field.startsWith('building.')) {
      for (const building of game.ObjectsById) assert.equal(kind(building[entry.field.slice(9)]), entry.kind, building.name + '.' + entry.field);
    }
  }
  for (const building of game.ObjectsById) {
    assert.ok(Object.keys(building.tieredAchievs).length);
    assert.ok(Object.keys(building.tieredUpgrades).length);
    assert.equal(building.tieredAchievs[1], game.AchievementsById[400 + building.id]);
    assert.equal(building.tieredUpgrades[1], game.UpgradesById[100 + building.id]);
    assert.equal(building.tieredUpgrades[1].buildingTie1, building);
  }
});
function walk(node, visit) {
  if (!node?.type) return;
  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) for (const entry of value) walk(entry, visit);
    else if (value?.type) walk(value, visit);
  }
}
test('Engine never uses direct array operations on audited object collections', () => {
  const dictionaries = new Set(contract.collections.filter(c => c.kind === 'object').map(c => c.field.split('.').at(-1)));
  const methods = new Set(['filter','find','map','reduce','forEach','some','every','slice','includes','sort']);
  const rawDictionary = node => {
    if (!node) return false;
    if (node.type === 'LogicalExpression') return rawDictionary(node.left);
    if (node.type === 'ChainExpression') return rawDictionary(node.expression);
    return node.type === 'MemberExpression' && !node.computed && dictionaries.has(node.property.name);
  };
  for (const file of ['extension/economy.js','extension/runner.js','extension/vendor/strategy.js']) {
    walk(parse(readFileSync(file,'utf8'), {ecmaVersion:'latest',locations:true}), node => {
      const label = `${file}:${node.loc.start.line}`;
      if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && methods.has(node.callee.property.name)) {
        assert.ok(!rawDictionary(node.callee.object), label + ' direct array method on object registry');
      }
      if (node.type === 'ForOfStatement') assert.ok(!rawDictionary(node.right), label + ' direct object iteration');
      if (node.type === 'SpreadElement') assert.ok(!rawDictionary(node.argument), label + ' direct object spread into iteration');
    });
  }
});
