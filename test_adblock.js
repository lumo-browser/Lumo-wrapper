const { app, session, BrowserWindow } = require('electron');
const { shouldBlock, initLogger, updateFilters, compileRules } = require('../lumo-ad-blocker/lumo-adblocker-rs/index.js');

initLogger();
const lists = updateFilters();
if (lists.length > 0) compileRules(lists);

app.whenReady().then(async () => {
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (d, cb) => {
    if (!d.url.startsWith('http')) { cb({ cancel: false }); return; }
    const r = shouldBlock(d.url, d.referrer || '', 'other');
    cb({ cancel: r.blocked });
  });

  const win = new BrowserWindow({ width: 1280, height: 720,
    webPreferences: { contextIsolation: true, nodeIntegration: false } });

  const fs = require('fs');
  const path = require('path');
  const patch = fs.readFileSync(path.join(__dirname, '../lumo-ad-blocker/lumo-adblocker-rs/resources/youtube_patch.min.js'), 'utf8');

  await win.loadURL('about:blank');
  await new Promise(r => setTimeout(r, 300));

  win.webContents.on('did-navigate', async () => {
    try { await win.webContents.executeJavaScript(patch); } catch(_) {}
  });

  console.log('[TEST] Loading YouTube...');
  await win.loadURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await new Promise(r => setTimeout(r, 25000));

  const r = await win.webContents.executeJavaScript(`
    JSON.stringify({
      loaded: !!window.__lumoYTLoaded,
      adPlacements: ((window.ytInitialPlayerResponse||{}).adPlacements||[]).length,
      playerAds: ((window.ytInitialPlayerResponse||{}).playerAds||[]).length,
      adBH: (window.ytInitialPlayerResponse||{}).adBreakHeartbeatParams,
      plAtt: typeof (window.ytInitialPlayerResponse||{}).playerAttestation,
    })
  `);
  console.log(`[CHECK] ${r}`);

  app.quit();
});
