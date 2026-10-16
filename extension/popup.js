/* Auto Cookie Clicker Plugin Chrom — GPL-3.0-only. */
'use strict';
const $ = id => document.getElementById(id);
let tab, current = null, catalog = [], loading = false, timer;
const number = n => Number.isFinite(n) ? new Intl.NumberFormat('de-DE', { notation: 'compact', maximumFractionDigits: 2 }).format(n) : '—';
const duration = n => !Number.isFinite(n) ? '—' : n < 60 ? `${Math.ceil(n)} s` : n < 3600 ? `${(n / 60).toFixed(1)} min` : n < 86400 ? `${(n / 3600).toFixed(1)} h` : `${(n / 86400).toFixed(1)} Tage`;
function showError(message) { $('error').textContent = message; $('error').hidden = !message; }
async function command(command, value) {
  if (!tab) throw new Error('Cookie Clicker im aktiven Tab öffnen und die Seite nach der Installation einmal neu laden.');
  const result = await chrome.tabs.sendMessage(tab.id, { channel: 'cookiepilot-legit-v1', command, value });
  if (!result?.ok) throw new Error(result?.error || 'Keine Antwort vom Spiel');
  return result;
}
function render(status) {
  current = status;
  $('state').textContent = status.running ? 'Läuft' : status.startPending ? 'Startet' : 'Pausiert';
  $('state').classList.toggle('active', status.running);
  $('toggle').disabled = !status.initialized || status.startPending;
  $('toggle').textContent = status.running ? 'Automatik pausieren' : 'Automatik starten';
  $('goal').textContent = status.neverclick && status.running ? 'True Neverclick: auf goldene Cookies warten, den großen Cookie nicht anklicken.' : status.goal;
  $('hint').textContent = status.hint;
  $('cookies').textContent = number(status.cookies); $('cps').textContent = number(status.cps);
  $('progress').textContent = `${status.achieved} / ${status.total}`;
  $('bar').max = Math.max(1, status.total); $('bar').value = status.achieved;
  for (const key of ['speed', 'autoAscend', 'resume', 'windowAchievements']) {
    if ($(key) === document.activeElement) continue;
    if ($(key).type === 'checkbox') $(key).checked = status.settings[key]; else $(key).value = status.settings[key];
  }
  if ($('horizon') !== document.activeElement) $('horizon').value = status.settings.horizonHours;
  const plan = status.plan, target = plan?.target;
  $('decision').textContent = target ? `${target.name} · ${number(target.price)} Cookies\n+${number(target.delta)} Cookies/s · Amortisation ${duration(target.payback)}\n${target.wait > 0 ? `Sparen: etwa ${duration(target.wait)}. ` : ''}${target.reason}` : plan?.waiting || 'Berechnung beginnt mit der Automatik.';
  $('alternatives').replaceChildren();
  for (const item of plan?.alternatives || []) {
    const row = document.createElement('tr'); row.classList.toggle('rejected', !item.paysWithinHorizon);
    row.title = `${item.reason}. ${item.confidence}. ${item.paysWithinHorizon ? 'Im Planungshorizont rentabel.' : 'Amortisiert sich im Planungshorizont nicht.'}`;
    for (const value of [item.name, number(item.delta), duration(item.payback)]) { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); }
    $('alternatives').append(row);
  }
  $('lastBackup').textContent = status.lastBackup ? `Letzte bestätigte Sicherung: ${new Date(status.lastBackup).toLocaleString('de-DE')}` : 'Noch keine Sicherung in dieser Sitzung.';
  $('compatibility').textContent = status.compatibility; $('compatibility').hidden = !status.compatibility;
  $('version').textContent = `Spiel ${status.version || 'lädt'} · Erweiterung ${chrome.runtime.getManifest().version} · CookieBot-Basis 2.052`;
  $('logs').replaceChildren();
  for (const entry of status.logs || []) { const li = document.createElement('li'); li.textContent = `${new Date(entry.time).toLocaleTimeString('de-DE')} · ${entry.message}`; $('logs').append(li); }
  if (status.error) showError(status.error);
}
function renderAchievements() {
  $('achievements').replaceChildren();
  const query = $('search').value.toLocaleLowerCase();
  for (const a of catalog.filter(a => !query || (a.name + ' ' + a.description + ' ' + a.status).toLocaleLowerCase().includes(query)).sort((a, b) => Number(a.won) - Number(b.won))) {
    const div = document.createElement('div'); div.className = 'achievement' + (a.won ? ' done' : '');
    div.append(document.createTextNode(`${a.won ? '✓' : '○'} ${a.name}${a.shadow ? ' · Schatten' : ''}`));
    const detail = document.createElement('span'); detail.textContent = `${a.status} · ${a.description}`; div.append(detail); $('achievements').append(div);
  }
  $('missingCount').textContent = `· ${catalog.filter(a => !a.won && !a.excluded).length} offen`;
}
function download(name, content, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');
async function refresh() {
  if (loading) return;
  loading = true;
  try { render(await command('status')); } catch (err) { showError(err.message); }
  finally { loading = false; }
}
async function act(task) {
  showError('');
  try { await task(); await refresh(); } catch (err) { showError(err.message); }
}
$('toggle').addEventListener('click', () => act(async () => { $('toggle').disabled = true; render(await command(current?.running ? 'pause' : 'start')); }));
$('backup').addEventListener('click', () => act(() => command('backup')));
$('export').addEventListener('click', () => act(async () => download(`CookieClicker-${stamp()}.txt`, (await command('export')).save)));
$('saved').addEventListener('click', () => act(async () => {
  const key = 'backups:' + new URL(tab.url).origin + new URL(tab.url).pathname.replace(/index\.html$/, '');
  const saved = (await chrome.storage.local.get(key))[key] || [];
  if (!saved.length) throw new Error('Noch keine Sicherung vorhanden. Erst „Sichern“ anklicken.');
  download(`CookieClicker-Backup-${new Date(saved[0].time).toISOString().replace(/[:.]/g, '-')}.txt`, saved[0].save);
}));
$('report').addEventListener('click', () => act(async () => {
  catalog = (await command('achievements')).achievements;
  download(`CookieClicker-Bericht-${stamp()}.json`, JSON.stringify({ time: new Date().toISOString(), status: current, achievements: catalog }, null, 2), 'application/json');
}));
$('search').addEventListener('input', renderAchievements);
for (const id of ['speed','horizon','autoAscend','resume','windowAchievements']) $(id).addEventListener('change', () => act(async () => {
  render(await command('settings', { speed: $('speed').value, horizonHours: Number($('horizon').value), autoAscend: $('autoAscend').checked, resume: $('resume').checked, windowAchievements: $('windowAchievements').checked }));
}));
(async () => {
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url || !/^https?:\/\/(orteil\.dashnet\.org|cookieclicker\.eu)\/cookieclicker\//.test(tab.url)) tab = null;
    await refresh();
    if (tab) { catalog = (await command('achievements')).achievements; renderAchievements(); }
    timer = setInterval(refresh, 1500);
  } catch (err) { showError(err.message); }
})();
