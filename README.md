# 🚀 Nova Browser

A production-ready, AI-native browser built on Chromium and Electron. Transform natural language goals into browser automation workflows with intelligent AI agents.

![Nova Browser](https://via.placeholder.com/1200x400)

## Vision

Traditional web browsing requires users to manually navigate, click, fill forms, and search. Nova Browser changes this paradigm:

**User Goal** → **AI Planner** → **Browser Automation** → **Result Verification**

### Examples
- "Find the cheapest RTX 4070"
- "Summarize this page"
- "Compare these products"
- "Fill this form with my information"

## Features

### Phase 1 (MVP)
- ✅ Multi-tab browser with Chromium engine
- ✅ Address bar with navigation controls
- ✅ Bookmarks and history
- ✅ AI chat sidebar with streaming responses
- ✅ AI command bar for quick actions
- ✅ Browser automation (click, type, scroll, extract)
- ✅ Workflow execution with verification

### Roadmap
- Phase 2: Advanced AI agents, memory system, permissions
- Phase 3: Bookmarks management, UI polish, performance
- Phase 4: Workflow editor, advanced AI, production hardening
- Phase 5: Public release (v0.1.0)

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/nova-browser.git
cd nova-browser

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Build React + Electron
npm run build

# Package for your platform
npm run package
```

## Architecture

Nova Browser follows **Clean Architecture** principles:

```
Presentation Layer (React UI)
    ↓
Application Layer (Features & Services)
    ↓
Domain Layer (AI Agents, Automation)
    ↓
Infrastructure Layer (Database, Electron, APIs)
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Tech Stack

| Category | Technology |
|----------|------------|
| **Browser Engine** | Chromium (via Electron) |
| **Frontend** | React 18 + TypeScript |
| **Styling** | TailwindCSS |
| **State Management** | Zustand |
| **Automation** | Playwright |
| **AI/LLM** | OpenAI, Claude, Gemini APIs |
| **Database** | SQLite |
| **Build Tool** | Vite |
| **Testing** | Vitest + Playwright |
| **Linting** | ESLint + Prettier |
| **Desktop** | Electron |

## Project Structure

```
src/
├── core/              # Core types, errors, constants
├── features/          # Feature modules (tabs, bookmarks, etc.)
├── services/          # Business logic
├── automation/        # Playwright-based automation
├── ai/                # AI agent systems & LLM integrations
├── browser/           # Chromium/Electron integration
├── memory/            # Persistence layer (SQLite)
├── ui/                # React components & layouts
├── hooks/             # Custom React hooks
├── store/             # Zustand state stores
├── utils/             # Utilities & helpers
├── types/             # Global TypeScript types
├── main/              # Electron main process
└── test/              # Testing utilities & setup
```

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server + Electron
npm run dev:vite        # Vite dev server only
npm run dev:electron    # Electron window only

# Building
npm run build           # Full build (React + Electron)
npm run build:vite      # Build React only
npm run build:electron  # Build Electron only

# Testing
npm run test            # Run tests
npm run test:ui         # UI test viewer
npm coverage            # Coverage report

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix linting issues
npm run format          # Format with Prettier
npm run type-check      # TypeScript type checking

# Packaging
npm run package         # Build installer for current OS
```

### Code Standards

- **TypeScript**: Strict mode enabled, no `any` types
- **File Size**: Max 300 lines
- **Function Size**: Max 50 lines
- **Test Coverage**: Min 80% for services/utils
- **Linting**: ESLint with Prettier integration

### Development Workflow

1. Create feature branch: `git checkout -b feat/feature-name`
2. Make changes following code standards
3. Write tests: `npm run test`
4. Check types: `npm run type-check`
5. Lint code: `npm run lint:fix`
6. Commit: `git commit -m "feat(scope): description"`
7. Push and create PR

## Configuration

### Environment Variables

Create `.env.local` for local development:

```env
VITE_OPENAI_API_KEY=your_key_here
VITE_CLAUDE_API_KEY=your_key_here
VITE_GEMINI_API_KEY=your_key_here
```

**Note**: Never commit `.env.local` or hardcode secrets!

### Configuration Files

- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `vitest.config.ts` - Test configuration
- `tailwind.config.cjs` - TailwindCSS configuration
- `electron-builder.json` - Electron packaging config
- `.eslintrc.json` - ESLint rules
- `.prettierrc` - Prettier formatting

## Security

### Sensitive Operations
- Purchase/Payment: Requires explicit user confirmation
- Password Change: Requires explicit user confirmation
- Message Sending: Requires explicit user confirmation
- Form Submission: Optional user confirmation

### Audit Trail
All AI actions are logged with:
- Timestamp
- User goal
- Action taken
- Result/error
- User confirmation status

See [SECURITY.md](./docs/SECURITY.md) for detailed security documentation.

## Performance Targets

- **Startup Time**: < 2 seconds
- **RAM Usage**: < 2 GB average
- **Chat Response**: < 3 seconds
- **Automation Success**: > 95%

## Testing

### Run Tests
```bash
npm run test              # Run all tests
npm run test:ui           # Open test UI
npm run coverage          # Generate coverage report
```

### Test Coverage
Target: > 80% for all core services and utilities

### Test Types
- **Unit Tests**: Services, utilities, helpers
- **Integration Tests**: Feature workflows, agents
- **E2E Tests**: Full browser workflows

## Debugging

### Enable Debug Logging
```bash
DEBUG=nova:* npm run dev
```

### Chrome DevTools
Press `Ctrl+Shift+I` (or `Cmd+Option+I` on macOS) to open DevTools.

### Electron Debugging
```bash
npm run dev -- --remote-debugging-port=9222
```

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Ensure linting passes: `npm run lint:fix`
6. Submit a pull request

## License

MIT License - see [LICENSE](./LICENSE) file for details

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for detailed development roadmap and timeline.

## Support

- 📖 [Documentation](./docs)
- 🐛 [Issue Tracker](https://github.com/yourusername/nova-browser/issues)
- 💬 [Discussions](https://github.com/yourusername/nova-browser/discussions)
- 📧 Email: support@novabrowser.dev

## Acknowledgments

Built with ❤️ by the Nova Browser team.

- Chromium team for the browser engine
- Electron team for the desktop framework
- React team for the UI framework
- OpenAI, Anthropic, Google for AI APIs

---

**Nova Browser** - Intelligent browsing, powered by AI.
