// Synthetic ascension screen: models costs, eligibility, dialogs and animation boundaries.
export function prepareLegacy(game) {
  game.legacyActions = [];
  Object.values(game.AchievementsById).forEach(a => a.won = 1);
  game.AchievementsById[82].won = game.AchievementsById[89].won = 0;
  game.Achievements.Reincarnation.won = game.Achievements['Endless cycle'].won = 0;
  game.fps = 30; game.prestige = 100; game.resets = 1; game.ascendMeterLevel = 200;
  game.heavenlyChips = game.heavenlyChipsSpent = 0;
  game.permanentUpgrades = [-1, -1, -1, -1, -1];
  function heavenly(id, name, price, parents = []) {
    const u = game.UpgradesById[id];
    Object.assign(u, { name, pool:'prestige', parents, bought:0, unlocked:1, getPrice:() => price });
    game.Upgrades[name] = u;
    u.buy = function() {
      if (!game.OnAscend || !this.canBePurchased || this.bought || game.heavenlyChips < price) return false;
      game.heavenlyChips -= price; game.heavenlyChipsSpent += price; this.bought = 1;
      game.legacyActions.push('buy:' + id); game.BuildAscendTree(); return true;
    };
    return u;
  }
  heavenly(363, 'Legacy', 1);
  heavenly(264, 'Permanent upgrade slot I', 100, [363]);
  heavenly(500, 'Unaffordable heavenly upgrade', 1000, [363]);
  game.BuildAscendTree = function() {
    for (const u of Object.values(this.UpgradesById)) if (u.pool === 'prestige') {
      u.canBePurchased = (!u.showIf || u.showIf()) && u.parents.every(id => this.UpgradesById[id].bought);
    }
  };
  for (const id of [0, 31]) Object.assign(game.UpgradesById[id], { bought:1, unlocked:1, pool:'' });
  game.Ascend = function() { this.legacyActions.push('ascend'); this.OnAscend = false; this.AscendTimer = 1; };
  game.finishAscension = function() {
    this.gainedPrestige = this.ascendMeterLevel;
    this.prestige += this.gainedPrestige; this.heavenlyChips += this.gainedPrestige;
    this.AscendTimer = 0; this.OnAscend = true; this.ascensionMode = 0; this.nextAscensionMode = 0;
    this.BuildAscendTree();
  };
  let slot = null;
  game.AssignPermanentSlot = function(which) {
    if (!this.UpgradesById[264 + which].bought) throw new Error('Locked permanent slot');
    slot = which; this.SelectingPermanentUpgrade = this.permanentUpgrades[which]; this.promptOn = true;
  };
  game.PutUpgradeInPermanentSlot = function(id, which) {
    const u = this.UpgradesById[id];
    if (slot !== which || !u.bought || !u.unlocked || u.noPerm || !['','cookie'].includes(u.pool) ||
        this.permanentUpgrades.some((assigned, other) => other !== which && assigned === id)) {
      throw new Error('Upgrade is not offered by the permanent-slot dialog');
    }
    this.SelectingPermanentUpgrade = id;
  };
  game.ConfirmPrompt = function() {
    if (slot !== null) { this.permanentUpgrades[slot] = this.SelectingPermanentUpgrade; slot = null; }
    this.promptOn = false;
  };
  game.PickAscensionMode = function() { slot = null; this.promptOn = true; };
  game.Reincarnate = function() {
    this.legacyActions.push('reincarnate');
    this.ascensionMode = this.nextAscensionMode; this.nextAscensionMode = 0;
    if (this.gainedPrestige > 0) this.resets++;
    this.ascendMeterLevel = 0; this.OnAscend = false; this.ReincarnateTimer = 1;
    this.cookies = this.cookiesEarned = this.BuildingsOwned = this.UpgradesOwned = 0;
    this.startDate = Date.now();
    for (const u of Object.values(this.UpgradesById)) if (u.pool !== 'prestige') u.bought = this.permanentUpgrades.includes(u.id) ? 1 : 0;
    for (const b of this.ObjectsById) b.amount = 0;
  };
  game.finishReincarnation = function() { this.ReincarnateTimer = 0; };
  return game;
}
