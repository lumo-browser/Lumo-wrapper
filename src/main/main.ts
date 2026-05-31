/**
 * Electron main process entry point
 * Self-contained — no shared imports from renderer code
 */

import { app, BrowserWindow, Menu, session, ipcMain } from 'electron';
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
  console.log('[Nova] Creating main window');

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
  const url = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../index.html')}`;

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

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    console.log('[Nova] Window closed');
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
  console.log('[Nova] App ready');

  // Handle ad blocker state changes from the renderer
  ipcMain.on('nova:set-ad-blocker', (event, enabled) => {
    console.log(`[Nova] Ad blocker ${enabled ? 'enabled' : 'disabled'}`);
    isAdBlockerEnabled = enabled;
  });

  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  console.log('[Nova] All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('[Nova] App activated');
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  console.log('[Nova] App quitting');
});
