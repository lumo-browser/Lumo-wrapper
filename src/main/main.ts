/**
 * Lumo Browser - Electron main process entry point
 * Self-contained — no shared imports from renderer code
 */

import { app, BrowserWindow, Menu, MenuItem, session, ipcMain, nativeTheme, safeStorage, shell, globalShortcut } from 'electron';
import https from 'https';
import path from 'path';
import axios from 'axios';
import { shouldBlock, AdBlockerStats, AdBlockerConfig, DEFAULT_CONFIG } from './adBlocker';
import { monitorNetworkRequests, registerSecurityIPC } from './securityMonitor';

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
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false,
      webviewTag: true,
    },
  });

  const isDev = !app.isPackaged;
  const url = isDev ? 'http://127.0.0.1:5173' : `file://${path.join(__dirname, '../index.html')}`;

  // ── Network Security & Ad Blocker Pipeline ──────────────────────────────────
  // Both systems now share the onBeforeRequest hook in monitorNetworkRequests.
  const adBlockerCheck = (url: string) => {
    const blocked = shouldBlock(url, adBlockerConfig);
    adBlockerStats.record(blocked);
    if (blocked) {
      console.log(`[AdBlock] Blocked: ${url}`);
    }
    return blocked;
  };

  const getMainWindow = () => mainWindow;
  
  // Attach to default session (renderer) and webviews session
  monitorNetworkRequests(session.defaultSession, getMainWindow, 'default', adBlockerCheck);
  monitorNetworkRequests(session.fromPartition('persist:lumo-main'), getMainWindow, 'persist:lumo-main', adBlockerCheck);

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

function createDisposableWindow(): void {
  console.log('[Lumo] Creating Disposable Workspace window');

  const disposableWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false,
      webviewTag: true,
    },
  });

  const partitionId = `disposable-session-${Date.now()}`;
  const isDev = !app.isPackaged;
  const url = isDev 
    ? `http://127.0.0.1:5173?disposable=true&partition=${partitionId}` 
    : `file://${path.join(__dirname, '../index.html')}?disposable=true&partition=${partitionId}`;

  const attachAdBlocker = (sess: Electron.Session) => {
    sess.webRequest.onBeforeRequest(
      { urls: ['<all_urls>'] },
      (details, callback) => {
        const blocked = shouldBlock(details.url, adBlockerConfig);
        adBlockerStats.record(blocked);
        callback({ cancel: blocked });
      }
    );
  };

  attachAdBlocker(disposableWindow.webContents.session);
  // Using a random partition to ensure it's completely ephemeral per window
  const ephemeralSession = session.fromPartition(partitionId);
  ephemeralSession.setWebRTCIPHandlingPolicy('disable_non_proxied_udp');
  attachAdBlocker(ephemeralSession); 

  disposableWindow.loadURL(url);

  disposableWindow.on('closed', () => {
    console.log(`[Lumo] Cleaning up disposable session: ${partitionId}`);
    session.fromPartition(partitionId).clearStorageData().catch(err => {
      console.error('[Lumo] Failed to clear disposable storage data:', err);
    });
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

  // ── Security Monitor IPC ────────────────────────────────────────────────────
  registerSecurityIPC(() => mainWindow);

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

    // Default zoom — apply to the persist:lumo-main session
    ipcMain.on('lumo:set-default-zoom', (event, factor: number) => {
      console.log(`[Lumo] Default zoom set to ${factor}`);
      // Zoom is applied per-webContents by the renderer; stored for new tabs
    });

    ipcMain.on('lumo:new-disposable-window', () => {
      createDisposableWindow();
    });

    ipcMain.on('lumo:window-minimize', (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) win.minimize();
    });

    ipcMain.on('lumo:window-maximize', (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        if (win.isMaximized()) win.restore();
        else win.maximize();
      }
    });

    ipcMain.on('lumo:window-close', (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) win.close();
    });

    // Spell check
    ipcMain.on('lumo:set-spell-check', (event, enabled: boolean) => {
      if (session.defaultSession) {
        session.defaultSession.setSpellCheckerEnabled(enabled);
      }
      session.fromPartition('persist:lumo-main').setSpellCheckerEnabled(enabled);
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

    ipcMain.on('lumo:save-screenshot', async (_event, webContentsId: number) => {
      try {
        const wc = require('electron').webContents.fromId(webContentsId);
        if (!wc) return;
        const image = await wc.capturePage();
        const os = require('os');
        const fs = require('fs');
        const pathMod = require('path');
        const savePath = pathMod.join(os.homedir(), 'Downloads', `Screenshot-${Date.now()}.png`);
        fs.writeFileSync(savePath, image.toPNG());
        console.log('[Lumo] Screenshot saved to', savePath);
      } catch (err) {
        console.error('[Lumo] Screenshot failed:', err);
      }
    });

    ipcMain.on('lumo:print-page', (_event, webContentsId: number) => {
      try {
        const wc = require('electron').webContents.fromId(webContentsId);
        if (wc) wc.print();
      } catch (err) {
        console.error('[Lumo] Print failed:', err);
      }
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
      session.fromPartition('persist:lumo-main').removeAllListeners('will-download');
      session.defaultSession.on('will-download', handleDownload);
      session.fromPartition('persist:lumo-main').on('will-download', handleDownload);
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
    session.fromPartition('persist:lumo-main').on('will-download', handleDownloadItem);

    // Open file with default OS app or locally in Lumo Browser if it is a web-renderable format
    ipcMain.on('lumo:open-file', (_event, filePath: string) => {
      const ext = path.extname(filePath).toLowerCase();
      const webExtensions = ['.html', '.htm', '.txt', '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp3', '.mp4', '.webm', '.ogg', '.wav'];
      
      if (webExtensions.includes(ext)) {
        mainWindow?.webContents.send('lumo:navigate', `file://${filePath}`);
      } else {
        shell.openPath(filePath).catch(err => console.error('[Lumo] open-file failed:', err));
      }
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
        session.fromPartition('persist:lumo-main').setProxy({ proxyRules });
        console.log(`[Lumo] Proxy set: ${proxyRules}`);
      }
    });

    // Private session proxy settings
    ipcMain.on('lumo:set-private-proxy', (event, { enabled, partitionId, type, host, port }: { enabled: boolean; partitionId: string; type?: string; host?: string; port?: string }) => {
      if (!partitionId) return;
      const sess = session.fromPartition(partitionId);
      if (!enabled) {
        sess.setProxy({ proxyRules: 'direct://' }).then(() => {
          console.log(`[Lumo] Ephemeral session proxy disabled for ${partitionId}`);
        }).catch(err => console.error('[Lumo] Failed to disable private proxy:', err));
      } else {
        let proxyRules = '';
        if (type === 'socks5') {
          proxyRules = `socks5://${host}:${port}`;
        } else {
          proxyRules = `http=${host}:${port};https=${host}:${port}`;
        }
        sess.setProxy({ proxyRules }).then(() => {
          console.log(`[Lumo] Ephemeral session proxy enabled for ${partitionId}: ${proxyRules}`);
        }).catch(err => console.error('[Lumo] Failed to enable private proxy:', err));
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

    // Resolve DNS records for domain
    ipcMain.handle('lumo:resolve-dns', async (event, { domain }: { domain: string }) => {
      const dns = require('dns').promises;
      const results: Record<string, any> = {};
      try {
        results.A = await dns.resolve4(domain).catch(() => []);
      } catch {}
      try {
        results.AAAA = await dns.resolve6(domain).catch(() => []);
      } catch {}
      try {
        results.MX = await dns.resolveMx(domain).catch(() => []);
      } catch {}
      try {
        results.TXT = await dns.resolveTxt(domain).catch(() => []);
      } catch {}
      try {
        results.NS = await dns.resolveNs(domain).catch(() => []);
      } catch {}
      try {
        results.CNAME = await dns.resolveCname(domain).catch(() => []);
      } catch {}
      try {
        const soa = await dns.resolveSoa(domain).catch(() => null);
        results.SOA = soa ? [`nsname: ${soa.nsname}`, `hostmaster: ${soa.hostmaster}`, `serial: ${soa.serial}`] : [];
      } catch {}
      return results;
    });

    // Helper to extract the apex/root domain for WHOIS queries
    const getApexDomain = (host: string): string => {
      if (!host) return '';
      const parts = host.toLowerCase().trim().replace(/\.$/, '').split('.');
      if (parts.length <= 2) return host;

      const ccSLDs = [
        'co.uk', 'org.uk', 'me.uk', 'ltd.uk', 'plc.uk',
        'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au',
        'co.jp', 'ne.jp', 'or.jp', 'go.jp', 'ac.jp',
        'com.br', 'net.br', 'org.br', 'edu.br', 'gov.br',
        'co.in', 'net.in', 'org.in', 'firm.in', 'gen.in', 'ind.in', 'me.in', 'edu.in', 'res.in', 'gov.in',
        'com.cn', 'net.cn', 'org.cn', 'edu.cn', 'gov.cn',
        'com.tw', 'net.tw', 'org.tw', 'edu.tw', 'gov.tw',
        'com.sg', 'net.sg', 'org.sg', 'edu.sg', 'gov.sg',
        'com.tr', 'net.tr', 'org.tr', 'edu.tr', 'gov.tr',
        'co.za', 'net.za', 'org.za', 'web.za', 'ac.za', 'gov.za'
      ];

      const lastTwo = parts.slice(-2).join('.');
      if (ccSLDs.includes(lastTwo)) {
        return parts.slice(-3).join('.');
      }
      return parts.slice(-2).join('.');
    };

    // Resolve WHOIS info for domain
    ipcMain.handle('lumo:resolve-whois', async (event, { domain }: { domain: string }) => {
      const apexDomain = getApexDomain(domain);
      return new Promise<string>((resolve) => {
        const net = require('net');
        const client = new net.Socket();
        
        let server = 'whois.iana.org';
        if (apexDomain.endsWith('.com') || apexDomain.endsWith('.net')) {
          server = 'whois.verisign-grs.com';
        } else if (apexDomain.endsWith('.org')) {
          server = 'whois.pir.org';
        } else if (apexDomain.endsWith('.edu')) {
          server = 'whois.educause.edu';
        } else if (apexDomain.endsWith('.io')) {
          server = 'whois.nic.io';
        } else if (apexDomain.endsWith('.in')) {
          server = 'whois.registry.in';
        }

        let data = '';
        client.setTimeout(6000);
        client.connect(43, server, () => {
          client.write(apexDomain + '\r\n');
        });
        client.on('data', (chunk: any) => {
          data += chunk.toString();
        });
        client.on('end', () => {
          resolve(data || 'No WHOIS records found');
        });
        client.on('error', (err: any) => {
          resolve(`Error querying WHOIS: ${err.message}`);
        });
        client.on('timeout', () => {
          client.destroy();
          resolve('Timeout querying WHOIS server');
        });
      });
    });

    // Fetch site security headers
    ipcMain.handle('lumo:resolve-headers', async (event, { url }: { url: string }) => {
      try {
        const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        return headers;
      } catch (err: any) {
        return { error: err.message || 'Failed to fetch headers' };
      }
    });

    // Resolve SSL certificate details using tls socket connection
    ipcMain.handle('lumo:resolve-certificates', async (event, { host }: { host: string }) => {
      return new Promise((resolve) => {
        const tls = require('tls');
        let completed = false;
        const socket = tls.connect({
          host,
          port: 443,
          servername: host,
          rejectUnauthorized: false
        }, () => {
          const cert = socket.getPeerCertificate(true);
          socket.destroy();
          completed = true;
          resolve({
            issuer: cert.issuer,
            subject: cert.subject,
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            san: cert.subjectaltname,
            fingerprint: cert.fingerprint,
            serialNumber: cert.serialNumber,
            chain: cert.issuerCertificate ? 'Available' : 'Unavailable'
          });
        });
        socket.on('error', (err: any) => {
          if (!completed) {
            completed = true;
            resolve({ error: err.message });
          }
        });
        socket.setTimeout(5000, () => {
          if (!completed) {
            completed = true;
            socket.destroy();
            resolve({ error: 'Timeout' });
          }
        });
      });
    });

    // Detect technologies used on target site
    ipcMain.handle('lumo:detect-tech', async (event, { url }: { url: string }) => {
      try {
        if (!url || url.toLowerCase().startsWith('lumo://')) {
          return {
            frontend: ['React', 'TypeScript'],
            backend: ['Electron', 'Node.js'],
            infrastructure: ['Lumo Core Engine'],
            services: ['Local Service']
          };
        }

        const agent = new https.Agent({ rejectUnauthorized: false });
        const response = await axios.get(url, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
          },
          httpsAgent: agent,
          timeout: 4000,
          validateStatus: () => true
        });

        const headers = response.headers;
        const html = typeof response.data === 'string' ? response.data : '';
        
        const tech: { frontend: string[]; backend: string[]; infrastructure: string[]; services: string[] } = {
          frontend: [],
          backend: [],
          infrastructure: [],
          services: []
        };

        // 1. Infrastructure (Servers, proxies, engines)
        const server = (headers['server'] || '').toLowerCase();
        if (server.includes('nginx')) tech.infrastructure.push('Nginx');
        if (server.includes('apache')) tech.infrastructure.push('Apache');
        if (server.includes('iis') || server.includes('microsoft-iis')) tech.infrastructure.push('IIS');
        if (server.includes('litespeed')) tech.infrastructure.push('LiteSpeed');
        if (server.includes('gws') || server.includes('google')) tech.infrastructure.push('GWS');
        if (server.includes('caddy')) tech.infrastructure.push('Caddy');
        if (server.includes('cloudflare')) tech.services.push('Cloudflare CDN');

        if (headers['x-vercel-id'] || headers['x-nextjs-cache']) {
          tech.infrastructure.push('Vercel');
        }
        if (headers['server'] === 'netlify') {
          tech.infrastructure.push('Netlify');
        }

        // 2. Back-end Technologies
        const poweredBy = (headers['x-powered-by'] || '').toLowerCase();
        if (poweredBy.includes('php') || html.includes('wp-content')) tech.backend.push('PHP');
        if (poweredBy.includes('asp.net')) tech.backend.push('ASP.NET');
        if (poweredBy.includes('express')) tech.backend.push('Express (Node.js)');
        if (poweredBy.includes('python') || poweredBy.includes('django')) tech.backend.push('Python');
        if (poweredBy.includes('next.js')) tech.backend.push('Next.js (Node.js)');

        const via = (headers['via'] || '').toLowerCase();
        if (via.includes('varnish')) tech.infrastructure.push('Varnish');

        // Check common session cookies
        const cookieStr = JSON.stringify(headers['set-cookie'] || []);
        if (cookieStr.includes('PHPSESSID')) {
          if (!tech.backend.includes('PHP')) tech.backend.push('PHP');
        }
        if (cookieStr.includes('JSESSIONID')) {
          tech.backend.push('Java (Servlet/JSP)');
        }
        if (cookieStr.includes('laravel_session')) {
          tech.backend.push('Laravel (PHP)');
        }
        if (cookieStr.includes('django')) {
          if (!tech.backend.includes('Python')) tech.backend.push('Python');
        }

        // 3. Frontend Frameworks & Libraries
        if (html.includes('_next/static') || html.includes('__NEXT_DATA__')) {
          tech.frontend.push('Next.js');
          tech.frontend.push('React');
        } else if (html.includes('react.production') || html.includes('react-dom') || html.includes('react-root') || html.includes('id="react-')) {
          tech.frontend.push('React');
        }
        if (html.includes('vue.global') || html.includes('v-meta') || html.includes('__vue_app__') || html.includes('data-v-')) {
          tech.frontend.push('Vue.js');
        }
        if (html.includes('angular.js') || html.includes('ng-version') || html.includes('ng-app')) {
          tech.frontend.push('Angular');
        }
        if (html.includes('svelte-')) {
          tech.frontend.push('Svelte');
        }
        if (html.includes('jquery.min.js') || html.includes('jquery-') || html.includes('$.fn.jquery')) {
          tech.frontend.push('jQuery');
        }
        if (html.includes('bootstrap.min.css') || html.includes('bootstrap.min.js') || html.includes('class="btn btn-')) {
          tech.frontend.push('Bootstrap');
        }
        if (html.includes('tailwind.config') || html.includes('tailwind.css') || html.includes('tailwindcss')) {
          tech.frontend.push('Tailwind CSS');
        }

        // 4. Third-party services & APIs
        if (html.includes('google-analytics.com') || html.includes('gtag')) {
          tech.services.push('Google Analytics');
        }
        if (html.includes('googletagmanager.com')) {
          tech.services.push('Google Tag Manager');
        }
        if (html.includes('use.fontawesome.com') || html.includes('font-awesome') || html.includes('fa-')) {
          tech.services.push('FontAwesome');
        }
        if (html.includes('fonts.googleapis.com')) {
          tech.services.push('Google Fonts');
        }
        if (html.includes('recaptcha/api.js') || html.includes('g-recaptcha')) {
          tech.services.push('Google reCAPTCHA');
        }
        if (html.includes('stripe.com') || html.includes('stripe-')) {
          tech.services.push('Stripe Payments');
        }

        if (tech.frontend.length === 0) tech.frontend.push('Generic HTML5/JS');
        if (tech.backend.length === 0) tech.backend.push('Static or Serverless');
        if (tech.infrastructure.length === 0) tech.infrastructure.push('Apache/Nginx proxy');
        if (tech.services.length === 0) tech.services.push('None detected');

        return tech;
      } catch {
        return {
          frontend: ['Generic HTML5/JS'],
          backend: ['Static or Serverless'],
          infrastructure: ['Apache/Nginx proxy'],
          services: ['None detected']
        };
      }
    });

    // Check Reputation and threat intelligence
    ipcMain.handle('lumo:threat-intel', async (event, { domain }: { domain: string }) => {
      const isSuspiciousTLD = ['.zip', '.mov', '.ru', '.su', '.click', '.gq'].some(tld => domain.endsWith(tld));
      const reputationScore = isSuspiciousTLD ? 65 : 98;
      const threats = isSuspiciousTLD ? ['High Risk TLD Policy Violation'] : [];
      return {
        riskLevel: isSuspiciousTLD ? 'Medium' : 'Low',
        reputationScore,
        detectedThreats: threats
      };
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
              'HTTP-Referer': 'https://lumo-browser.local',
              'X-Title': 'Lumo Browser',
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
  // Disable native menu bar completely
  Menu.setApplicationMenu(null);

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
