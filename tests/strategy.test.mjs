import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { gameFixture } from './fixtures.mjs';
function setup(indexShape) {
  const game = gameFixture(indexShape), calls = [];
  const hooks = { state: {}, settings: { autoAscend: true }, log: () => {}, persist: () => {},
    checkpoint: () => true, isInputBusy: () => false, pokeWrinkler: w => calls.push(w), choosePurchase: () => {}, clickElf() {}, windowAchievements() {} };
  const context = vm.createContext({ console, Date, document: { getElementById() { return null; }, querySelector() { return null; } } });
  vm.runInContext(readFileSync('extension/vendor/strategy.js', 'utf8'), context);
  const bot = context.createCookiePilotStrategy(game, hooks);
  return { game, hooks, bot, calls };
}
test('Neverclick protection, and only normal clicks after challenges', () => {
  const { game, bot } = setup(); bot.handleClicking(); assert.equal(game.cookieClicks, 0);
  game.Achievements['True Neverclick'].won = game.Achievements.Neverclick.won = 1;
  bot.handleClicking(); assert.equal(game.cookieClicks, 1); assert.equal(game.cookies, 1);
});
test('No sugar-lump timer or type manipulation', () => {
  const { game, bot } = setup(); game.cookiesEarned = 1e9; const start = game.lumpT;
  bot.now = Date.now(); bot.handleSugarLumps();
  assert.equal(game.lumpT, start); assert.equal(game.lumpCurrentType, 0); assert.equal(game.lumps, 0);
});
test('Wrinklers use an input hook, not HP writes', () => {
  const { game, bot, calls } = setup(); game.Upgrades['One mind'].bought = 1;
  const w = { type: 0, hp: 3, close: 1, phase: 2 }; game.wrinklers = [w];
  bot.handleWrinklers(); assert.equal(calls[0], w); assert.equal(w.hp, 3);
});
test('Ascension waits for a confirmed durable backup', () => {
  const { game, bot, hooks } = setup(); hooks.checkpoint = () => false;
  bot.doAscend('test'); assert.equal(game.OnAscend, false);
  hooks.checkpoint = () => true; bot.doAscend('test'); assert.equal(game.OnAscend, true);
});
test('Ascension waits for a new seed and for a market-profit goal', () => {
  const { game, bot } = setup(); bot.plantPending = true; bot.doAscend('test'); assert.equal(game.OnAscend, false);
  bot.plantPending = false; bot.nextAchievement = game.Achievements['Gaseous assets'].id;
  game.Objects.Bank.minigame = { profit: 1e7 }; bot.doAscend('test'); assert.equal(game.OnAscend, false);
});
test('Cheat-only achievement never becomes the next goal', () => {
  const { game, bot } = setup(); Object.values(game.AchievementsById).forEach(a => a.won = 1);
  game.Achievements['Cheated cookies taste awful'].won = 0;
  Object.values(game.UpgradesById).forEach(u => u.bought = 1);
  assert.equal(bot.checkAllAchievementsOK(), true); assert.equal(bot.finished, true);
});
test('Legacy year wait remains an unfinished legitimate goal', () => {
  const { game, bot } = setup(); Object.values(game.AchievementsById).forEach(a => a.won = 1);
  game.Achievements['So much to do so much to see'].won = 0;
  assert.equal(bot.checkAllAchievementsOK(), false);
  assert.equal(bot.nextAchievement, game.Achievements['So much to do so much to see'].id);
});
test('Exact-cookie ascend does not liquidate or grant cookies', () => {
  const { game, bot } = setup(); game.cookies = 1e12; bot.nextAchievement = 397;
  bot.runJustRight(); assert.equal(game.OnAscend, true); assert.equal(game.cookies, 1e12);
});
test('Juicy Queenbeet layout has eight parents and an empty center', () => {
  const { bot } = setup(), planted = [];
  bot.plantSeed = (g, seed, x, y) => planted.push({ seed, x, y });
  bot.plantSector({}, 3, 'queenbeet', 'queenbeet', 'queenbeetLump');
  assert.equal(planted.length, 8);
  assert.ok(!planted.some(p => p.x === 1 && p.y === 1));
});
test('Everdaisy layout has three of each required parent', () => {
  const { bot } = setup(), planted = [];
  bot.plantSeed = (g, seed, x, y) => planted.push({ seed, x, y });
  bot.plantSector({}, 3, 'elderwort', 'tidygrass', 'everdaisy');
  assert.equal(planted.filter(p => p.seed === 'elderwort').length, 3);
  assert.equal(planted.filter(p => p.seed === 'tidygrass').length, 3);
});
test('Immature unknown seeds are protected from clearing', () => {
  const { bot } = setup(); let harvested = false;
  const garden = { isTileUnlocked:() => true, getTile:() => [1,20], plantsById:[{ unlocked:false, mature:50 }], harvest() { harvested=true; } };
  bot.cleanSeed(garden,0,0); assert.equal(harvested,false);
});
test('Ripe Juicy Queenbeet is harvested without waiting for a production combo', () => {
  const { bot } = setup(); let tile = [1,85], harvested=0;
  const garden = { isTileUnlocked:(x,y) => x===0&&y===0, getTile:() => tile,
    plantsById:[{ key:'queenbeetLump', unlocked:true, mature:85 }], harvest() { tile=[0,0]; harvested++; } };
  bot.harvesting(garden); assert.equal(harvested,1);
});
test('Fixture mirrors the original object registries and keeps shared entries', () => {
  const game = gameFixture();
  assert.equal(Array.isArray(game.AchievementsById), false);
  assert.equal(Array.isArray(game.UpgradesById), false);
  assert.equal(game.AchievementsById.length, undefined);
  assert.equal(game.UpgradesById.length, undefined);
  assert.equal(game.AchievementsById[game.Achievements.Hardcore.id], game.Achievements.Hardcore);
  assert.equal(game.UpgradesById[game.Upgrades['Lucky payout'].id], game.Upgrades['Lucky payout']);
});
test('Strategy goal selection accepts both object and array registries', () => {
  for (const indexShape of ['object', 'array']) {
    const { game, bot } = setup(indexShape);
    Object.values(game.AchievementsById).forEach(a => a.won = 1);
    game.Achievements['So much to do so much to see'].won = 0;
    bot.checkAllAchievementsOK();
    assert.equal(bot.nextAchievement, game.Achievements['So much to do so much to see'].id);
    Object.values(game.AchievementsById).forEach(a => a.won = 1);
    Object.values(game.UpgradesById).forEach(u => u.bought = 1);
    game.Upgrades['Lucky payout'].bought = 0;
    game.Upgrades['Lucky payout'].pool = 'prestige';
    bot.checkAllAchievementsOK();
    assert.match(bot.mainActivity, /Lucky payout/);
  }
});
