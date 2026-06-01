# Nova Browser Architecture

## Vision

Nova Browser is a production-ready, AI-native browser that transforms natural language goals into browser automation workflows. Built on Chromium and Electron, it combines traditional browser functionality with AI-powered agent systems for intelligent task completion.

## Core Principles

- **Clean Architecture**: Strict separation of concerns with isolated modules
- **Type Safety**: TypeScript strict mode, no `any` types
- **Performance**: < 2 GB RAM target, lazy-loading, code splitting
- **Security**: User confirmation for sensitive actions, permission system, audit logging
- **Testability**: Every module has comprehensive tests
- **Maintainability**: Max 300 lines per file, max 50 lines per function

## Project Structure

```
nova-browser/
├── src/
│   ├── core/                 # Core domain logic and shared abstractions
│   │   ├── types.ts          # Shared types and interfaces
│   │   ├── errors.ts         # Error definitions
│   │   └── constants.ts      # Application constants
│   │
│   ├── features/             # Feature modules (tab management, etc.)
│   │   ├── tabs/
│   │   ├── bookmarks/
│   │   ├── history/
│   │   └── settings/
│   │
│   ├── services/             # Business logic layer
│   │   ├── browser-service.ts      # Chromium integration
│   │   ├── tab-service.ts          # Tab management
│   │   ├── page-context-service.ts # Current page context extraction
│   │   └── permission-service.ts   # Permission management
│   │
│   ├── automation/           # Browser automation layer
│   │   ├── executor.ts       # Playwright executor
│   │   ├── recorder.ts       # Action recording
│   │   ├── validator.ts      # Outcome validation
│   │   └── strategies/       # Action strategies
│   │
│   ├── ai/                   # AI agent systems
│   │   ├── agents/           # Agent implementations
│   │   │   ├── planner.ts    # Goal → Steps
│   │   │   ├── browser-agent.ts   # Browser control
│   │   │   ├── verification.ts    # Outcome verification
│   │   │   └── memory-agent.ts    # Workflow storage
│   │   ├── models/           # LLM integrations
│   │   │   ├── openai.ts
│   │   │   ├── anthropic.ts
│   │   │   └── gemini.ts
│   │   ├── prompts/          # System prompts
│   │   └── utils/            # Prompt engineering utilities
│   │
│   ├── browser/              # Browser UI components and logic
│   │   ├── window.ts         # Main window management
│   │   ├── tab-manager.ts    # Tab lifecycle
│   │   └── webview.ts        # Webview integration
│   │
│   ├── memory/               # Persistence layer
│   │   ├── repository.ts     # Repository pattern
│   │   ├── migrations.ts     # Database migrations
│   │   ├── models/           # Data models
│   │   └── sqlite.ts         # SQLite adapter
│   │
│   ├── ui/                   # React UI components
│   │   ├── components/       # Reusable components
│   │   ├── sidebar/          # AI sidebar
│   │   ├── toolbar/          # Navigation toolbar
│   │   ├── layouts/          # Layout components
│   │   └── styles/           # Global styles
│   │
│   ├── hooks/                # React hooks
│   │   ├── use-browser.ts
│   │   ├── use-ai-chat.ts
│   │   └── use-automation.ts
│   │
│   ├── store/                # Zustand state management
│   │   ├── browser-store.ts
│   │   ├── ai-store.ts
│   │   └── ui-store.ts
│   │
│   ├── utils/                # Utility functions
│   │   ├── logger.ts         # Logging system
│   │   ├── validators.ts     # Input validation
│   │   ├── sanitizers.ts     # Security sanitizers
│   │   └── helpers.ts        # General utilities
│   │
│   ├── types/                # Global TypeScript types
│   │   ├── ai.ts
│   │   ├── browser.ts
│   │   ├── automation.ts
│   │   └── index.ts
│   │
│   ├── main/                 # Electron main process
│   │   ├── main.ts           # Entry point
│   │   ├── preload.ts        # Preload script
│   │   └── ipc/              # IPC handlers
│   │
│   ├── test/                 # Testing utilities
│   │   ├── setup.ts
│   │   ├── mocks.ts
│   │   └── factories.ts
│   │
│   └── App.tsx               # Root React component
│
├── public/                   # Static assets
├── docs/                     # Documentation
│   ├── API.md
│   ├── AGENTS.md
│   ├── SECURITY.md
│   └── PERFORMANCE.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.cjs
├── electron-builder.json
└── README.md
```

## Layer Architecture

### 1. **Presentation Layer** (`ui/`, `hooks/`)
- React components with TailwindCSS
- State management via Zustand
- Custom hooks for feature logic

### 2. **Application Layer** (`features/`, `services/`)
- Business logic coordination
- Use case implementations
- Service orchestration

### 3. **Domain Layer** (`core/`, `ai/`, `automation/`)
- Pure business rules
- AI agents
- Browser automation logic
- No UI or framework dependencies

### 4. **Infrastructure Layer** (`memory/`, `browser/`, `main/`)
- Database (SQLite)
- Chromium integration
- Electron/IPC communication
- External API calls

## AI Agent System

### Agent Types

```
┌─────────────────────────────────────────┐
│         User Input (Goal)                │
└────────────────────┬────────────────────┘
                     │
         ┌───────────▼──────────┐
         │  Planner Agent       │
         │  - Break into steps  │
         │  - Plan workflow     │
         └───────────┬──────────┘
                     │
         ┌───────────▼──────────────┐
         │  Browser Agent           │
         │  - Execute actions       │
         │  - Control automation    │
         │  - Handle errors         │
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │  Verification Agent      │
         │  - Check outcomes        │
         │  - Validate results      │
         │  - Suggest corrections   │
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │  Memory Agent            │
         │  - Store workflow        │
         │  - Log execution         │
         │  - Update context        │
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │  Result to User          │
         └──────────────────────────┘
```

### Agent Communication

- **Strongly typed**: Protocol Buffer-like interfaces
- **Async**: All inter-agent communication is async
- **Error handling**: Graceful degradation
- **Logging**: Full audit trail

## Data Flow

### Browser Action Flow

```
User Goal
    ↓
AI Planner (OpenAI/Claude/Gemini)
    ↓
Action Plan: [click(selector), type(text), scroll(), ...]
    ↓
Browser Agent validates against page DOM
    ↓
Playwright Executor executes actions
    ↓
Verification Agent checks outcomes
    ↓
Memory Agent logs workflow
    ↓
Result to User
```

## State Management Strategy

### Global State (Zustand stores)
- **Browser Store**: Active tab, URL history, bookmarks
- **AI Store**: Conversation history, workflow context
- **UI Store**: Sidebar visibility, theme, layout

### Local Component State
- Form inputs
- Temporary UI interactions
- Animation states

## Security Architecture

### Sensitive Operations
All require explicit user confirmation:
- Purchase
- Payment
- Password change
- Message sending
- Form submission (when requested)

### Permission System
- Per-website permissions
- Scope-based access control
- Action audit trail
- User consent logs

### Input Validation
- User prompts: Sanitized and validated
- API responses: Strict parsing
- DOM selectors: Validated against page
- Database queries: Parameterized

## Performance Optimization

### Runtime Optimization
- Code splitting by route
- Lazy-load heavy components
- Suspend inactive tabs
- React.memo for expensive renders
- Zustand for granular subscriptions

### Build Optimization
- Tree-shaking
- Minification
- Source maps (dev only)
- Asset compression

### Memory Management
- Dispose of listeners on unmount
- Clear cache periodically
- Limit history size
- Tab suspension strategy

## Testing Strategy

### Unit Tests (Vitest)
- Services, utils, helpers
- AI agents logic
- State reducers
- > 80% coverage target

### Integration Tests
- Feature workflows
- Agent communication
- Database operations
- IPC communication

### E2E Tests (Playwright)
- Full browser workflows
- AI task completion
- UI interactions
- Performance benchmarks

## Deployment Architecture

### Build Process
1. TypeScript → JavaScript (tsc)
2. React JSX compilation (Vite)
3. Bundling (Vite/Rollup)
4. Electron packaging (electron-builder)

### Distribution
- Windows: NSIS, Portable EXE
- macOS: DMG, ZIP
- Linux: AppImage, DEB

### Auto-update
- Delta updates
- Signature verification
- Rollback capability

## Dependencies Philosophy

### Chosen Dependencies
- **React**: Mature UI framework
- **Zustand**: Lightweight state management
- **Playwright**: Reliable automation
- **TypeScript**: Type safety
- **Tailwind**: Utility-first CSS
- **Vite**: Fast build tool
- **Electron**: Desktop shell

### Avoided
- Redux (over-engineered for this app)
- Recoil (less stable)
- Vue (team preference)
- CSS-in-JS (performance hit)
- Angular (heavyweight)

## Monitoring & Observability

### Logging Levels
- ERROR: Critical issues
- WARN: Potential problems
- INFO: Important events
- DEBUG: Detailed execution
- TRACE: Very detailed (dev only)

### Metrics
- Automation success rate
- Average task completion time
- API response latency
- Browser memory usage
- UI render performance

## Future Architecture Considerations

- WebAssembly for performance-critical paths
- Streaming LLM responses
- Collaborative workflows
- Multi-instance coordination
- Plugin system
- Custom agent definitions
