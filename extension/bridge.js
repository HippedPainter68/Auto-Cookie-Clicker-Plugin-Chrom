/* CookiePilot Legit — GPL-3.0-only. Extension storage stays in the isolated world. */
(function() {
  'use strict';
  const channel = 'cookiepilot-legit-v1';
  const profile = location.origin + location.pathname.replace(/index\.html$/, '');
  const settingsKey = 'settings:' + profile;
  const backupsKey = 'backups:' + profile;
  const stateKey = 'state:' + profile;
  const pending = new Map();
  const allowed = new Set(['start', 'pause', 'status', 'settings', 'export', 'achievements', 'backup']);
  function post(payload) { window.postMessage({ channel, direction: 'to-page', ...payload }, location.origin); }
  async function configure() {
    const saved = await chrome.storage.local.get([settingsKey, stateKey]);
    post({ type: 'configure', settings: saved[settingsKey] || {}, state: saved[stateKey] || {} });
  }
  window.addEventListener('message', async event => {
    const data = event.data;
    if (event.source !== window || event.origin !== location.origin || data?.channel !== channel || data.direction !== 'from-page') return;
    try {
      if (data.type === 'ready') await configure();
      if (data.type === 'settings') await chrome.storage.local.set({ [settingsKey]: data.settings });
      if (data.type === 'state') await chrome.storage.local.set({ [stateKey]: data.state });
      if (data.type === 'window-achievements') {
        await chrome.runtime.sendMessage({ command: 'window-achievements' });
        post({ type: 'window-adjusted' });
      }
      if (data.type === 'checkpoint') {
        if (typeof data.save !== 'string' || data.save.length < 5 || data.save.length > 2e6) throw new Error('Ungültige Sicherung');
        const stored = await chrome.storage.local.get(backupsKey);
        const entries = stored[backupsKey] || [];
        const entry = { time: Date.now(), reason: String(data.reason).slice(0, 240), version: String(data.version), save: data.save };
        const first = entries.find(e => e.reason === 'Vor dem ersten Start');
        const ascends = entries.filter(e => e.reason.startsWith('Vor Aufstieg')).slice(0, 3);
        const ring = [entry, ...entries.filter(e => e !== first && !ascends.includes(e))].slice(0, 10);
        for (const keep of [...ascends, first].filter(Boolean)) if (!ring.some(e => e.time === keep.time)) ring.push(keep);
        await chrome.storage.local.set({ [backupsKey]: ring });
        post({ type: 'checkpoint-result', id: data.id, ok: true, time: entry.time });
      }
      if (data.type === 'response' && pending.has(data.id)) {
        const item = pending.get(data.id); pending.delete(data.id); clearTimeout(item.timer); item.reply(data.result);
      }
    } catch (error) {
      if (data.type === 'checkpoint') post({ type: 'checkpoint-result', id: data.id, ok: false, error: error.message });
    }
  });
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (message?.channel !== channel || !allowed.has(message.command)) return false;
    const id = crypto.randomUUID();
    const timer = setTimeout(() => {
      pending.delete(id); reply({ ok: false, error: 'Spiel antwortet nicht. Cookie Clicker vollständig laden und neu versuchen.' });
    }, 12000);
    pending.set(id, { reply, timer });
    post({ type: 'command', id, command: message.command, value: message.value });
    return true;
  });
  configure().catch(() => {});
})();
