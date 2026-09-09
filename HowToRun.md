# How to Run Lumo Browser

## Quick Start (Recommended)

```bash
npm run dev
```

This single command does everything:
- Starts the backend API server
- Starts Vite dev server at `http://127.0.0.1:5173`
- Launches Electron window

## Available npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev mode (backend + frontend + Electron) |
| `npm run dev:backend` | Start only the backend API server (`cd backend && npm run dev`) |
| `npm run dev:vite` | Start only the Vite frontend dev server |
| `npm run dev:electron` | Build Electron + launch browser (waits for Vite server) |
| `npm run build` | Build both backend and frontend for production |
| `npm run build:electron` | Build Electron main process with esbuild |
| `npm run package` | Package Electron app using electron-builder |
| `npm test` | Run unit tests with vitest |
| `npm run test:e2e` | Run e2e tests with playwright |

## Manual Development (Step-by-Step)

If you want to run components separately:

### 1. Start the Backend API Server
```bash
cd backend && npm run dev
```
Runs `tsx watch src/server.ts` - the Express server with SQLite.

### 2. Start the Frontend Dev Server
```bash
npm run dev:vite
```
Vite runs at `http://127.0.0.1:5173`.

### 3. Launch Electron
```bash
npm run dev:electron
```
This builds the Electron main process and opens the browser, waiting for the Vite dev server at `http://127.0.0.1:5173`.

## Production Build

```bash
npm run build
```

Then run the built Electron app:
```bash
npm run package
```

or manually:
```bash
electron dist/main/main.js
```

## Notes

- **Electron 27.3.11** is the used version
- The app uses `--no-sandbox` flag by default
- Backend runs on default Node.js port (express defaults to no specific port, listens implicitly)
- Frontend Vite dev server runs on `http://127.0.0.1:5173`
- For production, the app falls back to `file://${index.html}` when not in dev mode