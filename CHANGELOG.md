# Changelog

All notable changes to Nova Browser are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.2.0] — 2026-06-02

### Added

#### Settings System (Complete Overhaul)
- Redesigned Settings page with modular **sidebar navigation layout** (General, Home, Search, Privacy & Security, Sync, About)
- **GeneralSettingsTab**: Startup behavior, tab management, browser layout (horizontal/vertical tabs), language & appearance, files & downloads, performance, AI Auto-Agent API key, network/proxy settings
- **HomeSettingsTab**: New tab/window mode, 8 preset gradient backgrounds, custom background image URL, accent color picker, clock format (12/24hr), date/greeting toggles, per-widget show/hide toggles, reset to defaults
- **SearchSettingsTab**: Default search engine picker, show-terms-in-address-bar toggle, search suggestion options (5 toggles), address bar suggestion sources (6 checkboxes), custom keyword shortcuts CRUD (add/delete, keyword + URL)
- **PrivacySettingsTab**: Enhanced Tracking Protection (Standard/Strict/Custom cards), built-in blocking toggles, Total Cookie Protection, cookie management, passwords (5 toggles), history mode selector, per-permission dropdowns (Location/Camera/Mic/Notifications/Autoplay), security section (HTTPS-Only, dangerous content), DNS over HTTPS (4 modes + provider selector), data collection toggles

#### Ad Blocking Engine
- Created `src/main/adBlocker.ts` — zero-dependency production-grade engine
- 50+ ad network domain rules (DoubleClick, Criteo, AppNexus, Taboola, Outbrain, etc.)
- 50+ tracker domain rules (Google Analytics, Hotjar, Mixpanel, Segment, Amplitude, etc.)
- Social tracker blocking (Facebook Connect, Twitter Platform, LinkedIn, Pinterest, Reddit widgets)
- Cryptominer blocking (CoinHive, CryptoLoot, JSECoin + 10 more)
- Fingerprinter blocking (FingerprintJS, Kount, ThreatMetrix, Sift, etc.)
- URL pattern regex rules for `/ads/`, `/track/`, `/pixel/`, UTM parameters, GA collect, GTM, FB pixel
- Whitelisted domains (Google Fonts, Maps, Auth) that are never blocked
- `AdBlockerStats` class: tracks blocked/allowed counts and block rate %
- New IPC channels: `lumo:set-ad-blocker-config`, `lumo:get-ad-blocker-stats`, `lumo:reset-ad-blocker-stats`

#### Keyboard Shortcuts
- `Ctrl + L` — Focus address bar (omnibox) globally from BrowserToolbar
- `Ctrl + B` — Navigate to Bookmarks
- `Ctrl + H` — Navigate to History
- `Ctrl + J` — Navigate to Downloads
- `Ctrl + P` — Print current page
- `Ctrl + ,` — Open Settings
- `Ctrl + + / =` — Zoom in (fixed to match both keyboard variants)
- New Tab Page shortcut tiles now have full-tile clickable hit area

#### AI Autonomous Agent
- Modular agent architecture: `AgentMemory`, `AgentTools`, `AgentExecutor`, `AgentPrompts`
- 14 tool definitions with JSON schemas for LLM tool-calling
- Safety gate: `request_user_confirmation` pauses execution with amber warning banner
- DOM injection engine with role/href/type capture for reliable element targeting
- Product extraction heuristics for Amazon and Flipkart
- Agent Sidebar tabbed UI: Logs, Plan (step checklist), Compare (product table)

### Fixed
- Zoom in/out broken due to Electron 27 async `getZoomLevel()` API — now correctly awaits the Promise
- Font size slider in Settings now applies change only on `onMouseUp`/`onTouchEnd` (drag-end only) to prevent continuous layout re-renders
- JSX syntax error in SettingsPage caused by stray comment inside conditional render block
- TypeScript errors from unused imports across agent modules and ComparePage

### Changed
- `main.ts` ad blocker upgraded from a static 15-domain URL pattern list to the full `adBlocker.ts` engine intercepting `<all_urls>`
- Settings page layout changed from a single scrolling list to a sidebar tabbed layout
- Home Settings tab now controls New Tab Page dashboard config (reads/writes same `localStorage` key as `NewTabPage.tsx`)
- OpenRouter API key moved from Home tab to General tab
- Default settings tab changed to "General"

---

## [0.1.0] — 2026-05-01

### Added
- Initial release of Nova Browser (formerly Lumo Browser)
- Multi-tab Chromium browser core using Electron `<webview>` tags
- Smart address bar with URL/search/`nova://` handling
- Navigation controls: back, forward, reload, stop
- Dark / Light / System theme with `nativeTheme` integration
- Bookmark manager with persistent localStorage storage
- History tracking with quick access page
- Basic ad blocker using `session.webRequest` with 15 domain patterns
- AI Chat Sidebar with OpenRouter streaming API integration
- Settings panel: theme, font size, search engine, basic privacy toggles
- New Tab Page with clock, search bar, shortcuts, and background gradients
- Keyboard shortcuts: Ctrl+T, Ctrl+W, Ctrl+R, F5, Alt+←/→, Escape
- TypeScript throughout with Vite build tooling
- ESLint + Prettier configuration
- Vitest test framework setup
- electron-builder packaging configuration

---

[0.2.0]: https://github.com/yourusername/nova-browser/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/yourusername/nova-browser/releases/tag/v0.1.0
