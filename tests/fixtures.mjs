// Synthetic game contract for deterministic regression tests; never a real user save.
export function gameFixture() {
  const names = ['Cursor','Grandma','Farm','Mine','Factory','Bank','Temple','Wizard tower','Shipment','Alchemy lab','Portal','Time machine','Antimatter condenser','Prism','Chancemaker','Fractal engine','Javascript console','Idleverse','Cortex baker','You'];
  const achievements = Array.from({ length: 700 }, (_, id) => ({ id, name: 'Achievement ' + id, desc: '', ddesc: '', won: 0, pool: 'normal', click() {} }));
  const byName = Object.fromEntries(achievements.map(a => [a.name, a]));
  const required = ['Neverclick','True Neverclick','Hardcore','Speed baking I','Speed baking II','Speed baking III','Uncanny clicker','Here you go','Tiny cookie','Tabloid addiction','God complex',"What's in a name",'Olden days','Stifling the press','Cookie-dunker',"Baby it's old outside",'In her likeness','No time like the present','Four-leaf cookie','Early bird','Fading luck','Hand-picked','Last Chance to See','Moistburster','Wrinkler poker','Endless cycle','Reincarnation','Gaseous assets','Liquid assets','Debt evasion','Buy buy buy','Elder','Elder nap','Elder slumber','Grandmapocalypse','Elder calm','Thick-skinned','Sugar sugar','Sweetmeats','Maillard reaction','All-natural cane sugar','So much to do so much to see','Cheated cookies taste awful'];
  required.forEach((name, n) => { const a = achievements[600 + n]; delete byName[a.name]; a.name = name; byName[name] = a; });
  achievements[397].name = 'When the cookies ascend just right'; byName[achievements[397].name] = achievements[397];
  achievements[99].pool = 'dungeon';
  const upgradeNames = ['Lucky payout','Lucky number','Lucky digit','One mind','A festive hat',"Santa's dominion",'Season switcher','Golden switch [on]','Golden switch [off]','Shimmering veil [on]','Shimmering veil [off]','Reinforced membrane','Bingo center/Research facility','Unholy bait','Sugar frenzy','Chocolate egg','Elder Pledge','Elder Covenant','Sacrificial rolling pins','Permanent upgrade slot V','Sucralosia Inutilis','Distilled essence of redoubled luck','Wrapping paper','Ichor syrup','Green yeast digestives','Duketater cookies','Elderwort biscuits'];
  const upgrades = Array.from({ length: 900 }, (_, id) => ({ id, name: 'Upgrade ' + id, unlocked: 0, bought: 0, pool: 'normal', getPrice: () => 1e30, canBuy() { return false; }, buy() { return false; } }));
  const up = Object.fromEntries(upgrades.map(u => [u.name, u]));
  upgradeNames.forEach((name, n) => { const u = upgrades[700 + n]; delete up[u.name]; u.name = name; up[name] = u; });
  const absentUpgrade = { bought:0, unlocked:0, getPrice:() => Infinity, canBuy:() => false, buy:() => false };
  const g = {
    ready: true, version: 2.052, SaveTo: 'CookieClickerTest', startDate: Date.now(), fullDate: Date.now(),
    cookies: 0, cookiesPs: 0, unbuffedCps: 0, computedMouseCps: 1, cookieClicks: 0, cookiesEarned: 0,
    ascensionMode: 0, nextAscensionMode: 0, prestige: 0, heavenlyChips: 0, ascendMeterLevel: 0, ascendMeterPercent: 0,
    resets: 0, BuildingsOwned: 0, UpgradesOwned: 0, AchievementsOwned: 0,
    AscendTimer: 0, ReincarnateTimer: 0, OnAscend: false, onMenu: '', promptOn: false,
    bakeryName: 'Test', bakeryNameL: { textContent: 'Test' }, lumps: 0, lumpT: Date.now(),
    lumpMatureAge: 72000000, lumpRipeAge: 82800000, lumpOverripeAge: 86400000, lumpCurrentType: 0,
    wrinklers: [], wrinklerHP: 3, season: '', seasonUses: 0, dragonLevel: 0, dragonLevels: Array(30).fill({}),
    milkProgress: 0, milkHd: 0, windowW: 1200, tickerTooNarrow: 900, CanClick: 1, dragonAura:0, dragonAura2:0,
    keys: [], buffs: {}, TickerEffect: 0, shimmers: [], shimmerTypes: { golden: { n: 0, time: 0 } },
    AchievementsById: achievements, Achievements: byName, UpgradesById: upgrades,
    Upgrades: new Proxy(up, { get(target, key) { return target[key] ?? absentUpgrade; } }),
    UpgradesInStore: [], Tiers: {}, BankAchievements: [], CpsAchievements: [], Notes: [],
    Has(name) { return !!this.Upgrades[name]?.bought; }, HasAchiev(name) { return !!this.Achievements[name]?.won; },
    HasUnlocked(name) { return !!this.Upgrades[name]?.unlocked; }, hasBuff(name) { return this.buffs[name] || false; },
    canLumps() { return this.cookiesEarned >= 1e9; }, isMinigameReady(b) { return !!b?.minigameLoaded; },
    ClickCookie() { this.cookieClicks++; this.cookies += this.computedMouseCps; this.cookiesEarned += this.computedMouseCps; },
    WriteSave() { return btoa(JSON.stringify({ cookies: this.cookies, cookieClicks: this.cookieClicks, resets: this.resets })); },
    Ascend() { this.OnAscend = true; this.resets++; },
    Reincarnate() { this.OnAscend = false; this.ascensionMode = this.nextAscensionMode; this.startDate = Date.now(); },
    registerMod(id, mod) { this.mods ||= {}; this.mods[id] = mod; mod.init?.(); },
    PickAscensionMode() {}, ConfirmPrompt() {}, ClosePrompt() { this.promptOn = false; },
    Notify() {}, storeBulkButton() {}, ClickTinyCookie() {}, ShowMenu(menu) { this.onMenu = menu; },
    bakeryNamePrompt() {}, clickLump() {}, sayTime() { return 'test'; }, auraMult() { return 0; }, eff() { return 1; },
    tickerL: { click() {}, scrollIntoView() {} }
  };
  g.ObjectsById = names.map((name, id) => ({ id, name, amount: 0, level: 0, locked: id > 1, bought: 0,
    basePrice: id ? 100 * Math.pow(5, id) : 15, storedCps: id ? Math.pow(4, id) : .1,
    storedTotalCps: 0, tieredAchievs: [], tieredUpgrades: [], synergies: [],
    getPrice() { return this.basePrice * Math.pow(1.15, this.amount); },
    getSumPrice(count) { let total = 0; for (let n = 0; n < count; n++) total += this.basePrice * Math.pow(1.15, this.amount + n); return total; },
    getReverseSumPrice(count) { return Math.max(0, count) * this.basePrice * .25; },
    buy(count = 1) { count = Math.max(0, Math.floor(count)); while (count-- && g.cookies >= this.getPrice()) {
      g.cookies -= this.getPrice(); this.amount++; this.bought++; g.BuildingsOwned++; } },
    sell(count = 1) { count = Math.min(this.amount, Math.max(0, Math.floor(count))); g.cookies += this.getReverseSumPrice(count); this.amount -= count; g.BuildingsOwned -= count; },
    levelUp() { if (g.lumps > this.level) { g.lumps -= ++this.level; } }
  }));
  g.Objects = Object.fromEntries(g.ObjectsById.map(b => [b.name, b]));
  return g;
}
