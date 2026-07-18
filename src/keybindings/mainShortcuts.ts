import { app, BrowserWindow, globalShortcut } from 'electron';

export function setupMainShortcuts(mainWindow: BrowserWindow | null) {
  // Global shortcut (works even when app is not focused, use sparingly)
  globalShortcut.register('CommandOrControl+J', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('lumo:shortcut', 'toggle-downloads');
    }
  });
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('lumo:shortcut', 'toggle-inspector');
    }
  });
  console.log('[Lumo] Global shortcuts registered');

  // Intercept navigation shortcuts even when inside webviews
  app.on('web-contents-created', (_event, wc) => {
    wc.on('before-input-event', (_event, input) => {
      // Only intercept for webviews (guest contents). The main window is handled natively by React.
      if (wc.getType() !== 'webview') return;

      if (input.alt && (input.key === 'ArrowLeft' || input.code === 'ArrowLeft') && input.type === 'keyDown') {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('lumo:shortcut', 'go-back');
        }
        event.preventDefault();
      }
      if (input.alt && (input.key === 'ArrowRight' || input.code === 'ArrowRight') && input.type === 'keyDown') {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('lumo:shortcut', 'go-forward');
        }
        event.preventDefault();
      }
      if ((input.control || input.meta) && (input.key.toLowerCase() === 'w' || input.code === 'KeyW') && input.type === 'keyDown') {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('lumo:shortcut', 'close-tab');
        }
        event.preventDefault();
      }
      if ((input.control || input.meta) && (input.key.toLowerCase() === 't' || input.code === 'KeyT') && input.type === 'keyDown') {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('lumo:shortcut', 'new-tab');
        }
        event.preventDefault();
      }
    });
  });
}
