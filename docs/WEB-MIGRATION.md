# LobsterAI Web Migration Guide

This document describes the migration of LobsterAI from an Electron desktop application to a web application.

## Overview

LobsterAI is an AI-assisted coding assistant that uses the Claude Agent SDK. The Electron version uses SQLite for storage and IPC for communication between main and renderer processes. The web version will use a Node.js/Express backend with REST/WebSocket APIs and the same SQLite database.

### Architecture Changes

**Electron Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ CoworkRunner│  │  SqliteStore │  │  IPC Handlers      │ │
│  │  (Agent SDK)│  │  (sql.js)    │  │  (all APIs)        │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕ IPC
┌─────────────────────────────────────────────────────────────┐
│                    Renderer Process (React)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Redux Store  │  Services  │  Components  │  Views   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Web Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (React)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Redux Store  │  API Client  │  Components  │  Views │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                   Node.js/Express Server                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ CoworkRunner│  │  SqliteStore │  │  REST/WebSocket    │ │
│  │  (Agent SDK)│  │  (better-sqlite3)│     APIs          │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Files to Create

### Backend

| File | Purpose |
|------|---------|
| `server/index.ts` | Express server entry point |
| `server/routes/api.ts` | Express API routes |
| `server/routes/cowork.ts` | Cowork session endpoints |
| `server/routes/config.ts` | Configuration endpoints |
| `server/routes/skills.ts` | Skill management endpoints |
| `server/routes/mcp.ts` | MCP server endpoints |
| `server/routes/scheduledTasks.ts` | Scheduled task endpoints |
| `server/routes/im.ts` | IM gateway endpoints |
| `server/websocket/index.ts` | WebSocket server for streaming |
| `server/websocket/coworkStream.ts` | Cowork streaming via WebSocket |
| `server/middleware/auth.ts` | Authentication middleware |
| `server/storage/database.ts` | SQLite database wrapper |
| `server/services/coworkRunner.ts` | Adapted CoworkRunner for server |

### Frontend

| File | Purpose |
|------|---------|
| `src/renderer/services/apiClient.ts` | HTTP API client layer |
| `src/renderer/services/websocketClient.ts` | WebSocket client for streaming |
| `src/renderer/utils/electronCompat.ts` | Electron API compatibility shims |
| `src/renderer/web/index.html` | Web entry HTML (Vite) |

### Configuration

| File | Purpose |
|------|---------|
| `server.tsconfig.json` | Server TypeScript configuration |
| `vite.config.web.ts` | Web build configuration |
| `.env.example` | Environment variables template |

## Files to Modify

### Remove Electron-Specific Imports

| File | Change |
|------|--------|
| `src/renderer/App.tsx` | Remove `WindowTitleBar`, `AppUpdateBadge`, `AppUpdateModal`, auto-launch, update checks |
| `src/renderer/services/cowork.ts` | Replace IPC calls with API client calls |
| `src/renderer/services/api.ts` | Replace `window.electron.api.stream` with WebSocket |
| `src/renderer/services/config.ts` | Replace `window.electron.store` with HTTP API |
| `src/renderer/store/slices/coworkSlice.ts` | No changes needed (state management is platform-agnostic) |

### Components to Remove

| Component | Reason |
|-----------|--------|
| `src/renderer/components/window/WindowTitleBar.tsx` | Windows-only custom title bar |
| `src/renderer/components/update/AppUpdateBadge.tsx` | Desktop auto-update |
| `src/renderer/components/update/AppUpdateModal.tsx` | Desktop auto-update |
| Auto-launch settings in `Settings.tsx` | Desktop-only feature |

## IPC to REST API Mapping

### Store (Key-Value Storage)

| IPC Channel | REST API | Method |
|-------------|----------|--------|
| `store:get` | `/api/store/:key` | GET |
| `store:set` | `/api/store/:key` | PUT |
| `store:remove` | `/api/store/:key` | DELETE |

### Cowork Sessions

| IPC Channel | REST API | Method |
|-------------|----------|--------|
| `cowork:session:start` | `/api/cowork/sessions` | POST |
| `cowork:session:continue` | `/api/cowork/sessions/:id/messages` | POST |
| `cowork:session:stop` | `/api/cowork/sessions/:id/stop` | POST |
| `cowork:session:get` | `/api/cowork/sessions/:id` | GET |
| `cowork:session:list` | `/api/cowork/sessions` | GET |
| `cowork:session:delete` | `/api/cowork/sessions/:id` | DELETE |
| `cowork:session:deleteBatch` | `/api/cowork/sessions` | DELETE (batch) |
| `cowork:session:pin` | `/api/cowork/sessions/:id/pin` | PATCH |
| `cowork:session:rename` | `/api/cowork/sessions/:id/rename` | PATCH |

### Cowork Configuration

| IPC Channel | REST API | Method |
|-------------|----------|--------|
| `cowork:config:get` | `/api/cowork/config` | GET |
| `cowork:config:set` | `/api/cowork/config` | PATCH |

### Cowork Memory

| IPC Channel | REST API | Method |
|-------------|----------|--------|
| `cowork:memory:listEntries` | `/api/cowork/memory` | GET |
| `cowork:memory:createEntry` | `/api/cowork/memory` | POST |
| `cowork:memory:updateEntry` | `/api/cowork/memory/:id` | PATCH |
| `cowork:memory:deleteEntry` | `/api/cowork/memory/:id` | DELETE |
| `cowork:memory:getStats` | `/api/cowork/memory/stats` | GET |

### Skills

| IPC Channel | REST API | Method |
|-------------|----------|--------|
| `skills:list` | `/api/skills` | GET |
| `skills:setEnabled` | `/api/skills/:id/enabled` | PATCH |
| `skills:delete` | `/api/skills/:id` | DELETE |
| `skills:download` | `/api/skills/download` | POST |
| `skills:getConfig` | `/api/skills/:id/config` | GET |
| `skills:setConfig` | `/api/skills/:id/config` | PUT |

### MCP Servers

| IPC Channel | REST API | Method |
|-------------|----------|--------|
| `mcp:list` | `/api/mcp` | GET |
| `mcp:create` | `/api/mcp` | POST |
| `mcp:update` | `/api/mcp/:id` | PUT |
| `mcp:delete` | `/api/mcp/:id` | DELETE |
| `mcp:setEnabled` | `/api/mcp/:id/enabled` | PATCH |
| `mcp:fetchMarketplace` | `/api/mcp/marketplace` | GET |

### Scheduled Tasks

| IPC Channel | REST API | Method |
|-------------|----------|--------|
| `scheduledTask:list` | `/api/scheduled-tasks` | GET |
| `scheduledTask:get` | `/api/scheduled-tasks/:id` | GET |
| `scheduledTask:create` | `/api/scheduled-tasks` | POST |
| `scheduledTask:update` | `/api/scheduled-tasks/:id` | PUT |
| `scheduledTask:delete` | `/api/scheduled-tasks/:id` | DELETE |
| `scheduledTask:toggle` | `/api/scheduled-tasks/:id/toggle` | PATCH |
| `scheduledTask:runManually` | `/api/scheduled-tasks/:id/run` | POST |
| `scheduledTask:stop` | `/api/scheduled-tasks/:id/stop` | POST |
| `scheduledTask:listRuns` | `/api/scheduled-tasks/:id/runs` | GET |
| `scheduledTask:listAllRuns` | `/api/scheduled-tasks/runs` | GET |

### IM Gateways

| IPC Channel | REST API | Method |
|-------------|----------|--------|
| `im:config:get` | `/api/im/config` | GET |
| `im:config:set` | `/api/im/config` | PUT |
| `im:gateway:start` | `/api/im/gateway/:platform/start` | POST |
| `im:gateway:stop` | `/api/im/gateway/:platform/stop` | POST |
| `im:gateway:test` | `/api/im/gateway/:platform/test` | POST |
| `im:status:get` | `/api/im/status` | GET |

### Dialog (File Operations)

| IPC Channel | Web Alternative |
|-------------|-----------------|
| `dialog:selectDirectory` | `<input type="file" webkitdirectory>` |
| `dialog:selectFile` | `<input type="file">` |
| `dialog:saveInlineFile` | Download with `Content-Disposition` |
| `dialog:readFileAsDataUrl` | Client-side FileReader API |

### Shell Operations

| IPC Channel | Web Alternative |
|-------------|-----------------|
| `shell:openPath` | `window.open()` or download link |
| `shell:showItemInFolder` | Not supported in web |
| `shell:openExternal` | `window.open(url, '_blank')` |

## WebSocket Events

### Server → Client (Streaming)

| Event | Payload | Purpose |
|-------|---------|---------|
| `cowork:message` | `{ sessionId, message }` | New message added |
| `cowork:messageUpdate` | `{ sessionId, messageId, content }` | Streaming content update |
| `cowork:permission` | `{ sessionId, request }` | Permission request |
| `cowork:complete` | `{ sessionId, claudeSessionId }` | Session complete |
| `cowork:error` | `{ sessionId, error }` | Session error |
| `skills:changed` | `void` | Skills list updated |
| `im:status:change` | `status` | IM gateway status change |
| `im:message:received` | `message` | IM message received |
| `scheduledTask:statusUpdate` | `data` | Task status update |
| `scheduledTask:runUpdate` | `data` | Task run update |

### Client → Server (Commands)

| Event | Payload | Purpose |
|-------|---------|---------|
| `cowork:respondPermission` | `{ requestId, result }` | Permission response |
| `cowork:cancelStream` | `{ sessionId }` | Cancel streaming |

## Authentication Strategy

For local-only use, the web version will use a **simple token-based authentication**:

### Implementation

1. **Server Setup** (`server/middleware/auth.ts`):
   ```typescript
   import { Request, Response, NextFunction } from 'express';

   const AUTH_TOKEN = process.env.WEB_AUTH_TOKEN || 'lobsterai-default-token';
   const AUTH_TOKEN_HEADER = 'x-auth-token';

   export function authMiddleware(req: Request, res: Response, next: NextFunction) {
     const token = req.headers[AUTH_TOKEN_HEADER];

     if (token === AUTH_TOKEN) {
       next();
     } else if (process.env.NODE_ENV === 'development' && !token) {
       // Allow unauthenticated in development for convenience
       next();
     } else {
       res.status(401).json({ error: 'Unauthorized' });
     }
   }
   ```

2. **Client Setup** (`src/renderer/services/apiClient.ts`):
   ```typescript
   const AUTH_TOKEN = localStorage.getItem('lobsterai_auth_token') ||
                      process.env.VITE_WEB_AUTH_TOKEN ||
                      'lobsterai-default-token';

   const headers = {
     'Content-Type': 'application/json',
     'x-auth-token': AUTH_TOKEN,
   };
   ```

### Security Considerations

- **Development**: No auth required (convenience)
- **Production**: Simple token auth via `x-auth-token` header
- **Token Storage**: Stored in `localStorage` (acceptable for local-only apps)
- **HTTPS Required**: For production deployments
- **Network Exposure**: Only bind to localhost by default

### Environment Variables

```bash
# .env
WEB_AUTH_TOKEN=your-secret-token-here
WEB_PORT=5175
WEB_HOST=localhost
NODE_ENV=production
```

## File System Operations Adaptation

### Directory Selection

**Electron:**
```typescript
const result = await window.electron.dialog.selectDirectory();
```

**Web:**
```typescript
// Using webkitdirectory attribute
const input = document.createElement('input');
input.type = 'file';
input.webkitdirectory = true;
input.onchange = (e) => {
  const files = (e.target as HTMLInputElement).files;
  // Files are relative to selected directory
};
input.click();
```

### File Selection

**Electron:**
```typescript
const result = await window.electron.dialog.selectFile({
  filters: [{ name: 'Images', extensions: ['png', 'jpg'] }]
});
```

**Web:**
```typescript
const input = document.createElement('input');
input.type = 'file';
input.accept = 'image/png,image/jpeg';
input.onchange = (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
};
input.click();
```

### Opening Files/URLs

**Electron:**
```typescript
await window.electron.shell.openPath(filePath);
await window.electron.shell.openExternal(url);
```

**Web:**
```typescript
// For URLs
window.open(url, '_blank');

// For downloaded files, trigger download from server
const link = document.createElement('a');
link.href = `/api/files/download?path=${encodeURIComponent(filePath)}`;
link.download = '';
link.click();
```

## How to Run the Web Version

### Development

1. **Start the backend server:**
   ```bash
   npm run server:dev
   ```
   This starts the Express server on port 3001 (default).

2. **Start the frontend dev server:**
   ```bash
   npm run web:dev
   ```
   This starts Vite on port 5175 with proxy to backend.

3. **Open in browser:**
   ```
   http://localhost:5175
   ```

### Production Build

1. **Build the frontend:**
   ```bash
   npm run web:build
   ```

2. **Start the server:**
   ```bash
   npm run server:start
   ```

3. **Access the app:**
   ```
   http://localhost:3001
   ```

### Package Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "server:dev": "tsx watch server/index.ts",
    "server:start": "node dist-server/index.js",
    "server:build": "tsc -p server.tsconfig.json",
    "web:dev": "vite --config vite.config.web.ts",
    "web:build": "vite build --config vite.config.web.ts",
    "web:preview": "vite preview --config vite.config.web.ts",
    "dev:web": "concurrently \"npm run server:dev\" \"npm run web:dev\""
  }
}
```

## Known Limitations vs Electron Version

| Feature | Electron | Web | Notes |
|---------|----------|-----|-------|
| File system access | Full access | Limited to user-selected files | Browser sandbox restrictions |
| Custom window controls | Yes | No | Uses browser window |
| Auto-update | Built-in | Manual refresh | No automatic updates |
| Auto-launch | Yes | No | Browser limitation |
| System tray | Yes | No | Not supported in web |
| Global hotkeys | Yes | No (when unfocused) | Browser limitation |
| Native dialogs | OS-native | HTML file input | Different UX |
| Working directory | Full path | Relative paths only | Security restriction |
| Show in folder | Yes | No | Not supported |
| Cross-origin API calls | No restrictions | CORS may apply | May need server proxy |

## Database Migration

The web version uses `better-sqlite3` instead of `sql.js`:

**Electron (sql.js):**
```typescript
import initSqlJs, { Database } from 'sql.js';
const SQL = await initSqlJs({ wasmBinary });
const db = new SQL(buffer);
```

**Web Server (better-sqlite3):**
```typescript
import Database from 'better-sqlite3';
const db = new Database(dbPath);
```

**Migration notes:**
- Database file format is compatible (both use SQLite)
- Copy `lobsterai.sqlite` from Electron userData to server data directory
- No schema changes required

## Testing Checklist

- [ ] Start new cowork session from browser
- [ ] Send prompt and receive streaming response
- [ ] Handle permission request modal
- [ ] Create/edit/delete sessions
- [ ] Configure skills and MCP servers
- [ ] Create/edit/delete scheduled tasks
- [ ] File upload for image attachments
- [ ] Settings persistence (theme, language, models)
- [ ] Memory management (view, add, edit, delete)
- [ ] Multiple browser tabs open simultaneously
- [ ] WebSocket reconnection after server restart
- [ ] Token authentication (with and without token)

## Troubleshooting

### CORS Errors

If frontend makes requests to different origin, ensure Express has CORS middleware:

```typescript
import cors from 'cors';
app.use(cors({ origin: true }));
```

### WebSocket Connection Failed

1. Check server is running
2. Verify WebSocket URL in client configuration
3. Check firewall/proxy settings

### File Upload Issues

1. Ensure `multipart/form-data` middleware configured
2. Check file size limits
3. Verify temporary directory exists

### Database Locked

- Use `WAL mode` for better concurrency: `db.pragma('journal_mode = WAL')`
- Ensure only one server instance is running
- Check file permissions

## Security Checklist for Production

- [ ] Set strong `WEB_AUTH_TOKEN` environment variable
- [ ] Enable HTTPS (use reverse proxy like nginx)
- [ ] Restrict CORS to specific origins
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Sanitize user inputs
- [ ] Validate file uploads (type, size)
- [ ] Use secure session storage
- [ ] Set appropriate CSP headers
- [ ] Keep dependencies updated
