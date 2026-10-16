/* CookiePilot Legit — GPL-3.0-only. Uses real game actions, never reward or timer overrides. */
(function() {
  'use strict';
  if (window.CookiePilot) return;
  const channel = 'cookiepilot-legit-v1';
  const defaults = { speed: 'fast', autoAscend: true, resume: true, horizonHours: 0, windowAchievements: true };
  let settings = { ...defaults }, state = {}, configured = false, strategy = null, game = null;
  let running = false, initialized = false, error = '', busyUntil = 0, lastClick = 0, lastStrategy = 0;
  let nextBackup = 0, lastBackup = 0, lastCheckpointKey = '', checkpointPending = null, unlock = null;
  let purchasePlan = null, lastPlan = 0, configuredResume = false, startPending = false;
  const logs = [], saves = new Map();
  const clickRates = { eco: 5, normal: 10, fast: 40 };
  const send = payload => window.postMessage({ channel, direction: 'from-page', ...payload }, location.origin);
  const strip = text => String(text || '').replace(/<[^>]*>/g, '');
  function log(message) {
    const text = strip(message);
    if (logs[0]?.message === text) return;
    logs.unshift({ time: Date.now(), message: text }); logs.length = Math.min(logs.length, 60);
  }
  function persist(update) { state = { ...state, ...update }; send({ type: 'state', state }); }
  function saveSettings(value) {
    if (value && typeof value === 'object') {
      settings = { ...settings,
        speed: Object.hasOwn(clickRates, value.speed) ? value.speed : settings.speed,
        autoAscend: typeof value.autoAscend === 'boolean' ? value.autoAscend : settings.autoAscend,
        resume: typeof value.resume === 'boolean' ? value.resume : settings.resume,
        windowAchievements: typeof value.windowAchievements === 'boolean' ? value.windowAchievements : settings.windowAchievements,
        horizonHours: Number.isFinite(Number(value.horizonHours)) ? Math.min(87600, Math.max(0, Number(value.horizonHours))) : settings.horizonHours };
    }
    send({ type: 'settings', settings });
  }
  function backup(reason) {
    if (!game?.ready) return Promise.reject(new Error('Spiel noch nicht bereit'));
    const save = game.WriteSave(1);
    if (typeof save !== 'string' || !save.length) return Promise.reject(new Error('Spielstand konnte nicht exportiert werden'));
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { saves.delete(id); reject(new Error('Lokales Backup wurde nicht bestätigt')); }, 10000);
      saves.set(id, { resolve, reject, timer });
      send({ type: 'checkpoint', id, save, reason, version: game.version });
    });
  }
  function checkpoint(reason) {
    const key = `${game.resets}:${game.startDate}`;
    if (lastCheckpointKey === key) return true;
    if (!checkpointPending) {
      checkpointPending = backup(reason).then(() => { lastCheckpointKey = key; })
        .catch(fail).finally(() => { checkpointPending = null; });
    }
    return false;
  }
  function pointer(element, type, x, y, extra = {}) {
    element.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, detail: 1, ...extra }));
  }
  function pokeWrinkler(wrinkler) {
    const canvas = document.getElementById('backgroundLeftCanvas');
    if (!canvas || game.keys?.[17] || !game.CanClick) return;
    // Canvas coordinates are exactly those exposed by the game's renderer.
    const bounds = canvas.getBoundingClientRect(), scale = game.scale || 1;
    const x = bounds.left + wrinkler.x * scale, y = bounds.top + wrinkler.y * scale;
    pointer(canvas, 'mousemove', x, y);
    pointer(canvas, 'click', x, y);
    busyUntil = Date.now() + 220;
  }
  function clickElf() {
    if (busyUntil > Date.now()) return;
    const grandma = game.Objects.Grandma;
    const elf = grandma.pics?.find(p => p.pic === 'elfGrandma.png');
    if (!elf || !grandma.canvas) return;
    const canvas = grandma.canvas, bounds = canvas.getBoundingClientRect();
    const x = bounds.left + elf.x + 32, y = bounds.top + elf.y + 32;
    pointer(canvas, 'mouseover', x, y); pointer(canvas, 'mousemove', x, y); pointer(canvas, 'mousedown', x, y, { buttons: 1 });
    busyUntil = Date.now() + 200;
    setTimeout(() => { pointer(canvas, 'mouseup', x, y); }, 150);
  }
  let lastWindowRequest = 0;
  function windowAchievements() {
    if (!settings.windowAchievements || document.hidden || Date.now() - lastWindowRequest < 60000) return;
    lastWindowRequest = Date.now();
    send({ type: 'window-achievements' });
    log('Fenster-Erfolge: echte Fenstergröße kurz anpassen.');
  }
  function challengeNoClick() {
    return (game.ascensionMode === 1 || (!game.resets && !game.prestige)) &&
      ((!game.HasAchiev('True Neverclick') && game.cookieClicks === 0) ||
      (!game.HasAchiev('Neverclick') && game.cookieClicks <= 15));
  }
  function choosePurchase(bot) {
    const allowUpgrades = game.HasAchiev('Hardcore') || game.UpgradesOwned > 0 ||
      !(game.ascensionMode === 1 || (!game.resets && !game.prestige));
    const goal = game.AchievementsById[bot.nextAchievement];
    const bake = game.BankAchievements?.find(a => a.id === goal?.id);
    const expected = bake && bake.threshold > game.cookiesEarned && game.unbuffedCps > 0 ?
      (bake.threshold - game.cookiesEarned) / game.unbuffedCps : Infinity;
    let horizon = Math.min(settings.horizonHours ? settings.horizonHours * 3600 : Infinity, Math.max(60, expected));
    if (!Number.isFinite(horizon)) horizon = 86400;
    const options = { reserve: bot.savingsGoal, allowUpgrades,
      clicksPerSecond: challengeNoClick() ? 0 : clickRates[settings.speed], avoid: u => bot.avoidbuy(u), horizonSeconds: horizon };
    purchasePlan = CookiePilotEconomy.plan(game, options);
    if (!settings.horizonHours && !Number.isFinite(expected) && !purchasePlan.target && purchasePlan.alternatives.length) {
      options.horizonSeconds = Math.min(315360000, Math.max(86400, purchasePlan.alternatives[0].score * 2));
      purchasePlan = CookiePilotEconomy.plan(game, options);
    }
    lastPlan = Date.now();
    const item = purchasePlan.purchase;
    if (!item) return;
    if (item.type === 'building') game.ObjectsById[item.id].buy(1);
    else {
      const upgrade = game.UpgradesById[item.id];
      // buy(true) skips a confirmation only. Lump-priced upgrades are excluded above.
      if (upgrade.unlocked && !upgrade.bought && upgrade.canBuy() && upgrade.pool !== 'debug') upgrade.buy(true);
    }
    log(`Kauf: ${item.name}. ${item.reason}.`);
  }
  function initialize() {
    if (initialized || !window.Game?.ready || !configured) return;
    game = window.Game;
    const required = ['registerMod','ClickCookie','Has','HasAchiev','WriteSave','Ascend','Reincarnate','isMinigameReady'];
    if (required.some(name => typeof game[name] !== 'function') || !game.ObjectsById?.length || !game.AchievementsById?.length) {
      error = 'Diese Spielversion stellt benötigte Schnittstellen nicht bereit.'; return;
    }
    try {
      strategy = createCookiePilotStrategy(game, { get settings() { return settings; }, state,
        log, persist, checkpoint, choosePurchase, pokeWrinkler, clickElf, windowAchievements, isInputBusy: () => busyUntil > Date.now() });
      game.registerMod('CookiePilot Legit', { init() { log('CookiePilot bereit.'); },
        save() { return JSON.stringify({ version: 1 }); } });
      initialized = true;
      if (String(game.version) !== '2.052') log(`Spielversion ${game.version}: Kompatibilitätshinweis; Basisstrategie für 2.052. Spezialeffekte prüfen.`);
    } catch (err) { fail(err); }
  }
  async function start() {
    initialize();
    if (!initialized) throw new Error(error || 'Cookie Clicker lädt noch.');
    if (running) { persist({ running: true }); return status(); }
    if (startPending) return status();
    if (window.AutoPlay?.autoPlayer) throw new Error('Original-CookieBot läuft bereits. Deaktiviere ihn und lade das Spiel neu.');
    startPending = true;
    try {
      // One player per browser origin/save; do not race two tabs writing the same save.
      let locked = false;
      if (navigator.locks) {
        await new Promise((resolve, reject) => {
          navigator.locks.request('cookiepilot:' + game.SaveTo, { ifAvailable: true }, lock => {
            if (!lock) { resolve(); return; }
            locked = true;
            return new Promise(release => { unlock = release; resolve(); });
          }).catch(reject);
        });
        if (!locked) {
          const busy = new Error('CookiePilot spielt diesen Spielstand bereits in einem anderen Tab.');
          busy.code = 'TAB_BUSY'; throw busy;
        }
      }
      await backup(state.everStarted ? 'Vor Fortsetzung' : 'Vor dem ersten Start');
      error = ''; strategy.finished = false;
      strategy.findNextAchievement();
      running = true; nextBackup = Date.now() + 900000;
      persist({ everStarted: true, running: true }); log('Automatik gestartet.');
      return status();
    } catch (err) { if (unlock) { unlock(); unlock = null; } throw err; }
    finally { startPending = false; }
  }
  function pause() {
    running = false; persist({ running: false });
    if (unlock) { unlock(); unlock = null; }
    log('Automatik pausiert.'); return status();
  }
  function fail(err) { error = String(err?.message || err); pause(); log('Fehler: ' + error); }
  function startFailed(err) {
    if (err.code === 'TAB_BUSY') { error = err.message; log(error); }
    else fail(err);
  }
  function achievements() {
    if (!game) return [];
    const waiting = new Set(['Just plain lucky','So much to do so much to see','All-natural cane sugar','Last Chance to See']);
      const manual = new Set(['Cookie-dunker','Stifling the press']);
    return game.AchievementsById.filter(Boolean).map(a => ({ id: a.id, name: a.name,
      description: strip(a.ddesc || a.desc), won: !!a.won, shadow: a.pool === 'shadow',
      status: a.won ? 'Erreicht' : a.name === 'Cheated cookies taste awful' ? 'Ausgeschlossen: erfordert Cheaten' :
        a.pool === 'dungeon' ? 'Im Spiel nicht verfügbar' : manual.has(a.name) ?
          (settings.windowAchievements ? 'Automatische echte Fenstergröße' : 'Echte Fenstergröße erforderlich') :
        waiting.has(a.name) ? 'Echte Wartezeit / Zufall' : a.id === strategy?.nextAchievement ? 'Aktuelles Ziel' : 'Offen',
      excluded: a.pool === 'dungeon' || a.name === 'Cheated cookies taste awful' }));
  }
  function status() {
    const catalog = achievements(), legit = catalog.filter(a => !a.excluded), achieved = legit.filter(a => a.won).length;
    return { ok: true, initialized, running, startPending, error, settings, version: game?.version || null,
      goal: strip(strategy?.mainActivity || 'Cookie Clicker laden, dann starten.'),
      activities: strip(strategy?.activities), neverclick: game ? challengeNoClick() : false,
      cookies: game?.cookies || 0, cps: game?.cookiesPs || 0, achieved, total: legit.length,
      lastBackup, planTime: lastPlan, plan: purchasePlan, logs: logs.slice(0, 12),
      compatibility: game && String(game.version) !== '2.052' ? 'Basisstrategie: 2.052; diese Spielversion benötigt zusätzliche Prüfung.' : '',
      hint: running && document.hidden ? 'Hintergrund-Tab: Chrome kann Spiel und Bot drosseln.' :
        game?.onMenu || game?.promptOn ? 'Spielmenü geöffnet: Automatik wartet.' : '',
      horizonHours: settings.horizonHours };
  }
  window.addEventListener('message', async event => {
    const data = event.data;
    if (event.source !== window || event.origin !== location.origin || data?.channel !== channel || data.direction !== 'to-page') return;
    if (data.type === 'checkpoint-result' && saves.has(data.id)) {
      const saved = saves.get(data.id); saves.delete(data.id); clearTimeout(saved.timer);
      if (data.ok) { lastBackup = data.time; saved.resolve(data.time); }
      else saved.reject(new Error(data.error || 'Lokaler Speicher voll'));
    }
    if (data.type === 'window-adjusted' && running && game?.tickerL) game.tickerL.click();
    if (data.type === 'configure') {
      if (!configured) { state = data.state || {}; saveSettings(data.settings); configured = true; }
      initialize();
      if (initialized && !configuredResume) {
        configuredResume = true;
        if (state.running && settings.resume) start().catch(startFailed);
      }
    }
    if (data.type === 'command') {
      try {
        let result;
        if (data.command === 'start') result = await start();
        else if (data.command === 'pause') result = pause();
        else if (data.command === 'settings') { saveSettings(data.value); result = status(); }
        else if (data.command === 'status') result = status();
        else if (data.command === 'achievements') result = { ok: true, achievements: achievements() };
        else if (data.command === 'export') {
          if (!game) throw new Error('Spiel nicht bereit');
          result = { ok: true, save: game.WriteSave(1) };
        } else if (data.command === 'backup') { await backup('Manuelle Sicherung'); result = status(); }
        else return;
        send({ type: 'response', id: data.id, result });
      } catch (err) { send({ type: 'response', id: data.id, result: { ok: false, error: err.message } }); }
    }
  });
  window.CookiePilot = Object.freeze({ status, pause, start, achievements });
  setInterval(() => {
    if (!initialized) { initialize(); if (!configured) send({ type: 'ready' }); }
    if (initialized && state.running && settings.resume && !configuredResume) {
      configuredResume = true; start().catch(startFailed);
    }
    if (!running || !game?.ready) return;
    if (game.onMenu || game.promptOn) return;
    const now = Date.now();
    try {
      if (now >= nextBackup) {
        nextBackup = now + 900000; backup('Automatische Sicherung').catch(fail);
      }
      if (!game.OnAscend && now - lastClick >= 1000 / clickRates[settings.speed]) {
        lastClick = now; strategy.handleClicking();
      }
      if (now - lastStrategy >= 250) { lastStrategy = now; strategy.run(); }
    } catch (err) { fail(err); }
  }, 25);
  send({ type: 'ready' });
})();
