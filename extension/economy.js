/* CookiePilot Legit — GPL-3.0-only. Pure estimates; never edits the game to simulate a purchase. */
(function(root) {
  'use strict';
  const kittenPower = {
    'Kitten helpers': .1, 'Kitten workers': .125, 'Kitten engineers': .15,
    'Kitten overseers': .175, 'Kitten managers': .2, 'Kitten accountants': .2,
    'Kitten specialists': .2, 'Kitten experts': .2, 'Kitten consultants': .2,
    'Kitten assistants to the regional manager': .175, 'Kitten marketeers': .15,
    'Kitten analysts': .125, 'Kitten executives': .115, 'Kitten admins': .11,
    'Kitten strategists': .105, 'Kitten angels': .1, 'Fortune #103': .05
  };
  const fingers = { 'Thousand fingers': .1, 'Million fingers': 5, 'Billion fingers': 10,
    'Trillion fingers': 20, 'Quadrillion fingers': 20, 'Quintillion fingers': 20,
    'Sextillion fingers': 20, 'Septillion fingers': 20, 'Octillion fingers': 20,
    'Nonillion fingers': 20, 'Decillion fingers': 20, 'Undecillion fingers': 20 };
  const mouseNames = ['Plastic', 'Iron', 'Titanium', 'Adamantium', 'Unobtainium', 'Eludium',
    'Wishalloy', 'Fantasteel', 'Nevercrack', 'Armythril', 'Technobsidian', 'Plasmarble',
    'Miraculite', 'Aetherice', 'Omniplast'].map(n => n + ' mouse').concat('Fortune #104');
  const strategic = new Set(['Legacy', 'A crumbly egg', 'Bingo center/Research facility',
    'One mind', 'Communal brainsweep', 'Elder Pact', 'Elder Pledge', 'Elder Covenant',
    'Sacrificial rolling pins', 'Season switcher', 'Pet the dragon', 'Wrapping paper',
    'A festive hat', "Santa's dominion", 'Golden goose egg', 'Omelette', 'Serendipity',
    'Lucky day', 'Get lucky', 'Heavenly chip secret', 'Heavenly cookie stand',
    'Heavenly bakery', 'Heavenly confectionery', 'Heavenly key']);
  const has = (g, name) => !!g.Upgrades?.[name]?.bought &&
    !(g.ascensionMode === 1 && g.Upgrades[name].pool === 'prestige');
  function milkScale(g) {
    let factor = (has(g, "Santa's milk and cookies") ? 1.05 : 1) * (1 + (g.auraMult?.('Breath of Milk') || 0) * .05);
    factor *= [1, 1.1, 1.05, 1.03][g.hasGod?.('mother') || 0] || 1;
    return factor * (g.eff?.('milk') ?? 1);
  }
  function milkRatio(g, extra) {
    const milk = g.milkProgress || 0, scale = milkScale(g);
    return Object.entries(kittenPower).reduce((ratio, [name, power]) =>
      has(g, name) ? ratio * (1 + (milk + extra / 25) * scale * power) / (1 + milk * scale * power) : ratio, 1);
  }
  function fingerValue(g, extra) {
    let value = 0;
    for (const [name, mult] of Object.entries(fingers)) if (name === extra || has(g, name)) {
      value = name === 'Thousand fingers' ? mult : value * mult;
    }
    if (has(g, 'Unshackled cursors')) value *= 25;
    return value;
  }
  function context(g, options) {
    const buildings = g.ObjectsById || [];
    const sum = buildings.reduce((n, b) => n + (b.storedTotalCps ?? b.storedCps * b.amount), 0);
    const global = sum > 0 ? (g.unbuffedCps ?? g.cookiesPs) / sum : (g.globalCpsMult || 1);
    const currentBuff = (g.unbuffedCps > 0 ? g.cookiesPs / g.unbuffedCps : 1);
    // Rank recurring production with unbuffed CpS. Temporary frenzy is used for affordability only.
    const clicks = Math.max(0, Math.min(50, options.clicksPerSecond || 0));
    const mouse = mouseNames.filter(n => has(g, n)).length * .01;
    const clickMult = (g.eff?.('click') ?? 1) *
      (has(g, "Santa's helpers") ? 1.1 : 1) * (has(g, 'Cookie egg') ? 1.1 : 1) *
      (has(g, 'Halo gloves') ? 1.1 : 1) * (has(g, 'Dragon claw') ? 1.03 : 1) *
      (has(g, 'Aura gloves') ? 1 + .05 * Math.min(g.Objects?.Cursor?.level || 0, has(g, 'Luminous gloves') ? 20 : 10) : 1) *
      ([1, 1.15, 1.1, 1.05][g.hasGod?.('labor') || 0] || 1);
    return { buildings, global, clicks, mouse, clickMult,
      passive: (g.unbuffedCps ?? g.cookiesPs) || 0,
      income: Math.max(0, g.cookiesPs * (1 - (g.cpsSucked || 0))) + clicks * (g.computedMouseCps || 0),
      // Click-frenzy etc. are transient and intentionally not extrapolated forever.
      baseClick: (g.computedMouseCps || 0) / Math.max(1, currentBuff),
      bank: Math.max(0, g.cookies - (options.reserve || 0)) };
  }
  function buildingGain(g, b, ctx, count = 1) {
    let raw = b.storedCps * count;
    for (const other of ctx.buildings) {
      const total = other.storedTotalCps ?? other.storedCps * other.amount;
      for (const syn of other.synergies || []) if (has(g, syn.name)) {
        if (syn.buildingTie1 === other && syn.buildingTie2 === b) raw += total * .05 * count / (1 + .05 * b.amount);
        if (syn.buildingTie2 === other && syn.buildingTie1 === b) raw += total * .001 * count / (1 + .001 * b.amount);
      }
      if (b.id === 1 && other.id > 1 && has(g, other.grandma?.name)) {
        const rate = .01 / (other.id - 1);
        raw += total * rate * count / (1 + b.amount * rate);
      }
    }
    const cursor = g.Objects?.Cursor;
    if (b.id !== 0 && cursor) raw += cursor.amount * fingerValue(g) * count;
    const newAchievements = (b.tieredAchievs || []).filter(a => !a.won &&
      b.amount + count >= g.Tiers?.[a.tier]?.achievUnlock).length;
    let gain = raw * ctx.global;
    if (newAchievements) gain = (ctx.passive + gain) * milkRatio(g, newAchievements) - ctx.passive;
    return { delta: gain * (1 - (g.cpsSucked || 0)) + gain * ctx.mouse * ctx.clickMult * ctx.clicks,
      confidence: 'Modell', reason: newAchievements ? 'Produktion, Synergien und zusätzliche Milch' : 'Zusätzliche Produktion und aktive Synergien' };
  }
  function upgradeGain(g, u, ctx) {
    const name = u.name, desc = (u.desc || '').replace(/<[^>]*>/g, '');
    const totalOf = b => (b.storedTotalCps ?? b.storedCps * b.amount) * ctx.global;
    const passive = x => x * (1 - (g.cpsSucked || 0)) + x * ctx.mouse * ctx.clickMult * ctx.clicks;
    let delta = 0, reason = '', confidence = 'Modell';
    if (kittenPower[name]) {
      delta = passive(ctx.passive * (g.milkProgress || 0) * milkScale(g) * kittenPower[name]);
      reason = 'Kätzchen-Multiplikator mit aktueller Milch';
    } else if (u.buildingTie1 && u.buildingTie2) {
      delta = passive(totalOf(u.buildingTie1) * .05 * u.buildingTie2.amount + totalOf(u.buildingTie2) * .001 * u.buildingTie1.amount);
      reason = 'Synergiegewinn beider Gebäudetypen';
    } else if (name in fingers) {
      const add = (fingerValue(g, name) - fingerValue(g)) * ctx.buildings.filter(b => b.id !== 0).reduce((n, b) => n + b.amount, 0);
      delta = passive(add * (g.Objects?.Cursor?.amount || 0) * ctx.global) + add * ctx.clickMult * ctx.clicks;
      reason = 'Cursor- und Klickgewinn aus Finger-Upgrades';
    } else if (['Reinforced index finger', 'Carpal tunnel prevention cream', 'Ambidextrous'].includes(name)) {
      delta = passive(totalOf(g.Objects.Cursor)) + ctx.clicks * ctx.clickMult;
      reason = 'Cursorverdopplung und Klick-Grundwert';
    } else if (mouseNames.includes(name)) {
      delta = ctx.passive * .01 * ctx.clickMult * ctx.clicks; reason = '1 % der CpS pro tatsächlichem Klick';
    } else if (u.buildingTie1 && (u.tier !== undefined || u === u.buildingTie1.fortune)) {
      const b = u.buildingTie1;
      const multiplier = u.tier === 'fortune' ? 1.07 : 2 +
        (g.ascensionMode !== 1 && has(g, b.unshackleUpgrade) && has(g, g.Tiers?.[u.tier]?.unshackleUpgrade) ? (b.id === 1 ? .5 : (20 - b.id) * .1) : 0);
      delta = passive(totalOf(b) * (multiplier - 1)); reason = 'Gebäude-Multiplikator';
    } else if (u.pool === 'cookie' && typeof u.power === 'number') {
      delta = passive(ctx.passive * u.power / 100); reason = 'Globaler Produktionsbonus';
    } else if (ctx.buildings.some(b => b.grandma === u)) {
      const tied = ctx.buildings.find(b => b.grandma === u);
      delta = passive(totalOf(g.Objects.Grandma) + totalOf(tied) * (g.Objects.Grandma.amount * .01 / (tied.id - 1)));
      reason = 'Großmütter verdoppeln und Gebäudebonus';
    } else if (['Chicken egg','Duck egg','Turkey egg','Quail egg','Robin egg','Ostrich egg','Cassowary egg','Salmon roe','Frogspawn','Shark egg','Turtle egg','Ant larva'].includes(name)) {
      delta = passive(ctx.passive * .01); reason = 'Eier-Produktionsbonus';
    } else if (['Cookie egg', "Santa's helpers", 'Halo gloves', 'Dragon claw'].includes(name)) {
      const factor = name === 'Dragon claw' ? .03 : .1;
      delta = ctx.baseClick * factor * ctx.clicks; reason = 'Klickbonus bei aktiver Klickrate';
    } else {
      const percent = desc.match(/Cookie production multiplier \+([\d.]+)%/i);
      if (percent) { delta = passive(ctx.passive * Number(percent[1]) / 100); reason = 'Produktionsbonus aus Upgrade-Beschreibung'; confidence = 'Schätzung'; }
    }
    return { delta, confidence, reason: reason || 'Freischaltung oder nicht modellierter Spezialeffekt' };
  }
  function plan(g, options = {}) {
    const ctx = context(g, options), candidates = [], specials = [];
    const add = (item, type, price, gain, count = 1) => {
      if (!(price >= 0 && Number.isFinite(price) && gain.delta > 0 && Number.isFinite(gain.delta))) return;
      const wait = price <= ctx.bank ? 0 : ctx.income > 0 ? (price - ctx.bank) / ctx.income : Infinity;
      const payback = price / gain.delta;
      candidates.push({ name: item.name, id: item.id, type, count, price, delta: gain.delta,
        payback, wait, score: wait + payback, confidence: gain.confidence, reason: gain.reason, affordable: price <= ctx.bank });
    };
    for (const b of ctx.buildings) {
      if (b.locked) continue;
      add(b, 'building', b.getPrice(), buildingGain(g, b, ctx));
      // Evaluate reaching the next upgrade threshold together with buying that upgrade.
      if (options.allowUpgrades !== false) for (const u of b.tieredUpgrades || []) {
        const threshold = g.Tiers?.[u.tier]?.unlock, count = threshold - b.amount;
        if (u.bought || count < 1 || count > 10 || !Number.isFinite(count)) continue;
        const before = buildingGain(g, b, ctx, count);
        const upgrade = upgradeGain(g, u, ctx);
        const unit = b.storedCps * ctx.global;
        add(b, 'bundle', b.getSumPrice(count) + u.getPrice(), { delta: before.delta + upgrade.delta + unit * count,
          confidence: 'Schätzung', reason: `${count} Gebäude + ${u.name} als Paket` }, count);
      }
    }
    if (options.allowUpgrades !== false) for (const u of Object.values(g.UpgradesById || {})) {
      if (!u.unlocked || u.bought || ['prestige','debug','toggle'].includes(u.pool) || u.priceLumps > 0 || options.avoid?.(u)) continue;
      const gain = upgradeGain(g, u, ctx), price = u.getPrice();
      add(u, 'upgrade', price, gain);
      if (!(gain.delta > 0)) specials.push({ id: u.id, name: u.name, price, reason: gain.reason,
        strategic: strategic.has(u.name) || g.season && /egg|biscuit|santa|heart/i.test(u.name) });
    }
    const horizon = Math.max(60, options.horizonSeconds || 86400);
    for (const candidate of candidates) {
      candidate.horizon = horizon;
      candidate.netGain = candidate.delta * Math.max(0, horizon - candidate.wait) - candidate.price;
      candidate.paysWithinHorizon = candidate.netGain >= 0;
    }
    candidates.sort((a, b) => a.score - b.score || a.price - b.price);
    const viable = candidates.filter(c => c.paysWithinHorizon);
    const best = viable[0];
    let purchase = best?.affordable && best.type !== 'bundle' ? best : null;
    // A cheap intermediate purchase is useful when it pays for itself before the planned target.
    if (!purchase && best) purchase = viable.find(c => c.affordable && c.type !== 'bundle' && c.payback < best.wait * .9) || null;
    // Buy known progression unlocks within a bounded 1-minute production budget.
    const special = specials.filter(s => s.strategic && s.price <= ctx.bank && s.price <= Math.max(100, ctx.income * 60))
      .sort((a, b) => a.price - b.price)[0];
    if (special) purchase = { ...special, type: 'upgrade', count: 1, delta: null, payback: null,
      confidence: 'Strategie', reason: 'Freischaltung für langfristigen Fortschritt' };
    // For a threshold package, advance one building only once it is individually affordable.
    if (!purchase && best?.type === 'bundle') {
      const building = g.ObjectsById[best.id];
      if (building.getPrice() <= ctx.bank) purchase = { ...best, type: 'building', count: 1, price: building.getPrice() };
    }
    return { target: best || null, purchase, alternatives: candidates.slice(0, 8), unknown: specials.filter(s => !s.strategic),
      income: ctx.income, horizon, waiting: !best && candidates.length ? 'Kein Produktionskauf amortisiert sich im gewählten Planungshorizont.' : '' };
  }
  root.CookiePilotEconomy = { plan, buildingGain, upgradeGain, context };
})(globalThis);
