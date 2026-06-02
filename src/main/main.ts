/**
 * Lumo Browser - Electron main process entry point
 * Self-contained — no shared imports from renderer code
 */

import { app, BrowserWindow, Menu, session, ipcMain, nativeTheme, safeStorage } from 'electron';
import path from 'path';

// Global state for ad blocker
let isAdBlockerEnabled = true;

// Basic ad and tracker blocklist
const adDomains = [
  '*://*.doubleclick.net/*',
  '*://*.googleadservices.com/*',
  '*://*.googlesyndication.com/*',
  '*://*.google-analytics.com/*',
  '*://*.facebook.com/tr*',
  '*://*.amazon-adsystem.com/*',
  '*://*.criteo.com/*',
  '*://*.adnxs.com/*',
  '*://*.advertising.com/*',
  '*://*.outbrain.com/*',
  '*://*.taboola.com/*',
  '*://*.rubiconproject.com/*',
  '*://*.openx.net/*',
  '*://*.moatads.com/*',
  '*://*.scorecardresearch.com/*',
  '*://*.quantserve.com/*',
];

let mainWindow: BrowserWindow | null = null;

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

  // Setup ad blocker
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: adDomains },
    (details, callback) => {
      if (isAdBlockerEnabled) {
        // Block the request
        callback({ cancel: true });
      } else {
        // Allow the request
        callback({ cancel: false });
      }
    }
  );

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

  // Handle ad blocker state changes from the renderer
    ipcMain.on('lumo:set-ad-blocker', (event, enabled) => {
      console.log(`[Lumo] Ad blocker ${enabled ? 'enabled' : 'disabled'}`);
      isAdBlockerEnabled = enabled;
    });

    // Handle global theme changes from the renderer
    ipcMain.on('lumo:set-theme', (event, theme: 'dark' | 'light' | 'system') => {
      console.log(`[Lumo] Global theme set to ${theme}`);
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

  createWindow();
  // Disable native menu bar — Lumo uses custom menu in UI
  // createMenu();
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
});
