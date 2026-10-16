// CookiePilot's reviewed replacement actions. Runs in the strategy factory scope.
AutoPlay.Config = { NightMode: 0, ClickMode: 1, GoldenClickMode: 2, SavingStrategy: 1 };
AutoPlay.cheatLumps = false; // A read-only strategy condition used by the Pantheon.
AutoPlay.resetTime = Date.now();
AutoPlay.giftCode = hooks.state.giftCode || '';
AutoPlay.giftTime = hooks.state.giftTime || 0;
AutoPlay.preNightMode = function() { return false; };
AutoPlay.info = function(message) { hooks.log(message); };
AutoPlay.logging = function() {};
AutoPlay.debugLogging = function() {};
const won = name => !!Game.Achievements[name]?.won;
const legitAchievement = a => a && a.pool !== 'dungeon' && a.name !== 'Cheated cookies taste awful';
const unmetChallenge = () => !won('True Neverclick') || !won('Neverclick') || !won('Hardcore');
const validChallengeRun = () => Game.ascensionMode === 1 || (!Game.resets && !Game.prestige);

AutoPlay.handleClicking = function() {
  if (AutoPlay.nextAchievement === 397 || hooks.isInputBusy()) return;
  if (validChallengeRun() && ((!won('True Neverclick') && Game.cookieClicks === 0) ||
      (!won('Neverclick') && Game.cookieClicks <= 15))) return;
  // Never supply ClickCookie's optional amount argument; the game computes the reward.
  Game.ClickCookie();
};
AutoPlay.bestBuy = function() {
  hooks.choosePurchase(AutoPlay);
};
AutoPlay.handleGoldenCookies = function() {
  if (Game.TickerEffect && Game.tickerL) Game.tickerL.click();
  const golden = Game.shimmers.filter(s => s.type === 'golden' && s.force !== 'cookie storm drop');
  if (!won('Four-leaf cookie') && golden.length >= 4) return;
  for (const shimmer of [...Game.shimmers]) {
    if (shimmer.type === 'golden' && shimmer.force !== 'cookie storm drop') {
      if (!won('Four-leaf cookie') && golden.length >= 2 && shimmer.life > Game.fps * 2) continue;
      if (!won('Fading luck') && won('Early bird') && shimmer.life > Game.fps &&
          shimmer.life < shimmer.dur * Game.fps - 2 * Game.fps && !Game.hasBuff('Click frenzy')) continue;
    }
    shimmer.pop();
  }
};
AutoPlay.handleSugarLumps = function() {
  if (!Game.canLumps() || Game.ascensionMode === 1) return;
  const age = AutoPlay.now - Game.lumpT;
  if (age >= Game.lumpRipeAge || (age >= Game.lumpMatureAge &&
      Game.lumpCurrentType === 0 && AutoPlay.minLumpsOK && !won('Hand-picked'))) Game.clickLump();
  AutoPlay.useLump();
};
AutoPlay.handleWrinklers = function() {
  if (!Game.Has('One mind')) return;
  const active = Game.wrinklers.filter(w => w.close === 1 && w.hp > 0.5);
  if (!active.length) return;
  const poker = active.find(w => w.type === 0);
  if (!won('Wrinkler poker') && poker) {
    // Wait for natural HP regeneration between pokes, so this wrinkler survives 50 clicks.
    if (poker.hp >= Game.wrinklerHP - 0.05) hooks.pokeWrinkler(poker);
    return;
  }
  const dropping = ['easter', 'halloween'].includes(Game.season) && !AutoPlay.seasonFinished(Game.season);
  const hunting = Game.Has('Unholy bait') && (!won('Moistburster') || !won('Last Chance to See'));
  const shiny = active.find(w => w.type === 1);
  if (shiny && !won('Last Chance to See')) { hooks.pokeWrinkler(shiny); return; }
  if (dropping || hunting || Date.now() - AutoPlay.wrinklerTime > 7200000) {
    AutoPlay.poppingWrinklers = true;
    hooks.pokeWrinkler(active.find(w => w.type === 0) || active[0]);
    if (active.some(w => w.hp <= 1.3)) AutoPlay.wrinklerTime = Date.now();
  }
};
AutoPlay.handleSeasons = function() {
  if (Game.Has('A festive hat') && !Game.HasUnlocked("Santa's dominion")) {
    Game.specialTab = 'santa';
    Game.UpgradeSanta();
    Game.ToggleSpecialMenu(0);
  }
  if (Game.season === 'christmas' && !won("Baby it's old outside")) hooks.clickElf();
  if (!Game.Has('Season switcher') || Game.ascensionMode === 1 || Game.seasonUses > 20) return;
  if (AutoPlay.seasonFinished(Game.season)) {
    const next = { christmas: 'Lovesick biscuit', valentines: 'Bunny biscuit', easter: 'Ghostly biscuit' };
    Game.Upgrades[next[Game.season] || 'Festive biscuit']?.buy();
  }
};
function renameBakery(name) {
  Game.bakeryNamePrompt();
  const input = document.getElementById('bakeryNameInput');
  if (input) { input.value = name; Game.ConfirmPrompt(); }
}
AutoPlay.handleSmallAchievements = function() {
  if (!won('Tabloid addiction')) for (let i = 0; i < 50; i++) Game.tickerL.click();
  if (!won('Here you go')) Game.Achievements['Here you go']?.click();
  if (!won('Tiny cookie')) Game.ClickTinyCookie();
  if (!won('God complex') || !won("What's in a name")) {
    const previous = Game.bakeryName;
    renameBakery('Orteil');
    renameBakery(previous);
  }
  if (!won('Olden days')) {
    const previous = Game.onMenu;
    Game.ShowMenu('log');
    document.querySelector('#oldenDays [onclick], #oldenDays .icon')?.click();
    Game.ShowMenu(previous);
  }
  if (!won('Stifling the press') && Game.windowW < Game.tickerTooNarrow) Game.tickerL.click();
  if ((!won('Cookie-dunker') && Game.milkProgress > 0.7) || !won('Stifling the press')) hooks.windowAchievements();
  if (!won('In her likeness') && Game.Objects.You?.amount > 0 && Game.YouCustomizer) {
    // Only use the same gene-step operation as the arrows in the game's clone editor.
    for (const [gene, target] of [['hair', 9], ['hairCol', 6], ['head', 3], ['acc1', 0], ['acc2', 3]]) {
      const entry = Game.YouCustomizer.genesById[gene];
      if (entry) {
        const current = Game.YouCustomizer.currentGenes[entry.n];
        if (current !== target) Game.YouCustomizer.offsetGene(gene, target - current);
      }
    }
  }
  AutoPlay.handleGift();
};
AutoPlay.handleGift = function() {
  if (won('No time like the present') || !Game.Has('Wrapping paper') || Game.ascensionMode) return;
  if (AutoPlay.giftCode && Date.now() - AutoPlay.giftTime > 90000000) {
    AutoPlay.giftCode = ''; hooks.persist({ giftCode: '', giftTime: 0 });
  }
  if (AutoPlay.giftCode && Date.now() - AutoPlay.giftTime >= 3660000) {
    Game.promptGiftRedeem();
    const code = document.getElementById('giftCode');
    if (!code) return;
    code.value = AutoPlay.giftCode;
    code.dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('promptOption0')?.click();
    Game.ClosePrompt();
    if (won('No time like the present')) {
      AutoPlay.giftCode = ''; hooks.persist({ giftCode: '', giftTime: 0 });
    }
  } else if (!AutoPlay.giftCode && !Game.hasBuff('Gifted out') && Game.cookies >= 1e9) {
    Game.promptGiftSend();
    const amount = document.getElementById('giftAmount');
    if (!amount) return;
    amount.value = '42';
    document.getElementById('giftMessage').value = 'CookiePilot';
    document.getElementById('promptOption0')?.click();
    const code = document.getElementById('giftCode')?.value;
    Game.ClosePrompt();
    if (code) {
      AutoPlay.giftCode = code; AutoPlay.giftTime = Date.now();
      hooks.persist({ giftCode: code, giftTime: AutoPlay.giftTime });
    }
  }
};
AutoPlay.canContinue = function() {
  if (validChallengeRun() && ((!won('True Neverclick') && !Game.cookieClicks) ||
      (!won('Neverclick') && Game.cookieClicks <= 15) || (!won('Hardcore') && !Game.UpgradesOwned))) return true;
  if (!won('Speed baking III') && Date.now() - Game.startDate <= 900000 && validChallengeRun()) {
    AutoPlay.hyperActive = true; return true;
  }
  return false;
};
AutoPlay.doReincarnate = function() {
  AutoPlay.onAscend = false;
  AutoPlay.delay = 10;
  AutoPlay.buyHeavenlyUpgrades();
  const challenge = unmetChallenge() || !won('Speed baking III');
  // This is the selection state used by the game's ascension-mode prompt.
  Game.PickAscensionMode(); Game.nextAscensionMode = challenge ? 1 : 0; Game.ConfirmPrompt();
  Game.Reincarnate(true);
  AutoPlay.resetTime = Date.now();
  AutoPlay.goodsList = null;
  AutoPlay.plantList = [0, 0, 0, 0];
  AutoPlay.ascendLimit = 0.9 * Math.floor(2 * (1 - Game.ascendMeterPercent));
};
AutoPlay.doAscend = function(reason, log) {
  if (!hooks.settings.autoAscend || Game.AscendTimer > 0 || Game.ReincarnateTimer > 0 ||
      AutoPlay.onAscend || Game.OnAscend) return;
  if (AutoPlay.nextAchievement === 397 && Math.round(Game.cookies) === 1e12) {
    if (!hooks.checkpoint('Vor Aufstieg: exakt eine Billion')) return;
    Game.Ascend(true); AutoPlay.onAscend = true; return;
  }
  AutoPlay.wantAscend = !!AutoPlay.plantPending;
  if (AutoPlay.wantAscend || Game.hasBuff('Sugar frenzy') || Game.hasBuff('Sugar blessing')) return;
  const market = Game.Objects.Bank?.minigame;
  // Do not destroy months of market profit while pursuing this one-ascension achievement.
  if (AutoPlay.nextAchievement === Game.Achievements['Gaseous assets']?.id &&
      market && market.profit > 0 && !won('Gaseous assets')) return;
  if (!hooks.checkpoint('Vor Aufstieg: ' + reason)) return;
  const active = Game.wrinklers.find(w => w.close === 1 && w.hp > 0.5);
  if (active) { hooks.pokeWrinkler(active); return; }
  if (Game.wrinklers.some(w => w.phase > 0 && w.hp <= 0.5)) return; // let the game pay out first
  if (Game.isMinigameReady(Game.Objects.Farm)) Game.Objects.Farm.minigame.harvestAll();
  if (Game.isMinigameReady(Game.Objects.Bank)) {
    for (const good of market.goodsById) market.sellGood(good.id, Math.floor(good.stock));
  }
  if (Game.HasUnlocked('Chocolate egg') && !Game.Has('Chocolate egg')) {
    if (Game.dragonLevel >= 9) {
      Game.specialTab = 'dragon'; Game.SetDragonAura(5, 0); Game.ConfirmPrompt(); Game.ToggleSpecialMenu(0);
    }
    for (const building of Game.ObjectsById) building.sell(building.amount);
    Game.Upgrades['Chocolate egg'].buy(); AutoPlay.delay = 10; return;
  }
  hooks.log(reason); AutoPlay.delay = 15;
  Game.Ascend(true); AutoPlay.onAscend = true;
};
AutoPlay.checkAllAchievementsOK = function() {
  const pending = Object.values(Game.AchievementsById).filter(a => legitAchievement(a) && !a.won);
  const late = new Set(AutoPlay.lateAchievements);
  // Finish the market before long waits; keeping the run protects Gaseous assets.
  const marketGoal = Game.Achievements['Gaseous assets'];
  let next = pending.find(a => !late.has(a.id));
  if (marketGoal && !marketGoal.won && pending.every(a => late.has(a.id) ||
      ['Gaseous assets', 'Liquid assets', 'Just plain lucky'].includes(a.name))) next = marketGoal;
  next ||= pending[0];
  if (next) {
    AutoPlay.finished = false;
    AutoPlay.nextAchievement = next.id;
    AutoPlay.setMainActivity('Ziel: ' + next.name + ' – ' + (next.ddesc || next.desc || '').replace(/<[^>]*>/g, ''));
    return false;
  }
  const missing = Object.values(Game.UpgradesById).find(u => u.pool === 'prestige' && !u.bought);
  if (missing) {
    AutoPlay.nextAchievement = 99;
    AutoPlay.setMainActivity('Himmlisches Upgrade: ' + missing.name); return false;
  }
  AutoPlay.finished = true; AutoPlay.nextAchievement = 99;
  AutoPlay.setMainActivity('Alle legitimen Achievements dieses Spielstands erreicht.'); return true;
};
AutoPlay.findNextAchievement = function() {
  AutoPlay.wantAscend = false;
  AutoPlay.handleSmallAchievements();
  const next = AutoPlay.wantedAchievements.map(id => Game.AchievementsById[id]).find(a => a && !a.won);
  if (!next) return AutoPlay.checkAllAchievementsOK();
  AutoPlay.nextAchievement = next.id;
  const description = (next.ddesc || next.desc || '').replace(/<[^>]*>/g, '').trim();
  AutoPlay.setMainActivity('Ziel: ' + (next.dname || next.name) + (description ? ' – ' + description : ''));
};
AutoPlay.handleStockMarket = function() {
  if (Game.ascensionMode || !Game.isMinigameReady(Game.Objects.Bank) || AutoPlay.wantAscend) return;
  const market = Game.Objects.Bank.minigame;
  if (market.brokers < market.getMaxBrokers() && market.getBrokerPrice() * 100 < Game.cookies) {
    document.getElementById('bankBrokersBuy')?.click();
  }
  if (market.officeLevel < market.offices.length - 1) {
    const office = market.offices[market.officeLevel];
    if (office.cost && Game.Objects.Cursor.amount >= office.cost[0] && Game.Objects.Cursor.level >= office.cost[1]) {
      document.getElementById('bankOfficeUpgrade')?.click();
    }
  }
  if (!won('Debt evasion') && !AutoPlay.plantPending && market.officeLevel >= 4 &&
      AutoPlay.nextAchievement === Game.Achievements['Debt evasion']?.id && hooks.settings.autoAscend) {
    const before = Game.hasBuff('Loan 2');
    if (!before) document.getElementById('bankLoan2')?.click();
    if (Game.hasBuff('Loan 2')) AutoPlay.doAscend('Debt evasion: laufenden Kredit verlassen', 0);
  }
  AutoPlay.goodsList ||= [];
  for (const good of market.goodsById) {
    const price = market.getGoodPrice(good);
    const max = Math.floor(market.getGoodMaxStock(good));
    if (!(price > 0 && Number.isFinite(price) && max > 0)) continue;
    const quote = AutoPlay.goodsList[good.id] ||= { previous: price, boughtAt: null };
    if (quote.previous === price) continue;
    const rest = market.getRestingVal(good.id);
    if (!won('Buy buy buy') && max >= 500 && good.stock < 500 && price < rest * 0.7) {
      market.buyGood(good.id, Math.max(0, Math.floor(500 - good.stock)));
    }
    if (good.stock < max && price < rest * 0.65 && price >= quote.previous) {
      const previousStock = good.stock;
      market.buyGood(good.id, Math.max(0, Math.floor(max - good.stock)));
      if (good.stock > previousStock) quote.boughtAt = price;
    } else if (good.stock > 0 && price > rest && price < quote.previous &&
        (quote.boughtAt === null || price > quote.boughtAt * 1.25)) {
      market.sellGood(good.id, Math.floor(good.stock)); quote.boughtAt = null;
    }
    quote.previous = price;
  }
};

// Keep the existing exact-cookie strategy, but every reward still comes from the game.
AutoPlay.runJustRight = function() {
  AutoPlay.savingsGoal = 0;
  AutoPlay.activities = 'Exakt eine Billion Cookies für den Aufstieg erreichen.';
  if (Game.OnAscend) { AutoPlay.handleAscend(); return; }
  if (Math.round(Game.cookies) === 1e12) { AutoPlay.doAscend('Exakt eine Billion', 1); return; }
  const difference = 1e12 - Game.cookies;
  if (difference < 0) {
    // Spend ordinary cookies on a purchase, then approach the target again.
    const candidates = Game.ObjectsById.filter(b => b.getPrice() < Game.cookies && b.getPrice() > -difference);
    const item = candidates.sort((a, b) => a.getPrice() - b.getPrice())[0];
    if (item) item.buy(1);
    else AutoPlay.doAscend('Exakte Billion verpasst; normaler neuer Versuch', 0);
    return;
  }
  if (Game.BuildingsOwned) {
    // Selling pays cookies. Start removing buildings while still far away from the target.
    if (difference < Game.cookiesPs * 120 + Game.ObjectsById.reduce((s, b) => s + b.getReverseSumPrice(b.amount), 0)) {
      for (const b of [...Game.ObjectsById].reverse()) if (b.amount) { b.sell(b.amount); return; }
    }
  }
  if (!Game.BuildingsOwned && difference <= 1e6) { Game.ClickCookie(); return; }
  if (difference > Math.max(Game.cookiesPs * 300, 1e6)) {
    for (const b of [...Game.ObjectsById].reverse()) {
      if (b.getPrice() < Game.cookies * 0.01 && b.amount < 100) { b.buy(1); return; }
    }
  }
  if (!Game.BuildingsOwned && difference > 1e6) Game.Objects.Cursor.buy(1);
};
AutoPlay.run = function() {
  if (Game.AscendTimer > 0 || Game.ReincarnateTimer > 0) return;
  if (AutoPlay.delay > 0) { AutoPlay.delay--; return; }
  AutoPlay.now = Date.now();
  AutoPlay.cpsMult = Game.unbuffedCps > 0 ? Game.cookiesPs / Game.unbuffedCps : 1;
  if (AutoPlay.nextAchievement === 397 && !won('When the cookies ascend just right')) {
    AutoPlay.runJustRight(); return;
  }
  if (Game.OnAscend) { AutoPlay.handleAscend(); return; }
  AutoPlay.handleGoldenCookies();
  AutoPlay.handleWrinklers();
  AutoPlay.handleSpeedMinigames();
  if (AutoPlay.now - (AutoPlay.lastPurchase || 0) > 500) {
    AutoPlay.lastPurchase = AutoPlay.now; AutoPlay.bestBuy();
  }
  if (Game.ascensionMode === 1 || AutoPlay.onAscend || AutoPlay.hyperActive) AutoPlay.handleAscend();
  if (AutoPlay.now < AutoPlay.deadline) return;
  AutoPlay.activities = AutoPlay.mainActivity;
  AutoPlay.deadline = AutoPlay.now + 5000;
  if (Game.AchievementsById[AutoPlay.nextAchievement]?.won || AutoPlay.finished) AutoPlay.findNextAchievement();
  AutoPlay.handleSugarLumps();
  AutoPlay.handleSavings();
  AutoPlay.handleSeasons();
  AutoPlay.handleDragon();
  AutoPlay.handleMinigames();
  AutoPlay.handleSmallAchievements();
  AutoPlay.handleAscend();
};
const previousHarvesting = AutoPlay.harvesting;
AutoPlay.harvesting = function(garden) {
  for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) {
    if (!garden.isTileUnlocked(x, y)) continue;
    const tile = garden.getTile(x, y), plant = tile[0] ? garden.plantsById[tile[0] - 1] : null;
    if (plant?.key === 'queenbeetLump' && tile[1] >= plant.mature) garden.harvest(x, y);
  }
  previousHarvesting(garden);
};
AutoPlay.switchSoil = function(garden, sector, name) {
  if (sector || garden.freeze || garden.nextSoil > Date.now()) return;
  const soil = garden.soils[name];
  if (!soil || garden.soil === soil.id || garden.parent.amount < soil.req) return;
  document.getElementById('gardenSoil-' + soil.id)?.click();
};
// Rebuild arrays defensively for additive game updates. Never invent or unlock entries.
AutoPlay.wantedAchievements = AutoPlay.wantedAchievements.filter(id => legitAchievement(Game.AchievementsById[id]));
for (const a of Object.values(Game.AchievementsById)) {
  if (legitAchievement(a) && /Bake <b>|Bake [\d<]/i.test(a.desc || '') && !AutoPlay.wantedAchievements.includes(a.id)) {
    AutoPlay.wantedAchievements.splice(Math.max(3, AutoPlay.wantedAchievements.length - 3), 0, a.id);
  }
}
