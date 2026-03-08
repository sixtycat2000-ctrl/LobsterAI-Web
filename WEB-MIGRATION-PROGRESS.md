# Web Migration Progress

## Overview

This document tracks the migration of LobsterAI from an Electron desktop application to a web application.

## Architecture

### Original (Electron)
```
┌─────────────────┐      IPC       ┌──────────────────┐
│   Renderer      │ <----------->  │    Main Process  │
│  (React UI)     │               │   (Node.js)      │
│                 │               │                  │
│ window.electron │               │  - SQLite        │
│  - cowork       │               │  - Claude SDK    │
│  - skills       │               │  - IM Gateways   │
│  - mcp          │               │  - File System   │
│  - store        │               │  - Native APIs   │
└─────────────────┘               └──────────────────┘
```

### Target (Web)
```
┌─────────────────┐   HTTP/WS    ┌──────────────────┐
│   Browser       │ <----------->  │   Web Server     │
│  (React UI)     │               │   (Express)      │
│                 │               │                  │
│ window.electron │               │  - PostgreSQL    │
│  (Shim)         │               │  - Claude SDK    │
│                 │               │  - IM Gateways   │
└─────────────────┘               └──────────────────┘
```

## Completed Tasks

### 1. Frontend API Client Layer (`src/renderer/services/apiClient.ts`)
- Created base `ApiClient` class with `fetch` wrapper
- Supports GET, POST, PUT, DELETE methods
- SSE streaming support via `stream()` method
- Configurable API base URL via environment variables

### 2. WebSocket Client (`src/renderer/services/webSocketClient.ts`)
- `WebSocketClient` class with auto-reconnect
- Event-based API (matches IPC listener pattern)
- Event type constants in `WS_EVENTS`
- Singleton pattern for app-wide usage

### 3. Electron Shim (`src/renderer/services/electronShim.ts`)
- Complete `window.electron` interface replacement
- Maps all IPC calls to HTTP/WebSocket equivalents
- Stub implementations for non-web features:
  - Window controls (minimize, maximize, close)
  - File dialogs (partial HTML fallback)
  - Shell operations (openExternal works)
  - App updates
  - File system operations

### 4. Web Build Configuration
- `vite.config.web.ts` - Pure web Vite config (no Electron plugins)
- `index.web.html` - Web entry HTML
- `src/renderer/mainWeb.tsx` - Web entry point (initializes shim)
- `package.json` scripts added:
  - `dev:web` - Development server on port 5176
  - `build:web` - Production build to `dist-web/`
  - `preview:web` - Preview production build

### 5. IPC to API Mapping

| IPC Channel | HTTP Endpoint | WebSocket Event |
|-------------|---------------|-----------------|
| `store.get` | `GET /store/:key` | - |
| `store.set` | `PUT /store/:key` | - |
| `cowork.startSession` | `POST /cowork/sessions/start` | `cowork:message` |
| `cowork.continueSession` | `POST /cowork/sessions/:id/continue` | `cowork:messageUpdate` |
| `cowork.onStreamMessage` | - | `cowork:message` |
| `cowork.onStreamPermission` | - | `cowork:permission` |
| `skills.list` | `GET /skills` | `skills:changed` |
| `mcp.list` | `GET /mcp/servers` | - |
| `im.getConfig` | `GET /im/config` | `im:statusChange` |
| `scheduledTasks.list` | `GET /scheduled-tasks` | `task:statusUpdate` |

## In Progress Tasks

### Backend Server (`server/`)
- [ ] Express server setup
- [ ] PostgreSQL database schema
- [ ] API route implementations
- [ ] WebSocket event broadcasting
- [ ] Claude SDK integration
- [ ] IM gateway HTTP adapters

### File System Operations
- [ ] File upload/download APIs
- [ ] Working directory management
- [ ] Image attachment handling

### Electron-specific Features
- [ ] Remove WindowTitleBar component (web doesn't need it)
- [ ] Update platform-specific CSS
- [ ] Remove native menu references

## How to Run Web Dev

```bash
# Install dependencies
npm install

# Run web dev server (port 5176)
npm run dev:web

# Build for production
npm run build:web

# Preview production build
npm run preview:web
```

## Environment Variables

```bash
# API server base URL
VITE_API_BASE_URL=http://localhost:3001

# WebSocket URL
VITE_WS_URL=ws://localhost:3001/ws
```

## Known Limitations

1. **File System**: Browser cannot access local file system directly
   - Solution: Upload/download via API, virtual working directory

2. **Window Controls**: Minimize/maximize/close are OS-specific
   - Solution: Stubbed in shim, not applicable to web

3. **Native Menus**: Electron has native menus
   - Solution: Use web-based UI for all actions

4. **Auto Launch**: OS startup integration
   - Solution: Not applicable in web

5. **App Updates**: Electron auto-update
   - Solution: Web app updates by refreshing

## Testing Checklist

- [ ] Cowork sessions start/continue/stop
- [ ] Skills list/enable/disable
- [ ] MCP servers CRUD
- [ ] IM gateway configuration
- [ ] Scheduled tasks management
- [ ] Real-time events via WebSocket
- [ ] Theme switching
- [ ] Language switching
