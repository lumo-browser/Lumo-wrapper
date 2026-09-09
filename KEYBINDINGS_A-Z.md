# Lumo Browser – Keyboard Shortcuts (A–Z)

This document lists **every keyboard shortcut** available in Lumo Browser, organized alphabetically by key combination. Shortcuts are drawn from the main process (`mainShortcuts.ts`), the React app (`useAppShortcuts.ts`), the BrowserMenu, BrowserToolbar, and the App.tsx context menu.

---

## Global / Electron-Level Shortcuts
*Registered via `globalShortcut` and work even when the app is not in focus (use sparingly).*

| Shortcut | Function |
|---|---|
| **Ctrl+J** (a.k.a. CommandOrControl+J) | Toggle downloads page (opens `lumo://downloads`) |
| **Ctrl+Shift+I** (a.k.a. CommandOrControl+Shift+I) | Toggle DevTools inspector |

---

## Webview Input Interception
*Intercepted via `web-contents-created` → `before-input-event` (works inside webviews only).*

| Shortcut | Function |
|---|---|
| **Alt+Left** | Go back (same as browser back) |
| **Alt+Right** | Go forward (same as browser forward) |

---

## Tab Management
| Shortcut | Function |
|---|---|
| **Ctrl+T** (a.k.a. CommandOrControl+T) | Add new tab |
| **Ctrl+Shift+T** | Reopen last closed tab |
| **Ctrl+W** (a.k.a. CommandOrControl+W) | Close current tab |
| **Ctrl+1** – **Ctrl+9** | Jump to tab at position number (e.g. Ctrl+1 = first tab) |
| **Ctrl+Tab** | Cycle tabs forward |
| **Ctrl+Shift+Tab** | Cycle tabs backward |
| **Alt+Home** | Navigate to Lumo Home (`lumo://newtab`) |

---

## Address Bar & Navigation
| Shortcut | Function |
|---|---|
| **Ctrl+L** | Focus address bar (dispatches `lumo:focus-address-bar`) |
| **Alt+D** | Focus address bar (alternative) |
| **Ctrl+F** | Find in page (dispatches `lumo:find-in-page`) |

---

## Browsing Actions
| Shortcut | Function |
|---|---|
| **Alt+ArrowLeft** | Go back |
| **Alt+ArrowRight** | Go forward |
| **Escape** | Stop loading / halt navigation |
| **F5** (or **Ctrl+R**) | Refresh page |

---

## Zoom & View
| Shortcut | Function |
|---|---|
| **Ctrl+Plus** (`=` ) / **Ctrl+=** | Zoom in |
| **Ctrl+Minus** (`-`) | Zoom out |
| **Ctrl+0** | (not natively bound – resets zoom) |

---

## Bookmarks, History & Settings
| Shortcut | Function |
|---|---|
| **Ctrl+B** | Open bookmarks (`lumo://bookmarks`) |
| **Ctrl+H** | Open history (`lumo://history`) |
| **Ctrl+,** | Open settings (`lumo://settings`) |
| **Ctrl+Shift+Delete** | Navigate to settings page |

---

## AI & Agent
| Shortcut | Function |
|---|---|
| **Ctrl+Shift+A** | Toggle AI sidebar |
| **Ctrl+Shift+R** | Toggle autonomous agent |
| **Ctrl+Shift+G** | Group tabs with AI |

---

## Page Actions
| Shortcut | Function |
|---|---|
| **Ctrl+D** | Toggle bookmark for current page |
| **Ctrl+S** | Download current page (Save Page As) |
| **Ctrl+P** | Print current page |
| **Ctrl+U** | View page source (`view-source:`) |
| **Ctrl+Shift+I** (in context menu) | Open DevTools |

---

## Context Menu / General (App.tsx)
*Shortcuts shown in the browser’s context menu (right-click → “Undo/Redo/Copy/Paste/etc.”).*

| Shortcut | Function |
|---|---|
| **Ctrl+Z** | Undo |
| **Ctrl+Y** | Redo |
| **Ctrl+X** | Cut |
| **Ctrl+C** | Copy |
| **Ctrl+V** | Paste |
| **Ctrl+Shift+V** | Paste and Match Style |
| **Ctrl+A** | Select All |

---

## Zero-Trust & Security (IPC Guards)
*Registered via `guardedOn`/`guardedHandle` in `src/main/ipc-guard.ts`. These are IPC channel handlers, not direct keyboard shortcuts, but are invoked by the shortcuts above.*

| Channel | Permission Level |
|---|---|
| `lumo:set-ad-blocker` | SESSION |
| `lumo:set-security-monitor` | ADMIN |
| `lumo:set-zero-trust-mode` | ADMIN |
| `lumo:vault-save` | SESSION |
| `lumo:native-click` | SENSITIVE |
| `lumo:native-key` | SENSITIVE |
| `lumo:native-type` | SENSITIVE |
| `lumo:capture-webview` | SENSITIVE |

---

## Notes
- **macOS users**: Wherever `Ctrl` is specified, the equivalent **Command (⌘)** key is used (e.g. `Command+T` instead of `Ctrl+T`). The code uses `CommandOrControl` to support both platforms.
- **Webview vs. main window**: Some shortcuts (Alt+Left/Right, go-back/forward) are intercepted only inside webview tabs; the main window uses native browser behavior.
- **Zero-trust mode**: In ZT mode, additional permission prompts may appear for unrecognized domains when using keyboard‑driven navigation.
- **Incognito**: `Ctrl+Shift+N` currently shows a “coming soon” alert (no native incognito mode yet).