# LobsterAI Web Version

This is the web version of LobsterAI, an AI-assisted coding assistant powered by Claude Agent SDK.

## Quick Start

### Prerequisites

- Node.js >= 24 < 25
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development Mode

Run both frontend and backend in development mode:

```bash
# Start both servers (runs on :3001 backend, :5175 frontend)
npm run dev:web
```

Or run separately:

```bash
# Terminal 1: Start backend server (port 3001)
npm run server:dev

# Terminal 2: Start frontend dev server (port 5175)
npm run web:dev
```

Open [http://localhost:5175](http://localhost:5175) in your browser.

### Production Build

```bash
# Build frontend
npm run web:build

# Build and start server
npm run server:build
npm run server:start
```

The app will be available at [http://localhost:3001](http://localhost:3001).

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Authentication
WEB_AUTH_TOKEN=your-secret-token-here

# Server
WEB_PORT=3001
WEB_HOST=localhost

# Environment
NODE_ENV=development
```

### Authentication

The web version uses token-based authentication:

1. **Development mode** (`NODE_ENV=development`): No authentication required
2. **Production mode**: Set `WEB_AUTH_TOKEN` and include it in requests:
   - HTTP requests: `x-auth-token: your-secret-token-here`
   - WebSocket: `ws://localhost:3001/ws?token=your-secret-token-here`

The web app automatically handles authentication using the token from:
1. `localStorage` key `lobsterai_auth_token`
2. `VITE_WEB_AUTH_TOKEN` environment variable (fallback)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (React)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Redux Store  │  API Client  │  WebSocket  │  UI     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                   Node.js/Express Server                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ CoworkRunner│  │  SQLite DB   │  │  REST/WebSocket    │ │
│  │  (Agent SDK)│  │  (better-sqlite3)│     APIs          │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Supported Features

| Feature | Status | Notes |
|---------|--------|-------|
| Cowork sessions | ✅ Full support | Start, continue, stop sessions |
| Streaming responses | ✅ Full support | Real-time via WebSocket |
| Permission handling | ✅ Full support | Modal approval flow |
| Skills | ✅ Full support | Install, configure, enable/disable |
| MCP servers | ✅ Full support | Full management UI |
| Scheduled tasks | ✅ Full support | Cron-based scheduling |
| IM gateways | ✅ Full support | DingTalk, Feishu, Telegram, etc. |
| Memory system | ✅ Full support | Auto-extraction and management |
| File uploads | ✅ Supported | Via browser file picker |
| Directory selection | ⚠️ Limited | `webkitdirectory` for files only |
| Image attachments | ✅ Supported | Base64 encoding |
| Settings | ✅ Full support | Persisted in server-side SQLite |
| Theme switching | ✅ Full support | Light/Dark mode |
| i18n | ✅ Full support | Chinese/English |

### Known Limitations

| Feature | Electron | Web | Notes |
|---------|----------|-----|-------|
| File system access | Full | Limited | Browser sandbox restrictions |
| Working directory | Full path | File list or server path | Security limitation |
| Custom window controls | Yes | No | Uses browser window |
| Auto-update | Built-in | Manual refresh | Requires page reload |
| Auto-launch | Yes | No | Browser limitation |
| System tray | Yes | No | Not supported in web |
| Global hotkeys | Yes | No (when unfocused) | Browser limitation |
| Native dialogs | OS-native | HTML file input | Different UX |
| Show in folder | Yes | No | Not supported in web |
| Shell operations | Full | Limited | Some replaced with downloads |

## File Operations

### Directory Selection

The web version uses `webkitdirectory` for directory selection:

```typescript
const { selectDirectory } = useFileOperations();
const result = await selectDirectory();
// result.files contains all files in the directory
// result.name is the directory name
```

**Note**: The browser only provides file contents, not the directory path. For server-side file operations, use manual path input (validated by server).

### File Selection

```typescript
const { selectFile } = useFileOperations();
const file = await selectFile({ accept: 'image/*' });
```

### File Downloads

```typescript
// Download generated content
const { downloadFile } = useFileOperations();
downloadFile(base64Data, 'output.png', 'image/png');

// Download server file
const { downloadServerFile } = useFileOperations();
downloadServerFile('/path/to/file.pdf');
```

## Database

The web version uses SQLite with `better-sqlite3`:

- Location: Server data directory
- File: `lobsterai.sqlite`
- Tables: Same as Electron version

**Migration from Electron**: Copy `lobsterai.sqlite` from Electron userData to server data directory.

## Security Considerations

### For Local Use

- Default binding to `localhost` only
- Simple token authentication
- No CORS restrictions on localhost

### For Network Deployment

1. **Set strong authentication token**:
   ```bash
   WEB_AUTH_TOKEN=$(openssl rand -hex 32)
   ```

2. **Enable HTTPS** (use reverse proxy):
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
       }
   }
   ```

3. **Configure CORS**:
   ```typescript
   // In server configuration
   cors({
     origin: 'https://your-frontend-domain.com',
     credentials: true
   })
   ```

4. **Add rate limiting**:
   ```typescript
   import rateLimit from 'express-rate-limit';
   app.use(rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   }));
   ```

## Development

### Project Structure

```
lobsterai/
├── server/                    # Backend server code
│   ├── index.ts              # Server entry point
│   ├── routes/               # Express route handlers
│   ├── websocket/            # WebSocket handlers
│   └── services/             # Server-side services
├── src/renderer/             # Frontend React code
│   ├── components/           # UI components
│   ├── services/             # API clients
│   ├── store/                # Redux state
│   └── utils/                # Utilities
├── docs/                     # Documentation
│   ├── WEB-MIGRATION.md      # Migration guide
│   ├── API.md                # API reference
│   └── FILE-OPERATIONS.md    # File operations guide
└── package.json
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `dev:web` | Start both frontend and backend in dev mode |
| `server:dev` | Start backend with hot reload |
| `server:start` | Start production server |
| `server:build` | Build backend TypeScript |
| `web:dev` | Start frontend dev server (Vite) |
| `web:build` | Build frontend for production |
| `web:preview` | Preview production build |

### Building for Production

1. **Build backend**:
   ```bash
   npm run server:build
   ```

2. **Build frontend**:
   ```bash
   npm run web:build
   ```

3. **Start server**:
   ```bash
   npm run server:start
   ```

The server serves both the API and the static frontend files.

## Testing

### Manual Testing Checklist

- [ ] Start new cowork session
- [ ] Send prompt and receive streaming response
- [ ] Handle permission request modal
- [ ] Create/edit/delete sessions
- [ ] Configure skills
- [ ] Configure MCP servers
- [ ] Create/edit/delete scheduled tasks
- [ ] Upload image attachment
- [ ] Change theme (light/dark)
- [ ] Change language (Chinese/English)
- [ ] Export logs as zip
- [ ] Test WebSocket reconnection

### API Testing

Use curl or any HTTP client:

```bash
# Get sessions (with auth)
curl -H "x-auth-token: your-token" http://localhost:3001/api/cowork/sessions

# Start a session
curl -X POST -H "Content-Type: application/json" \
  -H "x-auth-token: your-token" \
  -d '{"prompt":"Hello, Claude!"}' \
  http://localhost:3001/api/cowork/sessions
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001
# Kill the process
kill -9 <PID>
```

### WebSocket Connection Failed

1. Check server is running
2. Verify WebSocket URL in browser console
3. Check authentication token is set

### File Upload Issues

1. Check file size limits in server config
2. Verify `multipart/form-data` middleware is configured
3. Check browser console for CORS errors

### Database Locked

```bash
# Only one server instance should be running
pkill -f "node.*server"
```

## Documentation

- [WEB-MIGRATION.md](./docs/WEB-MIGRATION.md) - Complete migration guide
- [API.md](./docs/API.md) - REST/WebSocket API reference
- [FILE-OPERATIONS.md](./docs/FILE-OPERATIONS.md) - File operations guide

## Contributing

When contributing to the web version:

1. Ensure all file operations use `WebFileOperations` utility
2. Use API client for all backend communication
3. Test in both development and production modes
4. Update documentation for new features
5. Follow existing code style and patterns

## License

Same as the main LobsterAI project.

## Support

For issues specific to the web version, please create a GitHub issue with:
- Browser and version
- Steps to reproduce
- Console errors
- Server logs (if applicable)
