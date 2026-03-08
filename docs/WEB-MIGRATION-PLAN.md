# LobsterAI Electron to Localhost Web UI Migration Plan

## Executive Summary

This document provides a comprehensive migration plan for transitioning LobsterAI from an Electron desktop application to a localhost Web UI architecture. The migration preserves all backend capabilities (SQLite, Claude Agent SDK, IM Gateways, Skills, MCP, Scheduler) while enabling browser-based access.

**Current Status:** Approximately 80% complete. The server infrastructure, API routes, WebSocket events, and frontend shim layer are fully implemented.

---

## 1. Architecture Design

### 1.1 Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Localhost Web UI (Browser)                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  React SPA (served from :3001 or separate Vite dev server)      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │   │
│  │  │ Redux Store  │  │ electronShim │  │ Components/Views     │   │   │
│  │  │ (unchanged)  │  │ (HTTP/WS)    │  │ (platform-conditional)│   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                    HTTP :3001  │  WebSocket :3001/ws
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              Backend Desktop App (Node.js Process)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────────┐ │
│  │ Express API │  │  WebSocket  │  │      Static File Server         │ │
│  │  (REST)     │  │  (Events)   │  │   (production build only)       │ │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────────────┘ │
│         └────────────────┼─────────────────────────────────────────────┘
│                          ▼                                              │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    Core Services (复用现有代码)                     │ │
│  │  ┌───────────────┐  ┌────────────────┐  ┌────────────────────┐    │ │
│  │  │ SqliteStore   │  │ CoworkRunner   │  │ SkillManager       │    │ │
│  │  │ (sql.js)      │  │ (Claude SDK)   │  │ (file-based)       │    │ │
│  │  └───────────────┘  └────────────────┘  └────────────────────┘    │ │
│  │  ┌───────────────┐  ┌────────────────┐  ┌────────────────────┐    │ │
│  │  │ McpStore      │  │ IMGatewayMgr   │  │ Scheduler          │    │ │
│  │  │ (SQLite)      │  │ (multi-platform)│  │ (cron + tasks)     │    │ │
│  │  └───────────────┘  └────────────────┘  └────────────────────┘    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Data: ~/.lobsterai/web/lobsterai.sqlite                               │
│  Skills: ~/.lobsterai/web/skills/                                      │
│  Logs: ~/.lobsterai/web/logs/                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Communication Protocol Design

#### HTTP API Endpoints (RESTful)

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| **Store** | `/api/store/:key` | GET/PUT/DELETE | Key-value storage |
| **Cowork Sessions** | `/api/cowork/sessions` | GET/POST | List/create sessions |
| | `/api/cowork/sessions/:id` | GET/DELETE | Get/delete session |
| | `/api/cowork/sessions/:id/continue` | POST | Continue session |
| | `/api/cowork/sessions/:id/stop` | POST | Stop session |
| | `/api/cowork/sessions/:id/pin` | PATCH | Pin/unpin session |
| | `/api/cowork/config` | GET/PUT | Get/set config |
| | `/api/cowork/memory/entries` | GET/POST | Memory CRUD |
| | `/api/cowork/sandbox/status` | GET | Sandbox status |
| **Skills** | `/api/skills` | GET | List skills |
| | `/api/skills/enabled` | POST | Toggle skill |
| | `/api/skills/:id/config` | GET/PUT | Skill config |
| **MCP** | `/api/mcp/servers` | GET/POST | List/create servers |
| | `/api/mcp/servers/:id` | PUT/DELETE | Update/delete |
| **IM** | `/api/im/config` | GET/PUT | IM configuration |
| | `/api/im/gateways/:platform/start` | POST | Start gateway |
| | `/api/im/gateways/:platform/stop` | POST | Stop gateway |
| | `/api/im/status` | GET | Gateway status |
| **Scheduled Tasks** | `/api/scheduled-tasks` | GET/POST | List/create tasks |
| | `/api/scheduled-tasks/:id` | GET/PUT/DELETE | Task CRUD |
| | `/api/scheduled-tasks/:id/run` | POST | Run manually |
| | `/api/scheduled-tasks/:id/stop` | POST | Stop running |
| **API Proxy** | `/api/api/fetch` | POST | CORS proxy |
| | `/api/api/stream` | POST | SSE streaming |
| **Dialog** | `/api/dialog/directory` | GET | Validate directory |
| | `/api/dialog/saveInlineFile` | POST | Save uploaded file |
| **Shell** | `/api/shell/openExternal` | POST | Open URL |
| **App** | `/api/app/version` | GET | App version |
| | `/api/api-config` | GET/PUT | API config |

#### WebSocket Events

**Server to Client:**
```typescript
// Cowork streaming events
'cowork:stream:message'         // New message
'cowork:stream:messageUpdate'   // Streaming content
'cowork:stream:permission'      // Permission request
'cowork:stream:complete'        // Session complete
'cowork:stream:error'           // Session error
'cowork:sandbox:downloadProgress' // Sandbox download

// IM events
'im:status:change'              // Gateway status
'im:message:received'           // Incoming message

// Scheduler events
'scheduledTask:statusUpdate'    // Task status
'scheduledTask:runUpdate'       // Run update

// Other events
'skills:changed'                // Skills updated
'api:stream:data/:requestId'    // API streaming
'appUpdate:downloadProgress'    // Update progress
```

**Client to Server:**
```typescript
'subscribe'                     // Subscribe to room
'unsubscribe'                   // Unsubscribe from room
'ping'                          // Heartbeat
```

### 1.3 Security Model

#### Local Authentication

```typescript
// server/middleware/auth.ts (to be implemented)
const AUTH_TOKEN = process.env.WEB_AUTH_TOKEN || 'lobsterai-default-token';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['x-auth-token'];

  // Development: allow unauthenticated
  if (process.env.NODE_ENV === 'development' && !token) {
    return next();
  }

  if (token === AUTH_TOKEN) {
    return next();
  }

  res.status(401).json({ success: false, error: 'Unauthorized' });
}
```

#### CORS Configuration

```typescript
// server/index.ts (already implemented)
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
```

#### Path Validation

```typescript
// Validate all file paths are within allowed directories
const validatePath = (inputPath: string, allowedRoots: string[]): boolean => {
  const resolved = path.resolve(inputPath);
  return allowedRoots.some(root => resolved.startsWith(path.resolve(root)));
};
```

---

## 2. Backend Implementation

### 2.1 Express Server Structure

**File: `server/index.ts`** (Already implemented)

Key components:
- Singleton pattern for services (Store, CoworkRunner, SkillManager, etc.)
- Request context middleware
- Health check endpoint
- Graceful shutdown handling

### 2.2 WebSocket Event System

**File: `server/websocket.ts`** (Already implemented)

Features:
- Room-based subscriptions (for session-specific events)
- Auto-reconnection on client side
- Ping/pong heartbeat
- Broadcast to all or specific rooms

### 2.3 Route Implementations

All routes are implemented in `server/routes/`:

| File | Status | Notes |
|------|--------|-------|
| `store.ts` | Complete | Key-value storage |
| `cowork.ts` | Complete | Session management, memory, sandbox |
| `skills.ts` | Complete | Skills CRUD and config |
| `mcp.ts` | Complete | MCP server management |
| `im.ts` | Complete | IM gateway control |
| `scheduledTasks.ts` | Complete | Task CRUD and execution |
| `apiProxy.ts` | Complete | CORS proxy and SSE streaming |
| `dialog.ts` | Complete | File operations for web |
| `shell.ts` | Complete | External URL opening |
| `permissions.ts` | Complete | Calendar permissions (stub) |
| `app.ts` | Complete | Version, locale, API config |
| `log.ts` | Complete | Log path and export |

### 2.4 File Upload/Download Handling

**Dialog routes** (`server/routes/dialog.ts`) handle:
- Base64 file uploads with size limits (25MB max)
- File sanitization (name, extension)
- Directory validation
- Reading files as data URLs

---

## 3. Frontend Adaptation

### 3.1 electronShim Implementation

**File: `src/renderer/services/electronShim.ts`** (Complete)

The shim provides:
- Full `window.electron` interface compatibility
- HTTP API mapping for all IPC calls
- WebSocket event subscriptions
- Stub implementations for non-web features

Key shim strategies:
```typescript
// Example: Cowork session start
const cowork = {
  async startSession(options) {
    return apiClient.post('/cowork/sessions/start', options);
  },
  onStreamMessage(callback) {
    return webSocketClient.on(WS_EVENTS.COWORK_MESSAGE, callback);
  },
  // ... other methods
};
```

### 3.2 State Management

**No changes required** - Redux store and slices remain unchanged. The shim ensures all service calls return the same data structures.

### 3.3 Platform-Specific Components

**WindowTitleBar** (`src/renderer/components/window/WindowTitleBar.tsx`):
```typescript
// Already handles web build
if (isWebBuild() || !isWindows()) {
  return null;
}
```

**AppUpdateBadge/AppUpdateModal**:
```typescript
// Already uses hasAppUpdate() check
const updateBadge = updateInfo && hasAppUpdate() ? <AppUpdateBadge .../> : null;
```

**Settings Component**:
- Auto-launch section should use `hasAutoLaunch()` check
- App update section should use `hasAppUpdate()` check

### 3.4 File Operations Adaptation

**Directory Selection:**
```typescript
// Electron: Native dialog
const result = await window.electron.dialog.selectDirectory();

// Web: HTML input with webkitdirectory
const input = document.createElement('input');
input.type = 'file';
input.webkitdirectory = true;
input.onchange = (e) => {
  const files = (e.target as HTMLInputElement).files;
  // Process files
};
input.click();
```

**File Selection:**
```typescript
// Web: Standard file input
const input = document.createElement('input');
input.type = 'file';
input.accept = 'image/png,image/jpeg';
input.onchange = (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
};
input.click();
```

---

## 4. Startup Methods

### 4.1 Development Mode

**Option A: Separate servers (recommended for development)**

```bash
# Terminal 1: Start backend server
npm run server:dev  # Need to add this script

# Terminal 2: Start frontend dev server
npm run dev:web     # Already exists
```

Frontend (Vite on port 5176) proxies to backend (port 3001).

**Option B: Combined server**

```bash
# Single command (need to add script)
npm run dev:web:full
```

### 4.2 Production Mode

**Build and serve from single port:**

```bash
# Build frontend
npm run build:web

# Start server (serves static files)
npm run server:start
```

The server serves the built frontend from `dist-web/` when `NODE_ENV=production`.

### 4.3 Package Scripts to Add

```json
{
  "scripts": {
    "server:dev": "tsx watch server/index.ts",
    "server:start": "node dist-server/index.js",
    "server:build": "tsc -p server.tsconfig.json",
    "dev:web:full": "concurrently \"npm run server:dev\" \"npm run dev:web\"",
    "start:web": "npm run build:web && npm run server:start"
  }
}
```

---

## 5. Migration Steps

### Phase 1: Core Infrastructure (COMPLETE)

**Status:** Done

**Completed items:**
- [x] Express server setup (`server/index.ts`)
- [x] WebSocket server (`server/websocket.ts`)
- [x] All API route implementations (`server/routes/*.ts`)
- [x] Frontend API client (`src/renderer/services/apiClient.ts`)
- [x] WebSocket client (`src/renderer/services/webSocketClient.ts`)
- [x] Electron shim (`src/renderer/services/electronShim.ts`)
- [x] Web build config (`vite.config.web.ts`)
- [x] Web entry point (`src/renderer/mainWeb.tsx`)
- [x] Platform detection utilities (`src/renderer/utils/platform.ts`)

### Phase 2: Authentication & Security (IN PROGRESS)

**Priority:** High

**Tasks:**
1. Add authentication middleware to server
2. Configure token in frontend
3. Add path validation for file operations
4. Implement rate limiting (optional)

**Files to modify:**
- `server/index.ts` - Add auth middleware
- `server/middleware/auth.ts` - Create auth middleware
- `src/renderer/services/apiClient.ts` - Add auth header

### Phase 3: File Operations Enhancement

**Priority:** Medium

**Tasks:**
1. Implement working directory browser UI component
2. Add file upload component for image attachments
3. Handle file download from server
4. Add drag-and-drop file support

**Files to create:**
- `src/renderer/components/common/FileUpload.tsx`
- `src/renderer/components/common/DirectoryBrowser.tsx`

### Phase 4: UI Polish

**Priority:** Medium

**Tasks:**
1. Verify all conditional rendering for web build
2. Add web-specific CSS adjustments
3. Remove/update keyboard shortcuts for web
4. Test responsive design

**Files to review:**
- `src/renderer/App.tsx`
- `src/renderer/components/Settings.tsx`
- All view components

### Phase 5: Testing & Documentation

**Priority:** High

**Tasks:**
1. Create E2E test suite for web version
2. Test all features manually
3. Update user documentation
4. Create deployment guide

### Phase 6: Packaging

**Priority:** Low (future)

**Tasks:**
1. Create single-executable package (pkg, nsis, AppImage)
2. Add auto-start capability
3. System tray integration (optional)

---

## 6. Risk Assessment

### 6.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| WebSocket connection drops | High | Auto-reconnect implemented, add visual indicator |
| Large file uploads timeout | Medium | Chunked uploads, progress indicator |
| Concurrent session access | Medium | Room-based subscriptions, session locking |
| Memory leaks in long sessions | Medium | Periodic cleanup, session timeouts |
| CORS issues in some browsers | Low | Server proxy for external APIs |

### 6.2 Compatibility Issues

| Issue | Affected Feature | Solution |
|-------|-----------------|----------|
| No native file dialogs | Directory selection | Use HTML5 file input with webkitdirectory |
| No direct file system access | Working directory | Upload/download via API |
| No system tray | Background running | Keep browser tab open |
| No auto-launch | Startup | Manual start or OS scheduler |
| No native menus | Context menus | Use web-based dropdown menus |

### 6.3 Mitigation Strategies

**For file operations:**
- Provide clear UI guidance for file selection
- Support drag-and-drop as alternative
- Cache frequently used files client-side

**For real-time features:**
- Implement heartbeat mechanism
- Show connection status indicator
- Queue operations when disconnected

**For user experience:**
- Progressive enhancement for advanced features
- Clear documentation of web limitations
- Keyboard shortcut alternatives

---

## 7. Acceptance Criteria

### 7.1 Functional Requirements

- [ ] User can start new cowork session from browser
- [ ] User can send prompts and receive streaming responses
- [ ] Permission modal appears correctly in browser
- [ ] User can create/edit/delete cowork sessions
- [ ] User can configure skills and MCP servers
- [ ] User can manage scheduled tasks
- [ ] File uploads work for image attachments
- [ ] Settings persist correctly (theme, language, models)
- [ ] Memory management works (view, add, edit, delete)
- [ ] Multiple browser tabs can connect simultaneously
- [ ] WebSocket reconnects after server restart
- [ ] Authentication works correctly

### 7.2 Non-Functional Requirements

- [ ] API response time < 200ms for non-streaming endpoints
- [ ] WebSocket latency < 100ms for streaming
- [ ] Support concurrent users (at least 5)
- [ ] Works in Chrome, Firefox, Safari, Edge
- [ ] Mobile-responsive design (optional)

### 7.3 Quality Requirements

- [ ] No console errors during normal operation
- [ ] All TypeScript types compile without errors
- [ ] ESLint passes without warnings
- [ ] Code coverage > 70% for new code

---

## 8. Appendix

### A. Environment Variables

```bash
# .env.web
PORT=3001                          # Server port
NODE_ENV=development               # Environment
WEB_AUTH_TOKEN=your-secret-token   # Auth token
CORS_ORIGIN=*                      # CORS origin
LOBSTERAI_DATA_PATH=/custom/path   # Custom data path
```

### B. Data Migration

The web version uses the same SQLite schema as Electron. To migrate existing data:

```bash
# Copy database from Electron to web
cp ~/Library/Application\ Support/lobsterai/lobsterai.sqlite ~/.lobsterai/web/
```

### C. Debugging

**Backend:**
```bash
DEBUG=* npm run server:dev
```

**Frontend:**
Open browser DevTools, check Console and Network tabs.

**WebSocket:**
Use browser's Network tab > WS filter to monitor WebSocket traffic.

---

## 9. Critical Files for Implementation

List of files most critical for implementing this plan:

1. **`server/index.ts`** - Core server entry point; needs auth middleware integration
2. **`src/renderer/services/electronShim.ts`** - Complete shim implementation; verify all API mappings
3. **`src/renderer/utils/platform.ts`** - Platform detection; ensure web build detection works correctly
4. **`vite.config.web.ts`** - Web build configuration; proxy settings for development
5. **`server/websocket.ts`** - WebSocket server; room subscriptions for session events
