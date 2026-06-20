/**
 * Lumo Browser - Electron main process entry point
 * Self-contained — no shared imports from renderer code
 */

import { app, BrowserWindow, Menu, MenuItem, session, ipcMain, nativeTheme, safeStorage, shell, globalShortcut } from 'electron';
import https from 'https';
import path from 'path';
import { shouldBlock, AdBlockerStats, AdBlockerConfig, DEFAULT_CONFIG } from './adBlocker';

// ── Ad Blocker State ──────────────────────────────────────────────────────────
let adBlockerConfig: AdBlockerConfig = { ...DEFAULT_CONFIG };
const adBlockerStats = new AdBlockerStats();


let mainWindow: BrowserWindow | null = null;

// Bypass Google's "unsupported browser" by globally spoofing a modern Chrome user agent
app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36';

// ── Aggressive Memory & Performance Optimizations ──
// Reduce V8 engine memory limit for the main process and renderers
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=512');
// Disable heavy background Chromium features that aren't strictly necessary for a lightweight browser
app.commandLine.appendSwitch('disable-features', 'Translate,OptimizationHints,MediaRouter,DialMediaRouteProvider,CalculateNativeWinOcclusion,InterestFeedContentSuggestions,ChromeWhatsNewUI');
// Enable Chrome's native Memory Saver mode to proactively discard unused tabs and free RAM
app.commandLine.appendSwitch('enable-features', 'MemorySaverMode');
// Disable IPC flood in background tabs
app.commandLine.appendSwitch('disable-background-timer-throttling', 'false');

function createWindow(): void {
  console.log('[Lumo] Creating main window');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false,
      webviewTag: true,
    },
  });

  const isDev = !app.isPackaged;
  const url = isDev ? 'http://127.0.0.1:5173' : `file://${path.join(__dirname, '../index.html')}`;

  // ── Ad Blocker — attach to ALL sessions used by the app ──────────────────
  // The <webview> tags use partition="persist:nova-main" which is a SEPARATE
  // session from defaultSession. We must hook BOTH or webview traffic bypasses
  // the blocker entirely.
  const attachAdBlocker = (sess: Electron.Session) => {
    sess.webRequest.onBeforeRequest(
      { urls: ['<all_urls>'] },
      (details, callback) => {
        const blocked = shouldBlock(details.url, adBlockerConfig);
        adBlockerStats.record(blocked);
        if (blocked) {
          console.log(`[AdBlock] Blocked: ${details.url}`);
        }
        callback({ cancel: blocked });
      }
    );
  };

  attachAdBlocker(session.defaultSession);              // renderer
  attachAdBlocker(session.fromPartition('persist:nova-main')); // all <webview> tabs

  mainWindow.loadURL(url);

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Lumo] Window content loaded successfully');
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('[Lumo] Renderer process crashed');
  });

  mainWindow.webContents.on('unresponsive', () => {
    console.error('[Lumo] Renderer process unresponsive');
  });

  mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('[Lumo] Preload error:', preloadPath, error);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('[Lumo] Render process gone:', details);
  });

  // DevTools can be opened manually with Ctrl+Shift+I if needed
  // if (isDev) {
  //   mainWindow.webContents.openDevTools();
  // }

  mainWindow.on('closed', () => {
    console.log('[Lumo] Window closed');
    mainWindow = null;
  });
}

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: (): void => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on('ready', () => {
  console.log('[Lumo] App ready');

  // Handle ad blocker toggle + config from renderer
    ipcMain.on('lumo:set-ad-blocker', (event, enabled: boolean) => {
      console.log(`[Lumo] Ad blocker ${enabled ? 'enabled' : 'disabled'}`);
      adBlockerConfig = { ...adBlockerConfig, enabled };
    });

    ipcMain.on('lumo:set-ad-blocker-config', (event, config: Partial<AdBlockerConfig>) => {
      adBlockerConfig = { ...adBlockerConfig, ...config };
      console.log('[Lumo] Ad blocker config updated:', adBlockerConfig);
    });

    ipcMain.handle('lumo:get-ad-blocker-stats', () => {
      return adBlockerStats.toJSON();
    });

    ipcMain.on('lumo:reset-ad-blocker-stats', () => {
      adBlockerStats.reset();
    });

    // Handle global theme changes from the renderer
    ipcMain.on('lumo:set-theme', (event, theme: 'dark' | 'light' | 'system') => {
      console.log(`[Lumo] Global theme set to ${theme}`);
      nativeTheme.themeSource = theme;
    });

    // Default zoom — apply to the persist:nova-main session
    ipcMain.on('lumo:set-default-zoom', (event, factor: number) => {
      console.log(`[Lumo] Default zoom set to ${factor}`);
      // Zoom is applied per-webContents by the renderer; stored for new tabs
    });

    // Spell check
    ipcMain.on('lumo:set-spell-check', (event, enabled: boolean) => {
      if (session.defaultSession) {
        session.defaultSession.setSpellCheckerEnabled(enabled);
      }
      session.fromPartition('persist:nova-main').setSpellCheckerEnabled(enabled);
      console.log(`[Lumo] Spell check ${enabled ? 'enabled' : 'disabled'}`);
    });

    ipcMain.on('lumo:set-hardware-acceleration', (event, enabled: boolean) => {
      // Note: Hardware acceleration can typically only be disabled before app is ready.
      // A full implementation would persist this preference and read it on next boot.
      console.log('Hardware acceleration set to', enabled, '(requires restart)');
    });

    ipcMain.on('lumo:set-memory-saver', (event, enabled: boolean) => {
      // Memory saver implementation placeholder. A full implementation would
      // suspend background WebContents using webContents.backgroundThrottling
      console.log('Memory saver set to', enabled);
    });

    // Toggle main window DevTools (used by home/internal pages)
    ipcMain.on('lumo:toggle-devtools', () => {
      if (!mainWindow) return;
      const wc = mainWindow.webContents;
      if (wc.isDevToolsOpened()) {
        wc.closeDevTools();
      } else {
        wc.openDevTools({ mode: 'detach' });
      }
    });

    // Inspect element at coordinates in the main renderer (internal pages)
    ipcMain.on('lumo:inspect-element', (_event, x: number, y: number) => {
      if (!mainWindow) return;
      const wc = mainWindow.webContents;
      wc.inspectElement(x, y);
    });

    // Download path + alwaysAsk
    ipcMain.on('lumo:set-download-path', (event, { path: dlPath, alwaysAsk }: { path: string; alwaysAsk: boolean }) => {
      const handleDownload = (_event: Electron.Event, item: Electron.DownloadItem) => {
        if (alwaysAsk) {
          // Let Electron show the save dialog (default behavior)
          return;
        }
        const expanded = dlPath.startsWith('~')
          ? dlPath.replace('~', require('os').homedir())
          : dlPath;
        const safeName = item.getFilename().replace(/[/\\?%*:|"<>]/g, '-');
        item.setSavePath(require('path').join(expanded, safeName));
      };
      session.defaultSession.removeAllListeners('will-download');
      session.fromPartition('persist:nova-main').removeAllListeners('will-download');
      session.defaultSession.on('will-download', handleDownload);
      session.fromPartition('persist:nova-main').on('will-download', handleDownload);
      console.log(`[Lumo] Download path set to ${dlPath}, alwaysAsk=${alwaysAsk}`);
    });

    // Folder picker dialog
    ipcMain.handle('lumo:pick-download-folder', async () => {
      const { dialog } = require('electron');
      const result = await dialog.showOpenDialog(mainWindow!, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Choose Download Folder',
      });
      return result.canceled ? null : result.filePaths[0];
    });

    // ── Download tracking — push progress events to renderer ──────────────────
    const os = require('os');
    const pathMod = require('path');
    let downloadCounter = 0;

    const handleDownloadItem = (_event: Electron.Event, item: Electron.DownloadItem) => {
      const id = `dl-${Date.now()}-${++downloadCounter}`;
      const filename = item.getFilename();

      // Auto-save to Downloads folder unless user configured a custom path
      const savePath = pathMod.join(os.homedir(), 'Downloads', filename.replace(/[\/\\?%*:|"<>]/g, '-'));
      item.setSavePath(savePath);

      const baseItem = {
        id,
        filename,
        url: item.getURL(),
        savePath,
        state: 'progressing' as const,
        receivedBytes: 0,
        totalBytes: item.getTotalBytes(),
        startedAt: Date.now(),
        mimeType: item.getMimeType(),
      };

      // Send initial event
      mainWindow?.webContents.send('lumo:download-progress', { ...baseItem });

      item.on('updated', (_e, state) => {
        mainWindow?.webContents.send('lumo:download-progress', {
          ...baseItem,
          state,
          receivedBytes: item.getReceivedBytes(),
          totalBytes: item.getTotalBytes(),
          savePath: item.getSavePath(),
        });
      });

      item.once('done', (_e, state) => {
        mainWindow?.webContents.send('lumo:download-progress', {
          ...baseItem,
          state,
          receivedBytes: item.getReceivedBytes(),
          totalBytes: item.getTotalBytes(),
          savePath: item.getSavePath(),
          endedAt: Date.now(),
        });
        console.log(`[Lumo] Download ${state}: ${filename} → ${item.getSavePath()}`);
      });
    };

    // Attach download listener to both sessions
    session.defaultSession.on('will-download', handleDownloadItem);
    session.fromPartition('persist:nova-main').on('will-download', handleDownloadItem);

    // Open file with default OS app
    ipcMain.on('lumo:open-file', (_event, filePath: string) => {
      shell.openPath(filePath).catch(err => console.error('[Lumo] open-file failed:', err));
    });

    // Reveal file in OS file manager
    ipcMain.on('lumo:show-item-in-folder', (_event, filePath: string) => {
      shell.showItemInFolder(filePath);
    });

    // Navigate to downloads page (triggered by toolbar download button)
    ipcMain.on('lumo:open-downloads', () => {
      mainWindow?.webContents.send('lumo:navigate', 'lumo://downloads');
    });

    // Proxy settings
    ipcMain.on('lumo:set-proxy', (event, { type, host, port }: { type: string; host: string; port: string }) => {
      let proxyRules = '';
      if (type === 'none') {
        proxyRules = 'direct://';
      } else if (type === 'manual' && host && port) {
        proxyRules = `http=${host}:${port};https=${host}:${port}`;
      }
      if (proxyRules) {
        session.defaultSession.setProxy({ proxyRules });
        session.fromPartition('persist:nova-main').setProxy({ proxyRules });
        console.log(`[Lumo] Proxy set: ${proxyRules}`);
      }
    });

    // Test proxy connectivity
    ipcMain.handle('lumo:test-proxy', async (event, { type, host, port }: { type: string; host: string; port: string }) => {
      if (type === 'none') return true;
      if (!host || !port) throw new Error('No host/port configured');
      // Quick TCP check using Node net
      return new Promise<boolean>((resolve, reject) => {
        const net = require('net');
        const socket = new net.Socket();
        socket.setTimeout(5000);
        socket.on('connect', () => { socket.destroy(); resolve(true); });
        socket.on('error', (err: Error) => { socket.destroy(); reject(err); });
        socket.on('timeout', () => { socket.destroy(); reject(new Error('Timeout')); });
        socket.connect(parseInt(port), host);
      });
    });

    // Import browser data (stub — opens a file dialog for HTML bookmarks)
    ipcMain.on('lumo:import-browser-data', async () => {
      const { dialog } = require('electron');
      const result = await dialog.showOpenDialog(mainWindow!, {
        title: 'Import Browser Data',
        filters: [{ name: 'HTML Bookmarks', extensions: ['html', 'htm'] }],
        properties: ['openFile'],
      });
      if (!result.canceled && result.filePaths[0]) {
        console.log(`[Lumo] Import browser data from: ${result.filePaths[0]}`);
        // TODO: parse and import bookmarks from HTML file
      }
    });

  // Securely save/load API keys
    ipcMain.handle('lumo:save-key', (event, key: string) => {
      try {
        if (!key) return '';
        if (safeStorage.isEncryptionAvailable()) {
          const encrypted = safeStorage.encryptString(key);
          return encrypted.toString('base64');
        }
        return Buffer.from(key).toString('base64'); // Fallback
      } catch (err) {
        console.error('[Lumo] Failed to save key securely', err);
        return '';
      }
    });

    ipcMain.handle('lumo:load-key', (event, base64Key: string) => {
      try {
        if (!base64Key) return '';
        const buffer = Buffer.from(base64Key, 'base64');
        if (safeStorage.isEncryptionAvailable()) {
          return safeStorage.decryptString(buffer);
        }
        return buffer.toString('utf-8'); // Fallback
      } catch (err) {
        console.error('[Lumo] Failed to load key', err);
    }
  });

  ipcMain.handle('lumo:openrouter-chat', async (_event, payload: {
    apiKey: string;
    model: string;
    messages: Array<{ role: string; content: string }>;
    tools?: unknown[];
    tool_choice?: string;
  }) => {
    try {
      // Keep ONLY printable ASCII (0x20-0x7E). Node's http module rejects
      // any character outside this range in header values — including unicode
      // spaces, newlines, null bytes, and chars above 0x7F.
      const rawKey = (payload.apiKey || '').replace(/^Bearer\s+/i, '').trim();
      const apiKey = rawKey.replace(/[^\x20-\x7E]/g, '');

      // Debug: log any stripped chars so we can identify the source
      if (apiKey.length !== rawKey.length) {
        const badChars = [...rawKey]
          .filter(c => c.charCodeAt(0) < 0x20 || c.charCodeAt(0) > 0x7E)
          .map(c => 'U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'))
          .join(', ');
        console.warn('[Lumo] API key had invalid header chars stripped: ' + badChars);
      }

      console.log('[Lumo] OpenRouter: model=' + payload.model + ' keyLen=' + apiKey.length + ' keyStart=' + apiKey.substring(0, 8) + '...');

      if (!apiKey) {
        return { error: { message: 'Missing or invalid OpenRouter API key. Go to Settings and re-enter your key.' } };
      }
      if (!apiKey.startsWith('sk-')) {
        console.warn('[Lumo] API key does not start with sk- — sending anyway');
      }

      const body = JSON.stringify({
        model: payload.model,
        messages: payload.messages,
        tools: payload.tools,
        tool_choice: payload.tool_choice || 'auto',
      });

      const data = await new Promise<any>((resolve) => {
        const req = https.request(
          {
            hostname: 'openrouter.ai',
            path: '/api/v1/chat/completions',
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(body),
              'HTTP-Referer': 'https://nova-browser.local',
              'X-Title': 'Nova Browser',
            },
          },
          (res) => {
            let raw = '';
            res.setEncoding('utf8');
            res.on('data', chunk => { raw += chunk; });
            res.on('end', () => {
              let parsed: any = null;
              try {
                parsed = raw ? JSON.parse(raw) : null;
              } catch {
                parsed = { raw };
              }

              if ((res.statusCode || 500) >= 400) {
                const message = parsed?.error?.message || parsed?.message || `OpenRouter request failed with status ${res.statusCode}`;
                resolve({ error: { message, status: res.statusCode } });
                return;
              }

              resolve({ data: parsed });
            });
          }
        );

        req.on('error', (err) => {
          resolve({ error: { message: err.message } });
        });

        req.write(body);
        req.end();
      });

      return data;
    } catch (err: any) {
      console.error('[Lumo] OpenRouter request failed', err);
      return { error: { message: err?.message || 'OpenRouter request failed' } };
    }
  });


  // ── Vision Agent IPC Handlers ────────────────────────────────────────────

  /**
   * lumo:capture-webview
   * Captures a JPEG screenshot of the focused webview's webContents.
   * Returns { base64: string } with the image data for the VLM.
   */
  ipcMain.handle('lumo:capture-webview', async () => {
    if (!mainWindow) return { base64: '' };
    try {
      // capturePage captures the entire renderer, including the webview
      const image = await mainWindow.webContents.capturePage();
      const jpeg = image.toJPEG(85); // 85% quality — good balance for VLMs
      return { base64: jpeg.toString('base64') };
    } catch (err: any) {
      console.error('[Lumo] capturePage failed:', err?.message);
      return { base64: '' };
    }
  });

  /**
   * lumo:native-click
   * Sends real mouse down/up events at pixel (x, y) to the focused webview.
   * These are native OS-level events that bypass JS .click() detection.
   */
  ipcMain.handle('lumo:native-click', async (_event, { x, y }: { x: number; y: number }) => {
    if (!mainWindow) return;
    try {
      const wc = mainWindow.webContents;
      wc.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 });
      await new Promise(r => setTimeout(r, 50));
      wc.sendInputEvent({ type: 'mouseUp',   x, y, button: 'left', clickCount: 1 });
      console.log(`[Lumo] Native click at (${x}, ${y})`);
    } catch (err: any) {
      console.error('[Lumo] Native click failed:', err?.message);
    }
  });

  /**
   * lumo:native-key
   * Sends a native keyboard keyDown/keyUp event to the focused webview.
   */
  ipcMain.handle('lumo:native-key', async (_event, { key }: { key: string }) => {
    if (!mainWindow) return;
    try {
      const wc = mainWindow.webContents;
      wc.sendInputEvent({ type: 'keyDown', keyCode: key } as any);
      await new Promise(r => setTimeout(r, 30));
      wc.sendInputEvent({ type: 'keyUp',   keyCode: key } as any);
      console.log(`[Lumo] Native key: ${key}`);
    } catch (err: any) {
      console.error('[Lumo] Native key failed:', err?.message);
    }
  });

  createWindow();
  // Disable native menu bar — Lumo uses custom menu in UI
  // createMenu();

  // ── Global keyboard shortcuts ─────────────────────────────────────────────
  // Register AFTER window creation. These fire at OS level, preventing
  // other apps (e.g. Brave) from intercepting them while Lumo is focused.
  app.whenReady().then(() => {
    // Ctrl+J — toggle Downloads page (Chrome-compatible shortcut)
    globalShortcut.register('CommandOrControl+J', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('lumo:shortcut', 'toggle-downloads');
      }
    });
    console.log('[Lumo] Global shortcuts registered');
  });
});

app.on('window-all-closed', () => {
  console.log('[Lumo] All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('[Lumo] App activated');
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  console.log('[Lumo] App quitting');
  globalShortcut.unregisterAll();
});
