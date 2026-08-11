<p align="center">
  <img src="assets/logo.png" alt="Lumo Browser" width="128" />
</p>

<h1 align="center">Lumo Browser</h1>

<p align="center">
  <strong>AI-Native Privacy Browser — Built on Chromium &amp; Electron</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue.svg" alt="Version" />
  <img src="https://img.shields.io/badge/electron-27.3.11-47848F.svg" alt="Electron" />
  <img src="https://img.shields.io/badge/react-18.2-61DAFB.svg" alt="React" />
  <img src="https://img.shields.io/badge/typescript-5.3-3178C6.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-339933.svg" alt="Node" />
  <img src="https://img.shields.io/badge/rust%20adblocker-native-orange.svg" alt="Rust AdBlocker" />
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" />
</p>

---

## Overview

**Lumo Browser** is a production-ready, AI-native desktop web browser that combines the power of Chromium rendering with an autonomous AI agent, enterprise-grade security monitoring, native ad blocking, and deep privacy controls.

Unlike traditional browsers, Lumo embeds an AI agent directly into the browsing experience — capable of navigating websites, filling forms, extracting data, comparing products, and automating complex multi-step workflows — all while a three-phase security pipeline monitors every network request, DOM mutation, and script execution in real time.

---

## Key Features

### AI Browser Agent
- **Dual-mode DOM interaction** — Text-only mode (fast, cheap, any model) + Vision mode (tagged screenshots for VLMs)
- **"Set of Marks"** numbered element tagging for precise click/type actions
- **Shadow DOM penetration** — works on complex SPAs and web apps
- **E-commerce scraping** — structured product extraction (name, price, rating, reviews, delivery)
- **Quiz/exam automation** — read question → select answer → advance
- **Product comparison** — multi-vendor search → structured memory → side-by-side comparison
- **Safety gates** — `request_user_confirmation` blocks irreversible actions (purchases, account changes)
- **Plan-driven execution** — `update_plan` breaks goals into sequenced steps with progress tracking
- **LLM-agnostic** — supports OpenRouter (GPT-4, Claude, Gemini, etc.) and local Ollama

### Native Ad & Tracker Blocker
- **Rust-powered** (NAPI-RS native addon `lumo-adblocker-rs`) — zero GC overhead, sub-microsecond URL matching
- **EasyList filter lists** — auto-downloaded and compiled on startup
- Fine-grained blocking: ads, trackers, social trackers, cryptominers, fingerprinters
- Real-time stats: blocked/allowed count, block rate

### Three-Phase Security Pipeline
| Phase | Layer | Location | What it does |
|-------|-------|----------|-------------|
| **1. Monitor** | Preload hooks | Webview & Renderer | Hooks clipboard API, WebAssembly, fetch/XHR/WebSocket, DOM mutations |
| **2. Detect** | Analysis engine | Main process | URL validation, phishing patterns, obfuscation signatures, crypto mining indicators |
| **3. Mitigate** | Network interceptor | Main process | Blocks malicious requests, auto-isolates tabs in ZT mode |

- **Clipboard hijack prevention** — blocks crypto wallet address replacement
- **WebAssembly cryptominer detection** — blocks oversized/known-miner Wasm binaries
- **Hidden iframe detection** — flags clickjacking/tracking injections
- **Script integrity verification** — periodic hook re-application every 5s, tamper alerts

### Zero-Trust Mode
- **Partition-isolated tabs** — each tab uses a unique `partition=tab-{id}`
- **Isolated downloads** — saved to temp directory, opened in sandboxed viewer windows, auto-cleaned after 30 min
- **Domain allow-listing** — 70+ known-safe domains pre-configured, user-extendable via permission dialog
- **IPC Guard** — origin validation + permission levels (PUBLIC, SESSION, SENSITIVE, ADMIN)
- **Agent Guard** — rate-limited script injection validation, blocks access to `require`, `process`, `electron`, `ipcRenderer`

### Password Vault
- **AES-256-GCM** encryption with per-profile vault files
- **OS keychain integration** via Electron `safeStorage` (libsecret on Linux, DPAPI on Windows, Keychain on macOS)
- Auto-capture on form submission, auto-fill on recognized domains
- Per-profile isolated vaults

### Multi-Profile Support
- Isolated browsing sessions with per-profile: bookmarks, history, settings, tabs, passwords
- Profile switching with partition-based storage isolation
- Guest mode with disposable partitions

### Feature-Rich Browser UI
- Frameless custom title bar with window controls (minimize, maximize, close)
- Chrome-style tab bar with tab groups, vertical/horizontal layout
- Address bar with search engine integration (Google, Bing, DuckDuckGo, Brave, Yahoo, Yandex)
- Picture-in-Picture overlay for `<video>` elements
- YouTube ad skipper (in-page JS injection)
- Built-in page translation (Google Translate widget)
- Bookmarks manager, history viewer, download manager
- Extensions panel, security dashboard, settings (17 settings tabs)
- Dark/light/system theme with live switching
- Disposable/incognito windows with ephemeral sessions

### Developer & Analysis Tools
- **Tech stack detection** — identifies frontend (React/Vue/Angular), backend (PHP/.NET/Python), infrastructure (Nginx/Cloudflare/Vercel), services (GA/Stripe/FontAwesome)
- **DNS resolution** — A, AAAA, MX, TXT, NS, CNAME, SOA records
- **WHOIS lookup** — domain registration information
- **SSL certificate inspection** — issuer, subject, validity, SAN, fingerprint, chain
- **Security headers analysis** — CSP, HSTS, X-Frame-Options, etc.
- **Threat intelligence** — domain reputation scoring, suspicious TLD detection
- **Network proxy configuration** — manual SOCKS5/HTTP, direct, with connectivity testing

### AI Provider Support
- **OpenRouter** — unified API for 200+ models (OpenAI, Anthropic, Google, Meta, Mistral, DeepSeek, Grok, etc.)
- **Ollama** — local LLM inference (OpenAI-compatible endpoint)
- Encrypted API key storage with secure fallback
- Chat sidebar + Agent sidebar for autonomous task execution

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Lumo Browser Architecture                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────────────┐ │
│  │ Electron  │    │   Renderer   │    │     Backend (Express)   │ │
│  │ Main Proc │◄──►│  (React 18)  │◄──►│     Node.js / SQLite    │ │
│  │           │ IPC│              │http│                         │ │
│  │ main.ts   │    │ App.tsx      │    │ server.ts               │ │
│  │ adBlocker │    │ pages/       │    │ routes/                 │ │
│  │ securityMon│   │ services/    │    │ database.ts             │ │
│  │ ipc-guard  │   │ agent/       │    │ middleware/             │ │
│  │ agent-guard│   │ store/       │    │                         │ │
│  │ preload.ts │    │ ui/          │    │                         │ │
│  └──────────┘    └──────┬───────┘    └─────────────────────────┘ │
│                         │                                         │
│                  ┌──────▼───────┐                                │
│                  │  <webview>   │  Chromium rendering             │
│                  │  security-   │  per tab                        │
│                  │  hooks.ts    │                                 │
│                  └──────────────┘                                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Rust Native Addon (lumo-adblocker-rs)                   │    │
│  │  EasyList compilation / URL matching / L1 cache          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Process Model

| Process | Role | Key Modules |
|---------|------|-------------|
| **Main** (Node.js) | Window management, IPC, ad blocking, security monitoring | `main.ts`, `adBlocker.ts`, `securityMonitor.ts`, `securityDetector.ts`, `ipc-guard.ts`, `agent-guard.ts` |
| **Renderer** (Chromium) | UI rendering, tab management, user interactions | `App.tsx`, `pages/*`, `ui/components/*` |
| **Webview** (per tab) | Guest page rendering with security sandbox | `webview-preload.ts` with `security-hooks.ts` |
| **Backend** (Node.js) | REST API, database, task management | `backend/src/server.ts`, `routes/*` |

---

## Project Structure

```
├── assets/                        # App icons (16px → 512px) and logo
├── backend/                       # Express.js API server
│   ├── src/
│   │   ├── database.ts           # SQLite initialization (better-sqlite3)
│   │   ├── server.ts             # Express app entry point
│   │   ├── routes/               # home, auth, provider, task routes
│   │   ├── middleware/           # error handler, auth
│   │   ├── types/                # TypeScript type definitions
│   │   └── utils/                # Logger, helpers
│   ├── dist/                     # Compiled JS output
│   └── package.json
├── dist/                          # Vite & esbuild output
├── docs/
│   └── featurehas.md             # Feature checklist
├── out/                           # electron-builder output (installers)
├── src/
│   ├── agent/                     # AI Browser Agent
│   │   ├── AgentExecutor.ts       # DOM interaction engine (Set of Marks)
│   │   ├── AgentMemory.ts         # Task memory (plan, products, actions)
│   │   ├── AgentPrompts.ts        # System prompts (text + vision modes)
│   │   ├── AgentTools.ts          # Tool definitions for LLM function calling
│   │   └── index.ts
│   ├── core/
│   │   ├── constants.ts           # App-wide constants, timeouts, limits
│   │   └── errors.ts              # Typed error hierarchy
│   ├── hooks/
│   │   └── useHome.ts             # Home page data hook
│   ├── main/
│   │   ├── main.ts                # Electron main process (window, IPC, adblock)
│   │   ├── preload.ts             # Context bridge + Phase 1 security hooks
│   │   ├── webview-preload.ts     # Webview security + hook integrity monitor
│   │   ├── adBlocker.ts           # Rust addon wrapper, config, stats
│   │   ├── securityMonitor.ts     # Phase 1+2+3: monitor, detect, mitigate pipeline
│   │   ├── securityDetector.ts    # Phase 2: URL, script, clipboard, Wasm analysis
│   │   ├── security-hooks.ts      # Shared hook functions (clipboard, Wasm, DOM, network)
│   │   ├── ipc-guard.ts           # IPC origin validation, permission levels, ZT
│   │   ├── agent-guard.ts         # Agent script injection validation + rate limiting
│   │   └── renderer.tsx           # React entry point
│   ├── pages/                     # Internal browser pages
│   │   ├── SettingsPage.tsx       # Main settings with all tabs
│   │   ├── GeneralSettingsTab.tsx
│   │   ├── PrivacySettingsTab.tsx
│   │   ├── SearchSettingsTab.tsx
│   │   ├── ProfileSettingsTab.tsx
│   │   ├── HomeSettingsTab.tsx
│   │   ├── SystemSettingsTab.tsx
│   │   ├── DownloadSettingsTab.tsx
│   │   ├── LanguageSettingsTab.tsx
│   │   ├── HomePage.tsx           # New tab / home page
│   │   ├── NewTabPage.tsx
│   │   ├── PrivateNewTabPage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── BookmarksPage.tsx
│   │   ├── DownloadsPage.tsx
│   │   ├── PasswordManagerPage.tsx
│   │   └── ExtensionsPage.tsx
│   ├── services/
│   │   ├── agents/                # Agent framework (base, planner)
│   │   ├── api/api.service.ts     # Backend API client (Axios)
│   │   ├── goal-parsing.service.ts # NLP goal analysis
│   │   ├── step-sequencing.service.ts # Dependency-based action sequencing
│   │   ├── error-detection.service.ts # Plan validation
│   │   ├── confidence-evaluation.service.ts # Multi-factor confidence scoring
│   │   ├── home/home.service.ts   # Home page data service
│   │   └── index.ts
│   ├── store/                     # Zustand stores
│   │   ├── home.store.ts
│   │   ├── ai-space.store.ts
│   │   └── ai-provider.store.ts
│   ├── types/                     # TypeScript type definitions
│   ├── ui/
│   │   ├── components/            # React UI components
│   │   │   ├── AISidebar.tsx
│   │   │   ├── AgentSidebar.tsx
│   │   │   ├── BrowserTabBar.tsx
│   │   │   ├── BrowserToolbar.tsx
│   │   │   ├── BrowserMenu.tsx
│   │   │   ├── SecurityDashboard.tsx
│   │   │   ├── WelcomePage.tsx
│   │   │   ├── ComparePage.tsx
│   │   │   ├── TabGroupModal.tsx
│   │   │   ├── AccountModal.tsx
│   │   │   ├── AddProfileModal.tsx
│   │   │   ├── ContextMenu.tsx
│   │   │   ├── PermissionRequest.tsx
│   │   │   └── ExtensionsPanel.tsx
│   │   └── styles/
│   ├── utils/
│   │   ├── logger.ts              # Structured logging
│   │   └── validators.ts          # Input validation
│   └── test/                      # Test setup
├── .eslintrc.json
├── .prettierrc
├── electron-builder.json          # Packaging configuration
├── index.html                     # Vite entry HTML
├── package.json
├── playwright.config.ts           # E2E test config
├── postcss.config.cjs
├── tailwind.config.cjs
├── tsconfig.json
├── vite.config.ts                 # Vite bundler config
└── vitest.config.ts               # Unit test config
```

---

## Quick Start

### Prerequisites

| Dependency | Version | Notes |
|-----------|---------|-------|
| Node.js | >= 18.0.0 | Required for both frontend and backend |
| npm | >= 9 | |
| Rust toolchain | nightly | Required to compile `lumo-adblocker-rs` native addon |
| Python | 3.x | Required by `node-gyp` for native module build |

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/lumo-browser.git
cd lumo-browser

# Install frontend + Electron dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Build the Rust adblocker addon (if not pre-built)
# The addon lives at ../lumo-ad-blocker/lumo-adblocker-rs relative to the project
# Ensure the sibling directory exists and has been built
```

### Environment Configuration

```bash
# Backend environment (optional — backend can run with defaults)
cp backend/.env.example backend/.env
# Edit backend/.env to configure:
#   PORT=3001
#   CORS_ORIGIN=http://localhost:5173
#   DATABASE_PATH=./lumo_browser.db
```

### Development

Run everything concurrently (backend + Vite dev server + Electron):

```bash
npm run dev
```

This starts:
1. **Backend** on `http://localhost:3001` (Express API)
2. **Vite dev server** on `http://127.0.0.1:5173` (React HMR)
3. **Electron** window pointing at the Vite dev server (auto-fallback to built files if dev server unavailable)

### Individual Dev Commands

```bash
# Backend only
npm run dev:backend

# Frontend only (Vite + Electron)
npm run dev:frontend

# Vite dev server only
npm run dev:vite

# Electron only (requires built frontend)
npm run dev:electron
```

---

## Build & Package

### Build All

```bash
npm run build
```

This runs:
1. `build:backend` — TypeScript compilation in `backend/`
2. `build:frontend` — Vite production build + esbuild bundling for Electron main/preload/webview-preload

### Build Individual Steps

```bash
# Vite build (React app → dist/)
npm run build:vite

# Electron main process bundle (esbuild → dist/main/)
npm run build:electron

# Backend TypeScript compilation
npm run build:backend
```

### Package Installers

```bash
# Build installers for current platform
npm run package

# Specific platform (from any OS):
npx electron-builder --linux
npx electron-builder --win
npx electron-builder --mac
```

**Outputs** (written to `out/`):

| Platform | Format | File |
|----------|--------|------|
| Linux | AppImage | `Lumo Browser-{version}.AppImage` |
| Linux | DEB | `lumo-browser_{version}_amd64.deb` |
| Linux | latest-linux.yml | Auto-update metadata |
| Windows | NSIS Installer | `Lumo Browser Setup {version}.exe` |
| Windows | Portable | `Lumo Browser {version}.exe` |
| Windows | latest.yml | Auto-update metadata |
| macOS | DMG | `Lumo Browser-{version}.dmg` |
| macOS | ZIP | `Lumo Browser-{version}-mac.zip` |

### Binary Details

- **Electron**: v27.3.11 (Chromium 119)
- **Packager**: electron-builder v24.6.4
- **App ID**: `com.lumobrowser.app`
- **Frameless window**: `frame: false` with custom title bar
- **GPU**: WebGPU/Vulkan enabled on Windows, ANGLE on Linux

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Concurrent backend + Vite + Electron |
| `npm run dev:backend` | Backend TypeScript in watch mode |
| `npm run dev:frontend` | Vite + Electron concurrently |
| `npm run dev:vite` | Vite dev server on port 5173 |
| `npm run dev:electron` | Build main process + launch Electron |
| `npm run build` | Build everything |
| `npm run build:backend` | Compile backend TypeScript |
| `npm run build:frontend` | Vite build + esbuild Electron bundle |
| `npm run build:vite` | Vite production build |
| `npm run build:electron` | esbuild: main.ts, preload.ts, webview-preload.ts |
| `npm run package` | electron-builder packaging |
| `npm run test` | Vitest unit tests |
| `npm run test:ui` | Vitest with UI dashboard |
| `npm run coverage` | Vitest with coverage report |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run lint` | ESLint frontend + backend |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier formatting |
| `npm run type-check` | TypeScript type checking (both frontend + backend) |
| `npm run clean` | Remove dist, build, out, node_modules |

---

## Configuration Files

### Vite (`vite.config.ts`)
- React plugin with path aliases (`@/` → `src/`, `@ui/` → `src/ui/`, etc.)
- Sourcemaps enabled, `outDir: dist`
- Server on `127.0.0.1:5173` with polling watch (WSL-compatible)

### TypeScript (`tsconfig.json`)
- Target ES2020, strict mode, no unused locals/parameters
- Path aliases matching Vite aliases for IDE resolution
- Bundler module resolution, `noEmit` (Vite handles compilation)

### Electron-Builder (`electron-builder.json`)
- Multi-platform targets: NSIS+portable (Win), DMG+zip (Mac), AppImage+deb (Linux)
- Custom app icon from `assets/logo.png` / `assets/icons/`
- NSIS config: one-click optional, customizable install directory, desktop + start menu shortcuts

### Tailwind CSS (`tailwind.config.cjs`)
- Content paths: `index.html`, `src/**/*.{ts,tsx}`
- Dark mode via class toggling

### ESLint (`.eslintrc.json`)
- TypeScript + React + React Hooks plugins
- Prettier integration (`eslint-config-prettier`)

---

## AI Agent System

### Architecture

```
User Goal
    │
    ▼
┌────────────────┐
│  AgentPrompts   │  System prompt (text or vision mode)
│  (buildSystemP.)│  + context builder
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  AgentExecutor  │  Executes tool calls in webview
│  (executeTool)  │  DOM extractor (text + vision modes)
│                 │  Click/type/scroll/go_back/etc.
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  AgentMemory    │  Plan steps, extracted products,
│  (TaskMemory)   │  action history, error tracking
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  AgentTools     │  Tool definitions (OpenAI function-calling format)
│  (AGENT_TOOLS)  │  17 tools: navigate, click, type_text, etc.
└────────────────┘
```

### Available Tools

| Tool | Description |
|------|-------------|
| `navigate(url)` | Load a URL |
| `click(id)` | Click element by its numbered [ID] tag |
| `click_at(x, y)` | Click at raw pixel coordinates |
| `type_text(id, text, clear_first?, press_enter?)` | Type into an input field |
| `scroll(direction, amount)` | Scroll the page |
| `read_page_text(max_length?)` | Extract visible text (handles shadow DOM, canvas) |
| `extract_product_data(vendor, max_products?)` | Scrape e-commerce product cards |
| `press_key(key)` | Press keyboard key (Enter, Escape, Tab, arrows) |
| `wait(seconds, reason?)` | Wait for page state |
| `go_back()` | Browser back |
| `click_by_text(text)` | Fallback text-match click |
| `quiz_answer(answer, question_summary?)` | Select answer + advance |
| `save_product(name, price, ...)` | Save product to comparison memory |
| `present_comparison(recommendation)` | Show side-by-side comparison |
| `update_plan(steps, current_step?)` | Set/update execution plan |
| `request_user_confirmation(action)` | Safety gate for irreversible actions |
| `done(message, success)` | Finish task |

### Dual DOM Extraction Mode

**Text Mode** (default, works with all models):
- `DOM_EXTRACTOR_TEXT_SCRIPT` — enumerates interactable elements, returns JSON array of `{id, tag, text, x, y, type, role, href}`
- No visual tags, no screenshot — fast and cheap

**Vision Mode** (requires vision-capable model):
- `DOM_EXTRACTOR_VISION_SCRIPT` — paints red numbered `<div>` tags over every interactable element
- Captures JPEG screenshot of the tagged page via `lumo:capture-webview` IPC
- Tags are removed after capture via `REMOVE_TAGS_SCRIPT`
- Also extracts full page text (including shadow DOM and canvas) via `READ_PAGE_TEXT_SCRIPT`

### DOM Interaction Strategy

Each action uses a multi-tier fallback:
1. **Direct JS** — look up element by ID in `window.__LumoAgentElements`, call `.click()` / `.value = ...`
2. **Native events** — `webview.sendInputEvent({ type: 'mouseDown', x, y })` bypasses JS framework guards
3. **Fallback** — `document.elementFromPoint(x, y)?.click()`

### Safety & Guardrails

- `request_user_confirmation` MUST be called before purchases, payments, account changes, or form submissions with personal data
- `DANGEROUS_ACTIONS` list: "place order", "buy now", "purchase", "checkout", "pay", "delete account", "change password", "send money", etc.
- Plan-driven execution with error tracking: max 5 errors before forced stop
- Agent script validation via `agent-guard.ts` in zero-trust mode

---

## Security System

### Three-Phase Pipeline

#### Phase 1: Monitor (in preload scripts)
- **Clipboard API hooks** — intercepts `navigator.clipboard.readText()` and `writeText()`
  - Crypto wallet address patterns are blocked with 95% confidence
- **WebAssembly hooks** — intercepts `WebAssembly.instantiate()` and `instantiateStreaming()`
  - Binaries >1MB blocked (cryptominer suspicion), >256KB warned
- **Network API hooks** — intercepts `fetch()`, `XMLHttpRequest`, `WebSocket.send()`, `navigator.sendBeacon()`
- **DOM Mutation Observer** — detects dynamic `<script>`, `<iframe>`, and nested container injection
- **Runtime integrity checks** — every 5 seconds verifies hooks are still in place; tampering triggers re-application (up to 3 attempts) then a CRITICAL security event

#### Phase 2: Detect (in main process — `securityDetector.ts`)
- **URL validation**: known cryptominer domains (16 domains), malicious TLDs (`.zip`, `.mov`, `.gq`, `.click`, etc.), 30+ phishing domain patterns, IP-based hosts, punycode homograph attacks, long query string exfiltration
- **Script heuristics**: crypto mining signatures, obfuscation pattern detection (eval, atob, fromCharCode, etc.), external scripts from IP addresses, large inline scripts, hidden iframes
- **Clipboard analysis**: readText() → data_theft warning, writeText() with crypto address → 95% confidence block
- **Wasm analysis**: source domain check against mining pools, binary size thresholds (1MB block, 256KB warn)

#### Phase 3: Mitigate (in main process — `securityMonitor.ts`)
- **`onBeforeRequest` interceptor** per Electron session:
  1. Ad blocker check (preserves existing blocking)
  2. Phase 2 detection analysis
  3. Malicious requests → blocked + security alert emitted
  4. Zero-trust mode: unrecognized domains → blocked + permission dialog
- **Auto-isolation**: threats with ≥90% confidence in ZT mode trigger `lumo:isolate-tab` event
- **Batched event delivery**: events are throttled (100ms interval) and sent in batches to avoid IPC flooding
- **Alert threshold**: security alerts fire at ≥70% detection confidence

### IPC Guard (`ipc-guard.ts`)
- Every IPC channel has a permission level: PUBLIC, SESSION, SENSITIVE, ADMIN
- In zero-trust mode: ADMIN and SENSITIVE channels require calls from the main renderer origin
- Violations are logged; in ZT mode they are blocked entirely
- Zero-trust state is persisted to disk (`zero-trust-state.json` in userData)

### Agent Script Guard (`agent-guard.ts`)
- Blocked patterns: `require()`, `process.*`, `__dirname`, `__filename`, `global.*`, `window.electron`, `ipcRenderer`, `contextBridge`, `electron.*`, `remote.*`
- Suspicious patterns in ZT mode: `eval()`, `new Function()`, `document.write()`, `innerHTML`
- Rate limiting: max 10 script injections per second per webview
- Script size limit in ZT mode: 50KB max

---

## Ad Blocker

- **Engine**: `lumo-adblocker-rs` (Rust NAPI-RS native addon)
- **Filter lists**: EasyList-based, downloaded and compiled on startup
- **Per-session blocking**: attached to default session, `persist:lumo-main`, `persist:lumo-profile-*`, `persist:ai-*`, and disposable partitions
- **YouTube patch injection**: some ad blocker results include scripts injected into YouTube pages for ad removal
- **Configurable categories**: ads, trackers, social trackers, cryptominers, fingerprinters
- **Live stats**: blocked count, allowed count, block rate percentage, reset capability

---

## Password Vault

- **Encryption**: AES-256-GCM with random 256-bit key
- **Key storage**: wrapped via Electron `safeStorage` (OS keychain/libsecret/DPAPI)
- **Vault file**: `lumo-vault-{profileId}.enc` in Electron `userData`, one per profile
- **No plaintext fallback**: if decryption fails, vault is treated as empty
- **Auto-capture**: injected script listens for form submissions, captures username + password
- **Auto-fill**: on page load, matches domain against vault entries and fills credentials
- **IPC interface**: `vault-get-all`, `vault-save`, `vault-delete`

---

## Backend API

### Stack
- **Runtime**: Node.js + Express 4
- **Database**: SQLite via `better-sqlite3`
- **Auth**: Token-based (configurable)

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/home/data` | Home page data (widgets, actions) |
| POST | `/api/home/search` | Execute search |
| POST | `/api/home/action/:id/execute` | Execute quick action |
| POST | `/api/home/workflow/:id/execute` | Execute workflow |
| GET | `/api/tasks` | List tasks |
| GET | `/api/tasks/:id` | Get task |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/providers` | List AI providers |
| POST | `/api/providers` | Add AI provider |
| PATCH | `/api/providers/:id/status` | Update provider status |
| DELETE | `/api/providers/:id` | Delete provider |
| POST | `/api/auth/*` | Authentication routes |

### Database
- Initialized on server start via `initializeDatabase()`
- Schema stored in `backend/src/database.ts`
- Path configurable via `DATABASE_PATH` env var (default: `./lumo_browser.db`)

---

## Testing

### Unit Tests (Vitest)
```bash
# Run all tests
npm test

# UI mode
npm run test:ui

# With coverage
npm run coverage
```

### E2E Tests (Playwright)
```bash
npm run test:e2e
```

Test configuration:
- **Vitest**: `vitest.config.ts` (jsdom environment, path aliases matching Vite)
- **Playwright**: `playwright.config.ts`
- **Test setup**: `src/test/setup.ts`

---

## Code Quality

```bash
# Lint check
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Format code
npm run format

# TypeScript type checking
npm run type-check
```

---

## Cross-Platform Build Notes

### Linux
```bash
# Build AppImage + deb
npm run package -- --linux
# Output: Lumo Browser-*.AppImage, lumo-browser_*_amd64.deb
```

### Windows (cross-compile from Linux)
Requires `wine` and `mono`:
```bash
# NSIS installer + portable
npx electron-builder --win
```

### macOS (cross-compile)
Requires macOS host or `electron-builder` with Mac build tools.

### Common Build Issues
- **Rust addon not found**: ensure `lumo-adblocker-rs` is built at the expected path (`../lumo-ad-blocker/lumo-adblocker-rs`)
- **Electron native module rebuild**: `@electron/rebuild` is configured in devDependencies for native addon compatibility
- **Ad blocker compilation failure**: the Rust addon requires nightly toolchain; fallback mode disables blocking gracefully

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3001` | Backend API base URL |
| `VITE_OPENAI_API_KEY` | — | Legacy OpenAI key (prefer OpenRouter) |
| `VITE_CLAUDE_API_KEY` | — | Legacy Claude key |
| `VITE_GEMINI_API_KEY` | — | Legacy Gemini key |
| `VITE_DEBUG` | — | Enable verbose logging |
| `PORT` (backend) | `3001` | Backend server port |
| `CORS_ORIGIN` (backend) | `http://localhost:5173` | Allowed CORS origin |
| `DATABASE_PATH` (backend) | `./lumo_browser.db` | SQLite database path |

---

## Data & Storage

| Data | Location | Format |
|------|----------|--------|
| Settings | `localStorage` key `lumo-settings-{profileId}` | JSON |
| Bookmarks | `localStorage` key `lumo-bookmarks-{profileId}` | JSON |
| History | `localStorage` key `lumo-history-{profileId}` | JSON |
| Tabs | `localStorage` key `lumo-tabs-{profileId}` | JSON |
| Downloads | `localStorage` key `lumo-downloads-{profileId}` | JSON |
| API Key (plain) | `localStorage` key `lumo-api-key-plain` | Plain string |
| API Key (secure) | `localStorage` key `lumo-api-key-secure` | safeStorage-encrypted base64 |
| Password Vault | `{userData}/lumo-vault-{profileId}.enc` | AES-256-GCM |
| Vault Key | `{userData}/.vault-key.enc` | safeStorage-wrapped 256-bit key |
| Zero-Trust State | `{userData}/zero-trust-state.json` | JSON `{ enabled: bool }` |

---

## Contributing

1. Fork the repository
2. Create a feature branch from `main`
3. Follow existing code style (Prettier + ESLint enforced)
4. Ensure type-check passes (`npm run type-check`)
5. Add tests for new features
6. Run all tests (`npm test`)
7. Submit a pull request

### Development Guidelines
- All IPC channels must be prefixed with `lumo:` and registered in `ipc-guard.ts` with an appropriate permission level
- Security hooks in `security-hooks.ts` must never be bypassable from page JavaScript
- Agent tools in `AgentTools.ts` must include safety gates for irreversible actions
- New settings tabs should follow the existing pattern in `src/pages/`

---

## License

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://github.com/lumo-browser">Team Lumo</a>
  <br>
  Developers: <a href="https://github.com/Rsaimukesh">Saimukesh R</a> & <a href="https://github.com/cosmic-striker">cosmic-striker</a>
</p>
