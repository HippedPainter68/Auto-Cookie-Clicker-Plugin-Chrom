// The bot runs with the game. This worker only records the installed extension version.
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ installedVersion: chrome.runtime.getManifest().version });
});
const resizing = new Set();
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message?.command !== 'window-achievements' || !sender.tab || sender.id !== chrome.runtime.id) return false;
  const id = sender.tab.windowId;
  if (resizing.has(id)) { reply({ ok: false }); return false; }
  resizing.add(id);
  (async () => {
    let original;
    try {
      original = await chrome.windows.get(id);
      if (!original.focused || original.state === 'minimized') { reply({ ok: false }); return; }
      await chrome.windows.update(id, { state: 'normal' });
      await chrome.windows.update(id, { width: 780, height: 330 });
      reply({ ok: true });
      await new Promise(resolve => setTimeout(resolve, 3500));
    } catch (error) { reply({ ok: false, error: error.message }); }
    finally {
      if (original) {
        try {
          await chrome.windows.update(id, { state: 'normal', left: original.left, top: original.top, width: original.width, height: original.height });
          if (original.state !== 'normal') await chrome.windows.update(id, { state: original.state });
        } catch (_) { /* The user may have closed the window. */ }
      }
      resizing.delete(id);
    }
  })();
  return true;
});
