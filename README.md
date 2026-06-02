# Lumo Browser

![Lumo](https://via.placeholder.com/1200x400?text=Lumo+Browser)

> **An AI-native, production-ready browser built on Chromium and Electron**  
> Transform natural language goals into intelligent browser automation workflows

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/yourusername/lumo-browser)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-≥18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/Electron-27.0.0-lightblue.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://react.dev/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Development](#development)
- [Building & Packaging](#building--packaging)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Version History](#version-history)
- [License](#license)

---

## 🎯 Overview

Lumo Browser revolutionizes web browsing by combining a full-featured Chromium browser with AI-powered automation. Instead of manually navigating, clicking, and searching, users describe their goals in natural language and Lumo intelligently handles the execution.

### Vision

**Traditional Browsing**: Manual navigation → Click → Fill forms → Search  
**Lumo Browsing**: Natural language goal → AI planner → Automated execution → Verified results

### Example Use Cases

```
"Find the cheapest RTX 4070 graphics card"
"Summarize this Wikipedia article"
"Compare prices across 5 e-commerce sites"
"Fill my profile with work experience"
"Extract all phone numbers from this page"
```

---

## ✨ Features

### Phase 1 (Current - v0.1.0)

#### Browser Core
- ✅ **Multi-tab browsing** with Chrome-like tab management
- ✅ **Full Chromium rendering engine** for all modern web standards
- ✅ **Address bar** with intelligent URL/search handling
- ✅ **Navigation controls** (back, forward, refresh, stop)
- ✅ **Dark/Light theme** with system preference detection
- ✅ **Bookmark system** with persistent storage
- ✅ **History tracking** with quick access
- ✅ **Ad & tracker blocking** with customizable blocklist

#### AI Features
- ✅ **AI Chat Sidebar** with streaming responses
- ✅ **AI Command Bar** for quick actions
- ✅ **Browser automation API** (click, type, scroll, extract)
- ✅ **Workflow execution** with step-by-step verification
- ✅ **Confidence scoring** for action validation
- ✅ **Error detection** and recovery

#### Developer Experience
- ✅ **TypeScript** throughout for type safety
- ✅ **React-based UI** with Tailwind CSS
- ✅ **Hot Module Replacement** during development
- ✅ **Unit & integration tests** with Vitest
- ✅ **ESLint & Prettier** configuration
- ✅ **Build optimization** with esbuild

### Phase 2 (Planned)
- 📋 Advanced workflow scheduling
- 📋 Multi-step task chaining
- 📋 Custom AI model selection
- 📋 Browser extension ecosystem
- 📋 Cloud sync & backup
- 📋 Team collaboration features

### Phase 3 (Future)
- 🚀 Mobile version (React Native)
- 🚀 Cross-device sync
- 🚀 Advanced analytics dashboard
- 🚀 Custom model fine-tuning

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.2.0 | UI framework |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 3.x | Utility-first styling |
| **Vite** | 5.x | Lightning-fast bundler |
| **Zustand** | 4.4.1 | State management |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | ≥18 | Runtime |
| **Express** | Latest | HTTP server |
| **TypeScript** | 5.x | Type safety |

### Desktop
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Electron** | 27.0.0 | Desktop framework |
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

## 📦 Installation

### Prerequisites

```bash
# Required
- Node.js >= 18.0.0
- npm >= 9.0.0

# Optional (for native builds)
- Python 3.x
- C++ build tools
```

### Clone Repository

```bash
git clone https://github.com/yourusername/lumo-browser.git
cd lumo-browser
```

### Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### Verify Installation

```bash
# Check Node version
node --version  # Should be >= 18.0.0

# Check npm version
npm --version   # Should be >= 9.0.0
```

---

## 🚀 Quick Start

### Development Mode

```bash
# Start Vite dev server + Electron
npm run dev

# This will:
# 1. Start Vite on http://127.0.0.1:5173
# 2. Start backend server
# 3. Launch Electron window with live reload
```

### Build for Production

```bash
# Build all (backend + frontend + electron)
npm run build

# Package as distributable (macOS, Windows, Linux)
npm run package
```

### Run Tests

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# View coverage report
npm run coverage
```

---

## 🏗 Architecture

### Project Structure

```
lumo-browser/
├── src/                          # Frontend source
│   ├── main/                     # Electron main process
│   │   ├── main.ts              # App initialization
│   │   ├── preload.ts           # IPC bridge
│   │   └── renderer.tsx         # React entry point
│   ├── pages/                   # Page components
│   │   ├── HomePage.tsx         # AI-first home page
│   │   ├── NewTabPage.tsx       # Customizable dashboard
│   │   ├── SettingsPage.tsx     # Browser settings
│   │   ├── HistoryPage.tsx      # Browsing history
│   │   └── BookmarksPage.tsx    # Bookmark manager
│   ├── ui/                      # UI components
│   │   ├── components/          # Reusable components
│   │   ├── styles/              # Global styles
│   │   └── index.ts             # Component exports
│   ├── services/                # Business logic
│   │   ├── ai-provider.service.ts
│   │   ├── goal-parsing.service.ts
│   │   ├── action-decomposition.service.ts
│   │   └── error-detection.service.ts
│   ├── store/                   # State management (Zustand)
│   ├── hooks/                   # Custom React hooks
│   ├── types/                   # TypeScript definitions
│   ├── utils/                   # Helper functions
│   ├── App.tsx                  # Root component
│   └── main.ts                  # Entry point
│
├── backend/                      # Backend server
│   ├── src/
│   │   ├── server.ts            # Express server
│   │   ├── database.ts          # Data persistence
│   │   ├── routes/              # API routes
│   │   ├── middleware/          # Express middleware
│   │   ├── types/               # Type definitions
│   │   └── utils/               # Utilities
│   └── package.json
│
├── dist/                         # Build output
├── docs/                         # Documentation
├── package.json                  # Root dependencies
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
├── electron-builder.json        # Packaging config
└── README.md                    # This file
```

### Component Flow

```
┌─────────────────────────────────────┐
│   Electron Main Process             │
│   (Native OS integration)           │
└──────────────┬──────────────────────┘
               │ IPC Messages
               ▼
┌─────────────────────────────────────┐
│   App.tsx (Root)                    │
│   ├─ BrowserTabBar                 │
│   ├─ BrowserToolbar                │
│   ├─ Content Area                  │
│   │   ├─ Webviews (External pages) │
│   │   ├─ HomePage                  │
│   │   ├─ SettingsPage              │
│   │   └─ HistoryPage               │
│   └─ AI Sidebar                    │
└─────────────────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Services Layer          │
├──────────────────────────┤
│ AI Provider Service      │
│ Goal Parsing Service     │
│ Action Decomposition     │
│ Error Detection          │
└──────────────────────────┘
```

---

## 💻 Development

### Environment Variables

Create a `.env.local` file in the root:

```env
VITE_API_URL=http://localhost:3001
VITE_AI_PROVIDER=openrouter
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run dev:vite        # Vite only
npm run dev:electron    # Electron only
npm run dev:backend     # Backend only

# Building
npm run build           # Full production build
npm run build:vite      # Frontend only
npm run build:electron  # Electron binaries only
npm run build:backend   # Backend only

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix lint issues
npm run format          # Format with Prettier
npm run type-check      # TypeScript check

# Testing
npm test                # Run tests
npm run test:ui         # Interactive test UI
npm run coverage        # Generate coverage report

# Maintenance
npm run clean           # Remove all build artifacts
```

### Code Style

We use **ESLint** and **Prettier** for code consistency:

```bash
# Auto-fix code style
npm run lint:fix
npm run format
```

### Creating Components

```typescript
// src/ui/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg">
      <h2 className="text-lg font-bold">{title}</h2>
    </div>
  );
};
```

### Adding State with Zustand

```typescript
// src/store/myStore.ts
import { create } from 'zustand';

interface MyState {
  count: number;
  increment: () => void;
}

export const useMyStore = create<MyState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

---

## 📦 Building & Packaging

### Development Build

```bash
npm run build
```

### Package as App

```bash
# Build and package for current platform
npm run package

# Platform-specific:
# macOS: Creates .dmg installer
# Windows: Creates .exe installer
# Linux: Creates AppImage
```

### Distribution

Built packages are available in the `dist` directory:
- `lumo-browser-0.1.0.dmg` (macOS)
- `lumo-browser-0.1.0.exe` (Windows)
- `lumo-browser-0.1.0.AppImage` (Linux)

---

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/services/goal-parsing.service.test.ts

# Watch mode
npm test -- --watch
```

### Test Coverage

```bash
npm run coverage

# View HTML report
open coverage/index.html
```

### Example Test

```typescript
// src/services/__tests__/goal-parsing.test.ts
import { describe, it, expect } from 'vitest';
import { parseGoal } from '../goal-parsing.service';

describe('GoalParsingService', () => {
  it('should parse natural language goals', () => {
    const result = parseGoal('Find the cheapest RTX 4070');
    expect(result.intent).toBe('search');
    expect(result.target).toBe('RTX 4070');
  });
});
```

---

## 🗺 Roadmap

### v0.1.0 (Current)
- ✅ Multi-tab browser core
- ✅ Basic AI integration
- ✅ Dark mode support
- ✅ Ad blocking
- ✅ Bookmarks & history

### v0.2.0 (Q3 2026)
- 📋 Advanced workflow builder
- 📋 Custom AI model selection
- 📋 Performance optimizations
- 📋 Extended API automation

### v0.3.0 (Q4 2026)
- 📋 Browser extensions support
- 📋 Cloud backup & sync
- 📋 Collaborative workflows
- 📋 Analytics dashboard

### v1.0.0 (2027)
- 🚀 Mobile companion app
- 🚀 Team features
- 🚀 Enterprise deployment
- 🚀 Production-grade stability

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** changes (`git commit -m 'Add AmazingFeature'`)
4. **Push** to branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Contribution Guidelines

- Follow the existing code style (run `npm run format`)
- Add tests for new features
- Update documentation as needed
- Keep commits atomic and descriptive

---

## 📝 Version History

### v0.1.0 - Initial Release (June 2, 2026)

**Features:**
- Multi-tab Chromium-based browser
- Dark/Light theme system
- Bookmark & history management
- AI chat sidebar with streaming
- Basic browser automation
- Ad blocker with configurable blocklist
- Settings panel for customization
- Desktop app packaging with Electron

**Technical:**
- React 18 + TypeScript
- Tailwind CSS styling
- Zustand state management
- Vite build tooling
- Vitest testing framework
- ESLint + Prettier

**Known Limitations:**
- Backend API integration pending
- Limited to single-step automation
- No cloud sync yet
- No extension support

### Future Versions
See [Roadmap](#-roadmap) section above.

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Lumo Browser Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 📞 Support & Feedback

- **Issues**: [GitHub Issues](https://github.com/yourusername/lumo-browser/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/lumo-browser/discussions)
- **Email**: support@lumobrowser.dev
- **Documentation**: [Full Docs](./docs/)

---

## 🙏 Acknowledgments

Built with ❤️ using:
- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)

---

## 👥 Team

- **Lead Developer**: Sai(BOB)
- **Contributors**: See [CONTRIBUTORS](CONTRIBUTORS.md)

---

**Made with 💡 by the Lumo Team**

[⬆ Back to top](#lumo-browser)
