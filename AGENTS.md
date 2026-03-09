# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Development - starts Vite dev server for web UI
npm run dev

# Build production bundle (web UI + server)
npm run build

# Build web UI only
npm run build:web

# Build server only
npm run build:server

# Start the server
npm start

# Start server in development mode (hot reload)
npm run server:dev

# Lint with ESLint
npm run lint

# Run tests
npm test
```

**Requirements**: Node.js >= 20.

## Architecture Overview

LobsterAI is a web-based local application with a client-server architecture:
1. **Server** - Express.js server running Claude Agent SDK
2. **Web UI** - React frontend served via HTTP
3. **WebSocket** - Real-time bidirectional communication

### Process Model

**Server** (`server/src/index.ts`):
- Express HTTP server with REST API
- WebSocket server for real-time events
- SQLite storage via `sql.js`
- Cowork session runner (`src/main/libs/coworkRunner.ts`) - executes Claude Agent SDK
- File watcher for workspace changes

**Web UI** (`src/renderer/` + `src/web/`):
- React 18 application
- Communicates with server via HTTP API and WebSocket
- Uses `electronShim.ts` as abstraction layer (mimics Electron IPC via HTTP/WS)

### Key Directories

```
server/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── index.ts            # Express server setup
│   └── fileWatcher.ts      # Workspace file watcher
├── routes/
│   ├── cowork.ts           # Cowork session API
│   ├── files.ts            # File browser API
│   ├── skills.ts           # Skills management
│   ├── store.ts            # Key-value store
│   ├── mcp.ts              # MCP server management
│   └── scheduledTasks.ts   # Scheduled tasks API
├── shims/
│   └── electron.ts         # Electron API shims for server
├── public/                 # Built web UI (static files)
└── package.json

src/main/
├── libs/
│   ├── coworkRunner.ts          # Claude Agent SDK execution engine
│   ├── claudeSdk.ts             # SDK loader utilities
│   ├── coworkMemoryExtractor.ts # Extracts memory from conversations
│   ├── coworkMemoryJudge.ts     # Validates memory candidates
│   └── scheduler.ts             # Task scheduler
├── coworkStore.ts          # Cowork session/message CRUD
├── sqliteStore.ts          # SQLite database
└── skillManager.ts         # Skill management

src/renderer/
├── types/                  # TypeScript definitions
├── store/slices/
│   ├── coworkSlice.ts      # Cowork sessions state
│   └── artifactSlice.ts    # Artifacts state
├── services/
│   ├── cowork.ts           # Cowork service (API wrapper)
│   ├── apiClient.ts        # HTTP client
│   ├── webSocketClient.ts  # WebSocket client
│   └── electronShim.ts     # Electron API shim (HTTP/WS)
├── components/
│   ├── cowork/             # Cowork UI components
│   └── artifacts/          # Artifact renderers
└── App.tsx

src/web/
└── main.tsx                # Web entry point

SKILLs/                     # Skill definitions
├── skills.config.json
├── docx/
├── xlsx/
├── pptx/
└── ...
```

### Data Flow

1. **Initialization**: Web UI loads → `initElectronShim()` → connects WebSocket → fetches initial data via HTTP
2. **Cowork Session**: User sends prompt → HTTP POST `/cowork/sessions/start` → `CoworkRunner.startSession()` → Claude Agent SDK execution → WebSocket events → Redux updates
3. **Tool Permissions**: Claude requests tool → WebSocket `permissionRequest` → UI shows modal → user approves → HTTP POST `/cowork/permissions/respond`
4. **File Changes**: File watcher detects change → WebSocket `file:changed` → UI updates file browser
5. **Persistence**: All data in SQLite (`~/.lobsterai/lobsterai.sqlite`)

### API Endpoints

**Cowork:**
- `POST /cowork/sessions/start` - Start new session
- `POST /cowork/sessions/:id/continue` - Continue session
- `POST /cowork/sessions/:id/stop` - Stop session
- `GET /cowork/sessions` - List sessions
- `GET /cowork/sessions/:id` - Get session details
- `DELETE /cowork/sessions/:id` - Delete session
- `POST /cowork/permissions/respond` - Respond to permission request

**Files:**
- `GET /files/list?path=` - List directory
- `GET /files/read?path=` - Read file content
- `GET /files/download?path=` - Download file
- `GET /files/validate?path=` - Validate path
- `GET /workspace/*` - Serve workspace files

**Other:**
- `GET /skills` - List skills
- `GET /store/:key` - Get config value
- `PUT /store/:key` - Set config value
- `GET /app/version` - Get app version
- `GET /app/workspace` - Get workspace path

### WebSocket Events

**Server → Client:**
- `cowork:message` - New message in session
- `cowork:messageUpdate` - Streaming content update
- `cowork:permission` - Permission request
- `cowork:complete` - Session completed
- `cowork:error` - Session error
- `file:changed` - File changed in workspace
- `skills:changed` - Skills list changed

### Key Patterns

- **Electron Shim**: `electronShim.ts` mimics `window.electron` API using HTTP/WebSocket, allowing existing renderer code to work unchanged
- **API Client**: `apiClient.ts` provides typed HTTP methods (get, post, put, delete)
- **WebSocket Client**: `webSocketClient.ts` manages connection, auto-reconnect, and event subscriptions
- **Streaming**: Real-time updates via WebSocket, not SSE
- **Markdown**: `react-markdown` with `remark-gfm`, `remark-math`, `rehype-katex`
- **Theme**: Tailwind dark mode via `dark` class on `<html>`
- **i18n**: Key-value translation in `services/i18n.ts` (Chinese/English)
- **Path alias**: `@` maps to `src/renderer/` in Vite config

### Artifacts System

Rich preview of code outputs:

**Supported Types:**
- `html` - Sandboxed iframe
- `svg` - DOMPurify sanitization
- `mermaid` - Diagrams via Mermaid.js
- `react` - Babel-compiled in isolated iframe
- `code` - Syntax highlighted

### Configuration

- App config: SQLite `kv` table
- Cowork config: `cowork_config` table
- Sessions: `cowork_sessions`, `cowork_messages` tables
- Database: `~/.lobsterai/lobsterai.sqlite`

### TypeScript Configuration

- `tsconfig.json`: Root config
- `server/tsconfig.json`: Server code (CommonJS output to `dist/`)
- `vite.config.web.ts`: Web UI build

### Key Dependencies

- `@anthropic-ai/claude-agent-sdk` - Claude Agent SDK
- `express` - HTTP server
- `ws` - WebSocket server
- `sql.js` - SQLite (WASM)
- `commander` - CLI framework
- `chokidar` - File watching
- `open` - Open browser

## Coding Style & Naming Conventions

- TypeScript, functional React components, Hooks
- Logic in `src/renderer/services/` when not UI-specific
- 2-space indentation, single quotes, semicolons
- `PascalCase` for components, `camelCase` for functions/vars
- Tailwind CSS utility classes preferred

## Testing Guidelines

- Tests use Node.js built-in `node:test` module
- Test files in `tests/` directory
- Validate UI manually by running `npm run dev`
- Key flows to test:
  - Cowork: start session, send prompts, approve permissions
  - File browser: navigate, view files
  - Settings: theme, language switching
- Run `npm run lint` before submitting

## Commit Guidelines

- Use conventional prefixes: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`
- Format: `type: short imperative summary`
- Example: `feat: add file browser component`
