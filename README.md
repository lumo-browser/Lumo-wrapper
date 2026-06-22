# Lumo Browser

> **An AI-native, production-ready browser built on Chromium and Electron**  
> Full-featured browsing + autonomous AI agent + production-grade privacy engine

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](https://github.com/yourusername/nova-browser)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-≥18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/Electron-27.3.11-lightblue.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://react.dev/)

---

##  Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Settings System](#settings-system)
- [Ad Blocking Engine](#ad-blocking-engine)
- [AI Autonomous Agent](#ai-autonomous-agent)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Development](#development)
- [Building & Packaging](#building--packaging)
- [Roadmap](#roadmap)
- [Version History](#version-history)
- [License](#license)

---

##  Overview

Lumo Browser combines a full-featured Chromium browser with a modular AI autonomous agent and a production-grade privacy engine. Users can browse normally or hand control to the AI agent to automate multi-step tasks across the web.

### Vision

**Traditional Browsing**: Manual navigation → Click → Fill forms → Search  
**Nova Browsing**: Natural language goal → AI planner → Automated execution → Verified results

### Example Use Cases

```
"Find the cheapest RTX 4070 graphics card across Amazon and Flipkart"
"Summarize this Wikipedia article in 3 bullet points"
"Compare prices across 5 e-commerce sites and recommend the best"
"Fill my profile with work experience"
"Extract all phone numbers from this page"
```

---

##  Features

### Browser Core
-  **Multi-tab browsing** with Ctrl+T / Ctrl+W / Ctrl+Tab management
-  **Full Chromium rendering engine** via Electron `<webview>` tags
-  **Smart address bar** — auto-resolves URLs, searches, and `nova://` internal pages
-  **Navigation controls** — back, forward, refresh, stop, zoom in/out
-  **Global keyboard shortcuts** — Ctrl+L, Ctrl+T, Ctrl+W, Ctrl+R, Ctrl+B, Ctrl+H, Ctrl+,, Alt+←/→
-  **Dark / Light / System theme** with live switching
-  **Bookmark manager** with persistent storage
-  **History tracking** with quick access
-  **Zoom controls** with async Electron 27 API support

### New Tab Dashboard
-  **Customizable widgets** — Clock, Search Bar, Shortcuts, Quick Notes, Top Sites
-  **8 preset gradient backgrounds** + custom image URL support
-  **Accent color picker** with 8 presets + native color input
-  **12/24-hour clock** with date and contextual greeting
-  **Pinned shortcuts** — add, remove, click to navigate
-  **Quick Notes** — persistent scratchpad stored in localStorage

### Settings System
Lumo has a fully modular settings architecture organized into a sidebar layout:

| Tab | Contents |
|-----|----------|
| **General** | Startup behavior, tab management, browser layout, language & appearance, downloads, performance, AI agent key, network/proxy |
| **Home** | New tab/window behavior, background, accent color, clock/date, widget toggles, reset to defaults |
| **Search Engine** | Default engine picker, search suggestions, address bar suggestions, custom keyword shortcuts |
| **Privacy & Security** | Tracking protection levels, cookie management, passwords, history, permissions, security, DNS over HTTPS, data collection |
| **Sync** | Coming soon placeholder |
| **About** | Version, engine, architecture info |

### Privacy & Ad Blocking
-  **Zero-dependency ad blocking engine** — 150+ domain rules across 5 categories
-  **Ad networks** — DoubleClick, Criteo, AppNexus, OpenX, Taboola, Outbrain + 40 more
-  **Tracker blocking** — Google Analytics, Hotjar, Mixpanel, Segment + 40 more
-  **Social tracker blocking** — Facebook, Twitter, LinkedIn, Pinterest widgets
-  **Cryptominer blocking** — CoinHive, CryptoLoot + 10 more
-  **Fingerprinter blocking** — FingerprintJS, Kount, ThreatMetrix + others
-  **URL pattern rules** — Regex rules for ad paths, UTM params, tracking pixels
-  **Whitelist** — Google Fonts, Maps, Auth never blocked
-  **Live stats** — blocked count, allowed count, block rate %

### AI Autonomous Agent
-  **Modular agent architecture** — `AgentMemory`, `AgentTools`, `AgentExecutor`, `AgentPrompts`
-  **14 tools** — navigate, click, type_text, scroll, read_page_text, extract_product_data, press_key, wait, go_back, request_user_confirmation, save_product, present_comparison, update_plan, done
-  **Safety gate** — irreversible actions require explicit user approval
-  **DOM injection engine** — captures roles, hrefs, types for reliable element targeting
-  **Product extraction** — Amazon/Flipkart heuristics for price, rating, reviews, delivery
-  **OpenRouter API** — supports GPT-4o, Claude 3.5, Gemma 2, Llama 3, Mistral
-  **Agent Sidebar** — tabbed view (Logs / Plan / Compare) with real-time streaming

---

##  Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.2.0 | UI framework |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 3.x | Utility-first styling |
| **Vite** | 5.x | Lightning-fast bundler |
| **Zustand** | 4.4.1 | State management |
| **Lucide React** | Latest | Icon library |

### Desktop
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Electron** | 27.3.11 | Desktop framework |
| **Chromium** | 120+ | Rendering engine |
| **esbuild** | Latest | Code bundling |

### Development
| Tool | Version | Purpose |
|------|---------|---------| 
| **Vitest** | Latest | Unit testing |
| **ESLint** | 8.x | Code linting |
| **Prettier** | Latest | Code formatting |
| **electron-builder** | 24.x | Packaging & distribution |

---

##  Installation

### Prerequisites

```bash
# Required
- Node.js >= 18.0.0
- npm >= 9.0.0
```

### Clone & Install

```bash
git clone https://github.com/yourusername/nova-browser.git
cd nova-browser
npm install
cd backend && npm install && cd ..
```

---

##  Quick Start

```bash
# Development mode (Vite + Electron with live reload)
npm run dev

# Production build
npm run build

# Package as distributable
npm run package
```

---

##  Architecture

### Project Structure

```
nova-browser/
├── src/
│   ├── main/                          # Electron main process
│   │   ├── main.ts                    # App init, IPC, session management
│   │   ├── adBlocker.ts               #  Ad blocking engine (zero-dep)
│   │   ├── preload.ts                 # Secure IPC bridge
│   │   └── renderer.tsx               # React entry point
│   │
│   ├── agent/                         # AI Autonomous Agent (modular)
│   │   ├── AgentMemory.ts             # Task state persistence
│   │   ├── AgentTools.ts              # 14 tool definitions
│   │   ├── AgentExecutor.ts           # DOM injection & tool execution
│   │   ├── AgentPrompts.ts            # System prompt & context builder
│   │   └── index.ts                   # Barrel export
│   │
│   ├── pages/                         # Full-page components
│   │   ├── NewTabPage.tsx             # Customizable dashboard
│   │   ├── SettingsPage.tsx           # Sidebar settings shell
│   │   ├── GeneralSettingsTab.tsx     # General tab content
│   │   ├── HomeSettingsTab.tsx        # Home/dashboard config
│   │   ├── SearchSettingsTab.tsx      # Search engine config
│   │   ├── PrivacySettingsTab.tsx     # Privacy & security config
│   │   ├── HistoryPage.tsx            # Browsing history
│   │   ├── BookmarksPage.tsx          # Bookmark manager
│   │   └── ComparePage.tsx            # AI product comparison view
│   │
│   ├── ui/components/                 # Reusable UI components
│   │   ├── BrowserToolbar.tsx         # Address bar + nav controls
│   │   ├── BrowserTabBar.tsx          # Tab strip
│   │   ├── AgentSidebar.tsx           # AI agent panel
│   │   └── ...
│   │
│   ├── App.tsx                        # Root component + global shortcuts
│   ├── store/                         # Zustand state management
│   ├── hooks/                         # Custom React hooks
│   ├── services/                      # Business logic services
│   ├── types/                         # TypeScript definitions
│   └── utils/                         # Helper functions
│
├── backend/                           # Express API server
├── docs/                              # Documentation
├── package.json
├── vite.config.ts
├── electron-builder.json
└── README.md
```

### Data Flow

```
┌─────────────────────────────────────────────────────┐
│              Electron Main Process                   │
│  ┌─────────────────┐   ┌──────────────────────────┐ │
│  │  adBlocker.ts   │   │  session.webRequest       │ │
│  │  150+ rules     │──│  intercepts all requests  │ │
│  └─────────────────┘   └──────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │  IPC Channels: lumo:set-ad-blocker-config       │ │
│  │               lumo:get-ad-blocker-stats         │ │
│  │               lumo:save-key / lumo:load-key     │ │
│  └─────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────┘
                         │ IPC (preload bridge)
                         ▼
┌─────────────────────────────────────────────────────┐
│              React Renderer (App.tsx)                │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ BrowserTabBar│  │BrowserToolbar│  │AgentSidebar│  │
│  └──────────────┘  └──────────────┘  └───────────┘  │
│  ┌──────────────────────────────────────────────────┐ │
│  │  <webview> per tab (sandboxed Chromium process)  │ │
│  └──────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Pages: NewTabPage │ SettingsPage │ HistoryPage  │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

##  Settings System

Settings are organized into a **sidebar navigation layout** with 6 tabs. Each tab is a standalone component for modularity:

```
src/pages/
├── SettingsPage.tsx          ← Shell: sidebar nav + tab routing
├── GeneralSettingsTab.tsx    ← Startup, Tabs, Layout, Language, Downloads, Performance, Network
├── HomeSettingsTab.tsx       ← Dashboard background, accent, widgets, clock
├── SearchSettingsTab.tsx     ← Default engine, suggestions, address bar, shortcuts
└── PrivacySettingsTab.tsx    ← Tracking protection, cookies, passwords, permissions, DNS, security
```

Settings are persisted in `localStorage` under the `lumo-settings` key and synced to the Electron main process via IPC for features like ad blocking.

---

##  Ad Blocking Engine

The engine lives in `src/main/adBlocker.ts` and runs entirely in the **Electron main process** — meaning it blocks requests before they ever reach the renderer or any webview.

### Architecture

Lumo Browser uses a hybrid ad-blocking architecture:
1. **High-Performance Rust Core (`adblock-rs`)**: Integrates compiled native Rust bindings to run EasyList filter sets efficiently in microseconds.
2. **Zero-Dependency Fallback Engine**: If native bindings are unavailable, falls back to a custom JavaScript/TypeScript pattern matcher matching domains and paths.

```ts
// Every network request passes through this check
session.defaultSession.webRequest.onBeforeRequest(
  { urls: ['<all_urls>'] },
  (details, callback) => {
    const blocked = shouldBlock(details.url, adBlockerConfig);
    callback({ cancel: blocked });
  }
);
```

### Blocking Categories

| Category | Domain Rules | Additional Pattern Rules |
|----------|-------------|--------------------------|
| Ads | 50+ networks | `/ads/`, `/banner/`, `/sponsor/` paths |
| Trackers | 50+ services | GA collect, GTM, UTM params, FB pixel |
| Social Trackers | 15+ platforms | Share buttons, widgets |
| Cryptominers | 15+ services | — |
| Fingerprinters | 10+ services | — |

### IPC API

```ts
// Toggle ad blocking on/off
window.electron.send('lumo:set-ad-blocker', true);

// Update granular config
window.electron.send('lumo:set-ad-blocker-config', {
  blockTrackers: true,
  blockSocialTrackers: false,
});

// Get live stats
const stats = await window.electron.invoke('lumo:get-ad-blocker-stats');
// { blocked: 142, allowed: 890, total: 1032, blockRate: 14 }

// Reset stats counter
window.electron.send('lumo:reset-ad-blocker-stats');
```

---

##  AI Autonomous Agent

The agent is implemented in `src/agent/` as four modular classes:

| Module | Responsibility |
|--------|---------------|
| `AgentMemory` | Tracks plan, saved products, visited URLs, error counts, action history |
| `AgentTools` | Defines 14 tools with JSON schemas for the LLM to call |
| `AgentExecutor` | Maps tool calls to JavaScript injected into `<webview>` DOM |
| `AgentPrompts` | Builds system prompts and per-turn context from memory state |

### Supported Tools

```
navigate          — Load a URL in the active tab
click             — Click a DOM element by selector or text
type_text         — Type into an input field
scroll            — Scroll the page
read_page_text    — Extract simplified DOM text
extract_product_data — Extract price, rating, reviews from product pages
press_key         — Simulate keyboard events
wait              — Pause execution
go_back           — Navigate back
request_user_confirmation — Pause for human approval (safety gate)
save_product      — Store extracted product data in memory
present_comparison — Display comparison table in the Compare tab
update_plan       — Update the step checklist visible in the Plan tab
done              — Signal task completion
```

### Safety Gate

When the agent calls `request_user_confirmation`, execution pauses and a warning banner appears in the UI. The user must **Approve** or **Reject** before the agent continues. This prevents irreversible actions (purchases, form submissions) without explicit consent.

---

## ⌨ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + T` | New tab |
| `Ctrl + W` | Close tab |
| `Ctrl + L` | Focus address bar |
| `Ctrl + R` / `F5` | Reload page |
| `Ctrl + Shift + R` | Hard reload |
| `Ctrl + + / =` | Zoom in |
| `Ctrl + -` | Zoom out |
| `Alt + ←` | Go back |
| `Alt + →` | Go forward |
| `Escape` | Stop loading |
| `Ctrl + Shift + A` | Toggle AI sidebar |
| `Ctrl + B` | Bookmarks |
| `Ctrl + H` | History |
| `Ctrl + J` | Downloads |
| `Ctrl + P` | Print |
| `Ctrl + ,` | Settings |

---

##  Development

### Environment Variables

Create `.env.local` in the root:

```env
VITE_API_URL=http://localhost:3001
VITE_AI_PROVIDER=openrouter
```

### Available Scripts

```bash
npm run dev          # Start Vite + Electron with hot reload
npm run build        # Production build
npm run package      # Package as distributable
npm run lint         # ESLint
npm run lint:fix     # Auto-fix lint issues
npm run format       # Prettier formatting
npm run type-check   # TypeScript check
npm test             # Run tests
npm run coverage     # Generate coverage report
```

---

##  Building & Packaging

```bash
# Full production build
npm run build

# Package for current platform
npm run package
# macOS → .dmg
# Windows → .exe
# Linux → .AppImage
```

---

##  Roadmap

### v0.2.0 (Current — June 2026)
-  Modular Settings System (General, Home, Search, Privacy)
-  Production-grade ad blocking engine
-  Comprehensive Privacy & Security settings
-  AI autonomous agent with safety gate
-  Global keyboard shortcuts
-  Customizable New Tab Dashboard
-  Font-size slider (commit-only updates)

### v0.3.0 (Q3 2026)
-  Ad blocker stats widget in toolbar
-  Custom filter list import (EasyList format)
-  Browser extensions support
-  Cloud sync & backup
-  Tab groups

### v1.0.0 (2027)
-  Mobile companion app
-  Enterprise deployment
-  Production-grade stability

---

##  Version History

### v0.2.0 — Settings Overhaul + Ad Blocking (June 2026)

- Redesigned Settings with modular sidebar layout (General, Home, Search, Privacy, Sync, About)
- Built comprehensive General, Home, Search, and Privacy settings tabs
- Implemented production-grade ad blocking engine (`adBlocker.ts`) with 150+ rules across 5 categories
- Added global keyboard shortcuts (Ctrl+L, Ctrl+B, Ctrl+H, Ctrl+J, Ctrl+P, Ctrl+,)
- Fixed zoom in/out with async Electron 27 `getZoomLevel()` API
- Font size slider now applies on drag-end only (performance fix)
- New Tab Page: widget toggles, custom background, accent color, clock format all configurable from Settings > Home

### v0.1.0 — Initial Release (May 2026)

- Multi-tab Chromium browser core
- Dark/Light/System theme
- Bookmark & history management
- AI chat sidebar with streaming
- Basic browser automation
- Basic ad blocker (domain list)
- Settings panel

---

##  License

MIT License — see [LICENSE](LICENSE) for details.

---

##  Team

- **Lead Developer**: Sai

---

**Made with  by the Lumo Team**

[ Back to top](#nova-browser)
