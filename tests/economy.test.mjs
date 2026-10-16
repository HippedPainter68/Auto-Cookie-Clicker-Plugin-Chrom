import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { gameFixture } from './fixtures.mjs';
const context = vm.createContext({});
vm.runInContext(readFileSync('extension/economy.js', 'utf8'), context);
const economy = context.CookiePilotEconomy;
function example(indexShape) {
  const g = gameFixture(indexShape);
  g.cookies = 1e9; g.cookiesPs = g.unbuffedCps = 100000;
  for (const b of g.ObjectsById) b.locked = true;
  const bank = g.Objects.Bank, temple = g.Objects.Temple;
  Object.assign(bank, { locked: false, basePrice: 17e6, storedCps: 8700 });
  Object.assign(temple, { locked: false, basePrice: 80e6, storedCps: 20000 });
  // Existing production is independent of the two unowned candidates.
  g.Objects.Cursor.storedTotalCps = 100000;
  return g;
}
test('User example: Bank beats Temple by marginal payback', () => {
  const p = economy.plan(example());
  assert.equal(p.target.name, 'Bank');
  assert.ok(Math.abs(p.target.payback - 17e6 / 8700) < 1e-8);
  assert.equal(p.purchase.name, 'Bank');
});
test('500 million / +2% upgrade is compared against buildings', () => {
  const g = example(); g.cookiesPs = g.unbuffedCps = 1e6; g.Objects.Cursor.storedTotalCps = 1e6;
  const u = g.UpgradesById[0]; Object.assign(u, { name: 'White chocolate cookies', unlocked: 1, pool: 'cookie', power: 2, getPrice: () => 500e6 });
  const p = economy.plan(g);
  const candidate = p.alternatives.find(x => x.id === 0 && x.type === 'upgrade');
  assert.equal(candidate.delta, 20000); assert.equal(candidate.payback, 25000);
  assert.equal(p.purchase.name, 'Bank');
});
test('No poor investment before an imminent ascend', () => {
  const g = example();
  const p = economy.plan(g, { horizonSeconds: 600 });
  assert.equal(p.purchase, null); assert.equal(p.target, null);
  assert.ok(p.alternatives.every(c => !c.paysWithinHorizon));
});
test('An efficient upgrade can beat every building', () => {
  const g = example(); const u = g.UpgradesById[0];
  Object.assign(u, { name: 'Discount cookie', unlocked: 1, pool: 'cookie', power: 10, getPrice: () => 10000 });
  const p = economy.plan(g); assert.equal(p.purchase.name, 'Discount cookie'); assert.equal(p.purchase.type, 'upgrade');
});
test('Kitten ROI uses milk and milk modifiers', () => {
  const g = example(); g.milkProgress = 2;
  const u = g.UpgradesById[0]; Object.assign(u, { name: 'Kitten helpers', unlocked: 1, kitten: 1, getPrice: () => 1000 });
  const p = economy.plan(g); assert.equal(p.purchase.delta, 20000);
});
test('Avoid debug, prestige, toggle, sugar-lump prices and challenge upgrades', () => {
  const g = example();
  Object.values(g.UpgradesById).slice(0, 4).forEach((u, n) => Object.assign(u, { unlocked: 1, power: 1000, getPrice: () => 1,
    pool: ['debug','prestige','toggle','cookie'][n], priceLumps: n === 3 ? 1 : 0 }));
  assert.ok(economy.plan(g).alternatives.every(c => c.type === 'building'));
  assert.ok(economy.plan(g, { allowUpgrades: false }).alternatives.every(c => c.type === 'building'));
});
test('Bank reserve prevents a superficially affordable purchase', () => {
  const g = example(); g.cookies = 17e6;
  const p = economy.plan(g, { reserve: 1e6 }); assert.equal(p.purchase, null); assert.ok(p.target.wait > 0);
});
test('Planning does not mutate resources, purchases, amounts or achievements', () => {
  const g = example();
  const snapshot = () => {
    const seen = new WeakSet();
    return JSON.stringify(g, (key, value) => {
      if (value && typeof value === 'object') {
        if (seen.has(value)) return { reference:value.id ?? value.name ?? key };
        seen.add(value);
      }
      return value;
    });
  };
  const before = snapshot();
  for (let n = 0; n < 20; n++) economy.plan(g, { clicksPerSecond: 40 });
  assert.equal(snapshot(), before);
});
test('Synergy upgrade includes both buildings', () => {
  const g = example(), b1 = g.Objects.Bank, b2 = g.Objects.Temple;
  b1.amount = 100; b1.storedTotalCps = 870000; b2.amount = 10; b2.storedTotalCps = 200000;
  g.cookiesPs = g.unbuffedCps = 1070000; g.Objects.Cursor.storedTotalCps = 0;
  const u = { name: 'Test synergy', buildingTie1: b1, buildingTie2: b2 };
  const gain = economy.upgradeGain(g, u, economy.context(g, {}));
  assert.equal(gain.delta, 870000 * .05 * 10 + 200000 * .001 * 100);
});
test('Zero income produces no fictitious bank or free purchase', () => {
  const g = example(); g.cookies = g.cookiesPs = g.unbuffedCps = 0;
  const p = economy.plan(g); assert.equal(p.purchase, null); assert.equal(p.target, null);
});
test('Upgrade planning accepts both original object and array registries', () => {
  for (const indexShape of ['object', 'array']) {
    const g = example(indexShape), u = g.UpgradesById[0];
    Object.assign(u, { name: 'Discount cookie', unlocked: 1, pool: 'cookie', power: 10, getPrice: () => 10000 });
    assert.equal(economy.plan(g).purchase.name, 'Discount cookie');
  }
});
test('A building milestone reads populated tier objects and adds its milk benefit', () => {
  for (const shape of ['object', 'array']) {
    const g = gameFixture(shape), bank = g.Objects.Bank;
    bank.amount = 49; bank.storedCps = 10; bank.storedTotalCps = 490;
    g.milkProgress = 2; g.cookiesPs = g.unbuffedCps = 588;
    g.Upgrades['Kitten helpers'] = { bought:1, pool:'normal' };
    const result = economy.buildingGain(g, bank, economy.context(g, {}));
    assert.ok(Math.abs(result.delta - 14) < 1e-9);
    assert.match(result.reason, /Milch/);
  }
});
test('A populated tier-upgrade object produces a building-plus-upgrade plan', () => {
  for (const shape of ['object', 'array']) {
    const g = gameFixture(shape), bank = g.Objects.Bank;
    g.ObjectsById.forEach(b => b.locked = true);
    Object.assign(bank, { locked:false, amount:49, storedCps:10, storedTotalCps:490 });
    bank.getPrice = () => 100; bank.getSumPrice = count => count * 100;
    bank.tieredUpgrades[1].getPrice = () => 50;
    g.cookies = 1000; g.cookiesPs = g.unbuffedCps = 490;
    const result = economy.plan(g);
    assert.equal(result.target.type, 'bundle');
    assert.equal(result.target.price, 150);
    assert.equal(result.purchase.type, 'building');
    assert.equal(result.purchase.count, 1);
    assert.equal(result.purchase.price, 100);
  }
});
test('String-keyed tier entries are included instead of dropped by array conversion', () => {
  const g = gameFixture(), bank = g.Objects.Bank;
  bank.locked = false; bank.amount = 10; bank.storedCps = 10; bank.storedTotalCps = 100;
  g.cookies = 1000; g.cookiesPs = g.unbuffedCps = 100;
  const fortune = g.UpgradesById[150];
  Object.assign(fortune, { name:'Fixture bank fortune', tier:'fortune', unlocked:1, buildingTie1:bank, getPrice:() => 1 });
  bank.tieredUpgrades.fortune = fortune;
  const result = economy.plan(g);
  const option = result.alternatives.find(c => c.type === 'upgrade' && c.id === fortune.id);
  assert.ok(option);
  assert.ok(Math.abs(option.delta - 7) < 1e-9);
});
