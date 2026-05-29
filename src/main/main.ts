/**
 * Electron main process entry point
 */

import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { logger } from '../utils/logger';

const SCOPE = 'electron:main';
let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  logger.info(SCOPE, 'Creating main window');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
  });

  const isDev = process.env.NODE_ENV === 'development';
  const url = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../index.html')}`;

  mainWindow.loadURL(url);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    logger.info(SCOPE, 'Window closed');
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
  logger.info(SCOPE, 'App ready');
  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  logger.info(SCOPE, 'All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  logger.info(SCOPE, 'App activated');
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  logger.info(SCOPE, 'App quitting');
});
