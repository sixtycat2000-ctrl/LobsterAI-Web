# LobsterAI Web API Documentation

This document describes the REST and WebSocket APIs for the LobsterAI web version.

## Base URL

```
http://localhost:3001/api
```

## Authentication

All API requests require an authentication token in the `x-auth-token` header:

```http
x-auth-token: your-secret-token-here
```

In development mode (when `NODE_ENV=development`), authentication can be disabled.

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message description"
}
```

---

## REST API Endpoints

### Store (Key-Value Storage)

#### Get Value

```http
GET /api/store/:key
```

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "theme",
    "value": "dark",
    "updatedAt": 1645123456789
  }
}
```

#### Set Value

```http
PUT /api/store/:key
Content-Type: application/json

{
  "value": "any JSON-serializable value"
}
```

**Response:**
```json
{
  "success": true
}
```

#### Delete Value

```http
DELETE /api/store/:key
```

**Response:**
```json
{
  "success": true
}
```

---

### Cowork Sessions

#### List Sessions

```http
GET /api/cowork/sessions
```

**Query Parameters:**
- `limit` (optional): Maximum number of sessions to return
- `offset` (optional): Number of sessions to skip

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "session-uuid",
      "title": "Session Title",
      "status": "idle",
      "pinned": false,
      "createdAt": 1645123456789,
      "updatedAt": 1645123456789
    }
  ]
}
```

#### Get Session

```http
GET /api/cowork/sessions/:id
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "session-uuid",
    "title": "Session Title",
      "claudeSessionId": "claude-session-uuid",
      "status": "running",
      "pinned": false,
      "cwd": "/working/directory",
      "systemPrompt": "You are a helpful assistant...",
      "executionMode": "local",
      "activeSkillIds": ["skill-1", "skill-2"],
      "createdAt": 1645123456789,
      "updatedAt": 1645123456789,
      "messages": [
        {
          "id": "msg-uuid",
          "type": "user",
          "content": "User message",
          "timestamp": 1645123456789,
          "sequence": 0
        }
      ]
  }
}
```

#### Start Session

```http
POST /api/cowork/sessions
Content-Type: application/json

{
  "prompt": "Create a React component",
  "cwd": "/path/to/working/directory",
  "systemPrompt": "Optional custom system prompt",
  "activeSkillIds": ["skill-id-1", "skill-id-2"],
  "imageAttachments": [
    {
      "name": "screenshot.png",
      "mimeType": "image/png",
      "base64Data": "data:image/png;base64,iVBORw0KG..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "session": { /* full session object */ }
}
```

#### Continue Session

```http
POST /api/cowork/sessions/:id/messages
Content-Type: application/json

{
  "prompt": "Continue with this task",
  "systemPrompt": "Optional updated system prompt",
  "activeSkillIds": ["skill-id-1"],
  "imageAttachments": []
}
```

**Response:**
```json
{
  "success": true
}
```

Streaming updates will be sent via WebSocket.

#### Stop Session

```http
POST /api/cowork/sessions/:id/stop
```

**Response:**
```json
{
  "success": true
}
```

#### Delete Session

```http
DELETE /api/cowork/sessions/:id
```

**Response:**
```json
{
  "success": true
}
```

#### Batch Delete Sessions

```http
DELETE /api/cowork/sessions
Content-Type: application/json

{
  "sessionIds": ["id-1", "id-2", "id-3"]
}
```

**Response:**
```json
{
  "success": true
}
```

#### Pin/Unpin Session

```http
PATCH /api/cowork/sessions/:id/pin
Content-Type: application/json

{
  "pinned": true
}
```

**Response:**
```json
{
  "success": true
}
```

#### Rename Session

```http
PATCH /api/cowork/sessions/:id/rename
Content-Type: application/json

{
  "title": "New Session Title"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### Cowork Configuration

#### Get Configuration

```http
GET /api/cowork/config
```

**Response:**
```json
{
  "success": true,
  "config": {
    "workingDirectory": "/default/path",
    "systemPrompt": "",
    "executionMode": "auto",
    "memoryEnabled": true,
    "memoryImplicitUpdateEnabled": true,
    "memoryLlmJudgeEnabled": false,
    "memoryGuardLevel": "strict",
    "memoryUserMemoriesMaxItems": 12
  }
}
```

#### Update Configuration

```http
PATCH /api/cowork/config
Content-Type: application/json

{
  "workingDirectory": "/new/path",
  "executionMode": "sandbox"
}
```

**Response:**
```json
{
  "success": true,
  "config": { /* updated config */ }
}
```

---

### Cowork Memory

#### List Memory Entries

```http
GET /api/cowork/memory
```

**Query Parameters:**
- `query` (optional): Search query
- `status` (optional): Filter by status (`created`, `stale`, `deleted`, `all`)
- `includeDeleted` (optional): Include deleted entries
- `limit` (optional): Maximum entries to return
- `offset` (optional): Number of entries to skip

**Response:**
```json
{
  "success": true,
  "entries": [
    {
      "id": "mem-uuid",
      "text": "User prefers TypeScript over JavaScript",
      "confidence": 0.9,
      "isExplicit": true,
      "status": "created",
      "createdAt": 1645123456789,
      "updatedAt": 1645123456789,
      "lastUsedAt": 1645123456789
    }
  ]
}
```

#### Create Memory Entry

```http
POST /api/cowork/memory
Content-Type: application/json

{
  "text": "User's preference or fact",
  "confidence": 0.8,
  "isExplicit": false
}
```

**Response:**
```json
{
  "success": true,
  "entry": { /* full memory entry */ }
}
```

#### Update Memory Entry

```http
PATCH /api/cowork/memory/:id
Content-Type: application/json

{
  "text": "Updated text",
  "confidence": 0.95,
  "status": "created"
}
```

**Response:**
```json
{
  "success": true,
  "entry": { /* updated entry */ }
}
```

#### Delete Memory Entry

```http
DELETE /api/cowork/memory/:id
```

**Response:**
```json
{
  "success": true
}
```

#### Get Memory Stats

```http
GET /api/cowork/memory/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 42,
    "created": 38,
    "stale": 3,
    "deleted": 1
  }
}
```

---

### Skills

#### List Skills

```http
GET /api/skills
```

**Response:**
```json
{
  "success": true,
  "skills": [
    {
      "id": "docx",
      "name": "docx",
      "displayName": "Word Document",
      "description": "Generate Word documents",
      "enabled": true,
      "hasConfig": true,
      "config": { /* skill config */ }
    }
  ]
}
```

#### Enable/Disable Skill

```http
PATCH /api/skills/:id/enabled
Content-Type: application/json

{
  "enabled": true
}
```

**Response:**
```json
{
  "success": true
}
```

#### Delete Skill

```http
DELETE /api/skills/:id
```

**Response:**
```json
{
  "success": true
}
```

#### Download Skill

```http
POST /api/skills/download
Content-Type: application/json

{
  "source": "https://example.com/skill.zip"
}
```

**Response:**
```json
{
  "success": true,
  "skill": { /* installed skill */ }
}
```

#### Get Skill Config

```http
GET /api/skills/:id/config
```

**Response:**
```json
{
  "success": true,
  "config": {
    "smtpHost": "smtp.gmail.com",
    "smtpPort": "587"
  }
}
```

#### Set Skill Config

```http
PUT /api/skills/:id/config
Content-Type: application/json

{
  "smtpHost": "smtp.gmail.com",
  "smtpPort": "587"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### MCP Servers

#### List MCP Servers

```http
GET /api/mcp
```

**Response:**
```json
{
  "success": true,
  "servers": [
    {
      "id": "mcp-uuid",
      "name": "filesystem",
      "description": "Local filesystem access",
      "enabled": true,
      "transportType": "stdio",
      "config": { /* MCP config */ },
      "createdAt": 1645123456789,
      "updatedAt": 1645123456789
    }
  ]
}
```

#### Create MCP Server

```http
POST /api/mcp
Content-Type: application/json

{
  "name": "filesystem",
  "description": "Local filesystem access",
  "enabled": true,
  "transportType": "stdio",
  "config": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "server": { /* created server */ }
}
```

#### Update MCP Server

```http
PUT /api/mcp/:id
Content-Type: application/json

{
  "name": "filesystem",
  "description": "Updated description",
  "enabled": true,
  "transportType": "stdio",
  "config": { /* updated config */ }
}
```

**Response:**
```json
{
  "success": true,
  "server": { /* updated server */ }
}
```

#### Delete MCP Server

```http
DELETE /api/mcp/:id
```

**Response:**
```json
{
  "success": true
}
```

#### Enable/Disable MCP Server

```http
PATCH /api/mcp/:id/enabled
Content-Type: application/json

{
  "enabled": false
}
```

**Response:**
```json
{
  "success": true
}
```

#### Fetch Marketplace

```http
GET /api/mcp/marketplace
```

**Response:**
```json
{
  "success": true,
  "servers": [
    {
      "name": "filesystem",
      "description": "Local filesystem access",
      "transportType": "stdio",
      "config": { /* default config */ }
    }
  ]
}
```

---

### Scheduled Tasks

#### List Scheduled Tasks

```http
GET /api/scheduled-tasks
```

**Response:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "task-uuid",
      "name": "Daily Report",
      "description": "Generate daily report",
      "enabled": true,
      "schedule": {
        "type": "cron",
        "expression": "0 9 * * *"
      },
      "prompt": "Generate a daily report",
      "workingDirectory": "/path",
      "systemPrompt": "",
      "executionMode": "auto",
      "expiresAt": null,
      "notifyPlatforms": [],
      "nextRunAt": 1645134567890,
      "lastRunAt": 1645048167890,
      "lastStatus": "success",
      "lastError": null,
      "lastDuration": 45000,
      "runningAt": null,
      "consecutiveErrors": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get Scheduled Task

```http
GET /api/scheduled-tasks/:id
```

**Response:**
```json
{
  "success": true,
  "task": { /* full task object */ }
}
```

#### Create Scheduled Task

```http
POST /api/scheduled-tasks
Content-Type: application/json

{
  "name": "Daily Report",
  "description": "Generate daily report",
  "enabled": true,
  "schedule": {
    "type": "cron",
    "expression": "0 9 * * *"
  },
  "prompt": "Generate a daily report",
  "workingDirectory": "/path",
  "systemPrompt": "",
  "executionMode": "auto",
  "expiresAt": null,
  "notifyPlatforms": []
}
```

**Response:**
```json
{
  "success": true,
  "task": { /* created task */ }
}
```

#### Update Scheduled Task

```http
PUT /api/scheduled-tasks/:id
Content-Type: application/json

{
  "name": "Updated Daily Report",
  "enabled": true,
  "schedule": { /* updated schedule */ }
}
```

**Response:**
```json
{
  "success": true,
  "task": { /* updated task */ }
}
```

#### Delete Scheduled Task

```http
DELETE /api/scheduled-tasks/:id
```

**Response:**
```json
{
  "success": true
}
```

#### Toggle Scheduled Task

```http
PATCH /api/scheduled-tasks/:id/toggle
Content-Type: application/json

{
  "enabled": false
}
```

**Response:**
```json
{
  "success": true,
  "task": { /* updated task */ }
}
```

#### Run Task Manually

```http
POST /api/scheduled-tasks/:id/run
```

**Response:**
```json
{
  "success": true,
  "runId": "run-uuid"
}
```

#### Stop Running Task

```http
POST /api/scheduled-tasks/:id/stop
```

**Response:**
```json
{
  "success": true
}
```

#### List Task Runs

```http
GET /api/scheduled-tasks/:id/runs
```

**Query Parameters:**
- `limit` (optional): Maximum runs to return
- `offset` (optional): Number of runs to skip

**Response:**
```json
{
  "success": true,
  "runs": [
    {
      "id": "run-uuid",
      "taskId": "task-uuid",
      "sessionId": "session-uuid",
      "status": "success",
      "startedAt": "2024-01-01T09:00:00.000Z",
      "finishedAt": "2024-01-01T09:00:45.000Z",
      "duration": 45000,
      "error": null,
      "triggerType": "scheduled"
    }
  ]
}
```

#### List All Task Runs

```http
GET /api/scheduled-tasks/runs
```

**Query Parameters:**
- `limit` (optional): Maximum runs to return
- `offset` (optional): Number of runs to skip

**Response:**
```json
{
  "success": true,
  "runs": [ /* run objects */ ]
}
```

---

### IM Gateways

#### Get IM Configuration

```http
GET /api/im/config
```

**Response:**
```json
{
  "success": true,
  "config": {
    "dingtalk": { /* dingtalk config */ },
    "feishu": { /* feishu config */ },
    "telegram": { /* telegram config */ }
  }
}
```

#### Set IM Configuration

```http
PUT /api/im/config
Content-Type: application/json

{
  "dingtalk": { /* config */ },
    "clientId": "client-id",
    "clientSecret": "client-secret"
  },
  "telegram": {
    "botToken": "bot-token"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

#### Start IM Gateway

```http
POST /api/im/gateway/:platform/start
```

**URL Parameters:**
- `platform`: One of `dingtalk`, `feishu`, `telegram`, `discord`, `nim`, `xiaomifeng`, `wecom`

**Response:**
```json
{
  "success": true
}
```

#### Stop IM Gateway

```http
POST /api/im/gateway/:platform/stop
```

**Response:**
```json
{
  "success": true
}
```

#### Test IM Gateway

```http
POST /api/im/gateway/:platform/test
Content-Type: application/json

{
  "configOverride": { /* optional test config */ }
}
```

**Response:**
```json
{
  "success": true,
  "result": { /* test result */ }
}
```

#### Get IM Status

```http
GET /api/im/status
```

**Response:**
```json
{
  "success": true,
  "status": {
    "dingtalk": {
      "connected": true,
      "lastError": null
    },
    "telegram": {
      "connected": false,
      "lastError": "Connection failed"
    }
  }
}
```

---

### API Configuration

#### Get API Configuration

```http
GET /api/config/api
```

**Response:**
```json
{
  "success": true,
  "config": {
    "apiKey": "sk-ant-...",
    "baseUrl": "https://api.anthropic.com",
    "model": "claude-3-5-sonnet-20241022",
    "apiType": "anthropic"
  }
}
```

#### Save API Configuration

```http
POST /api/config/api
Content-Type: application/json

{
  "apiKey": "sk-ant-...",
  "baseUrl": "https://api.anthropic.com",
  "model": "claude-3-5-sonnet-20241022",
  "apiType": "anthropic"
}
```

**Response:**
```json
{
  "success": true
}
```

#### Check API Configuration

```http
POST /api/config/api/check
Content-Type: application/json

{
  "probeModel": true
}
```

**Response:**
```json
{
  "success": true,
  "hasConfig": true,
  "config": { /* current config */ },
  "modelReady": true
}
```

---

### App Info

#### Get App Version

```http
GET /api/app/version
```

**Response:**
```json
{
  "success": true,
  "version": "0.2.2"
}
```

#### Get System Locale

```http
GET /api/app/locale
```

**Response:**
```json
{
  "success": true,
  "locale": "zh-CN"
}
```

---

## WebSocket API

### Connection

Connect to the WebSocket server:

```
ws://localhost:3001/ws
```

Include authentication token in the connection URL:

```
ws://localhost:3001/ws?token=your-auth-token
```

### Client → Server Events

#### Respond to Permission

```json
{
  "type": "cowork:respondPermission",
  "data": {
    "requestId": "req-uuid",
    "result": {
      "action": "yes",
      "selectedChoiceIndex": 0
    }
  }
}
```

#### Cancel Stream

```json
{
  "type": "cowork:cancelStream",
  "data": {
    "sessionId": "session-uuid"
  }
}
```

### Server → Client Events

#### New Message

```json
{
  "type": "cowork:message",
  "data": {
    "sessionId": "session-uuid",
    "message": {
      "id": "msg-uuid",
      "type": "assistant",
      "content": "Response content",
      "timestamp": 1645123456789,
      "sequence": 1
    }
  }
}
```

#### Message Update (Streaming)

```json
{
  "type": "cowork:messageUpdate",
  "data": {
    "sessionId": "session-uuid",
    "messageId": "msg-uuid",
    "content": "Partial streaming content..."
  }
}
```

#### Permission Request

```json
{
  "type": "cowork:permission",
  "data": {
    "sessionId": "session-uuid",
    "request": {
      "requestId": "req-uuid",
      "toolName": "Bash",
      "toolUseId": "tooluse-uuid",
      "toolInput": {
        "command": "ls -la"
      }
    }
  }
}
```

#### Session Complete

```json
{
  "type": "cowork:complete",
  "data": {
    "sessionId": "session-uuid",
    "claudeSessionId": "claude-session-uuid"
  }
}
```

#### Session Error

```json
{
  "type": "cowork:error",
  "data": {
    "sessionId": "session-uuid",
    "error": "Error message"
  }
}
```

#### Skills Changed

```json
{
  "type": "skills:changed",
  "data": null
}
```

#### IM Gateway Status Change

```json
{
  "type": "im:status:change",
  "data": {
    "dingtalk": {
      "connected": true,
      "lastError": null
    }
  }
}
```

#### IM Message Received

```json
{
  "type": "im:message:received",
  "data": {
    "platform": "dingtalk",
    "message": { /* IM message */ }
  }
}
```

#### Scheduled Task Status Update

```json
{
  "type": "scheduledTask:statusUpdate",
  "data": {
    "taskId": "task-uuid",
    "status": "running",
    "runningAt": 1645123456789
  }
}
```

#### Scheduled Task Run Update

```json
{
  "type": "scheduledTask:runUpdate",
  "data": {
    "runId": "run-uuid",
    "status": "success",
    "finishedAt": "2024-01-01T09:00:45.000Z"
  }
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

### Common Error Responses

**Unauthorized:**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Not Found:**
```json
{
  "success": false,
  "error": "Session not found"
}
```

**Validation Error:**
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": {
    "prompt": "Prompt is required"
  }
}
```
