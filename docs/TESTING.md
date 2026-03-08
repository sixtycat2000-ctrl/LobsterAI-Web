# Integration Testing Guide for LobsterAI Web

This document provides integration test cases and procedures for validating the web version of LobsterAI.

## Test Environment Setup

### Prerequisites

1. **Backend server running**:
   ```bash
   npm run server:dev
   ```
   Verify at http://localhost:3001/api/health

2. **Frontend dev server running**:
   ```bash
   npm run web:dev
   ```
   Open at http://localhost:5175

3. **Database initialized**:
   - SQLite database at `data/lobsterai.sqlite`
   - Tables created and migrations applied

4. **API configured**:
   - Valid API key set in Settings
   - Model selected and ready

## Test Flows

### 1. Start Cowork Session from Browser

**Purpose**: Verify user can create a new AI coding session

**Steps**:
1. Navigate to http://localhost:5175
2. Click "New Chat" button
3. Enter a prompt in the input field: "Create a simple React counter component"
4. Click Send or press Ctrl+Enter

**Expected Results**:
- [ ] New session appears in sidebar
- [ ] Session has auto-generated title
- [ ] User message is displayed
- [ ] Session status changes to "running"
- [ ] Streaming response begins

**API Calls**:
- `POST /api/cowork/sessions`
- WebSocket `cowork:message` events

**Failure Modes**:
- No API key configured → Show settings modal
- Server unreachable → Show error toast
- Invalid response → Display error in chat

---

### 2. Send Prompt and Receive Streaming Response

**Purpose**: Verify real-time streaming of AI responses via WebSocket

**Steps**:
1. Start a new session (or use existing)
2. Send prompt: "Write a function to reverse a string in JavaScript"
3. Observe the response in real-time

**Expected Results**:
- [ ] Response appears character-by-character or chunk-by-chunk
- [ ] Streaming indicator is shown during generation
- [ ] Code blocks are properly formatted
- [ ] Markdown rendering is correct
- [ ] Status changes to "completed" when done

**WebSocket Events**:
- `cowork:message` - Initial message object
- `cowork:messageUpdate` - Content deltas
- `cowork:complete` - Session finished

**Validation**:
```javascript
// In browser console, observe WebSocket messages
// Look for events: cowork:message, cowork:messageUpdate, cowork:complete
```

---

### 3. Handle Permission Request Modal

**Purpose**: Verify tool use permissions are handled correctly

**Steps**:
1. Start a session with a tool-using prompt:
   ```
   List the files in the current directory
   ```
2. Wait for permission modal to appear
3. Verify modal shows:
   - Tool name (e.g., "Bash")
   - Tool input (command to be executed)
4. Click "Approve" button
5. Verify tool output appears in response

**Expected Results**:
- [ ] Permission modal appears when Claude requests tool use
- [ ] Tool name and input are clearly displayed
- [ ] Approve/Deny buttons are functional
- [ ] After approval, tool output is shown
- [ ] Response continues after tool execution

**WebSocket Events**:
- `cowork:permission` - Permission request received
- Client sends `cowork:respondPermission`

**Test Cases**:
- Approve permission → Tool executes, shows output
- Deny permission → Tool skipped, Claude explains
- Multiple permissions → Queue and show sequentially

---

### 4. Create/Edit/Delete Sessions

**Purpose**: Verify session CRUD operations

#### 4.1 Create Session

**Steps**:
1. Click "New Chat" button
2. Send any prompt

**Expected Results**:
- [ ] Session created with unique ID
- [ ] Session appears in sidebar list
- [ ] Session is marked as active

**API Calls**:
- `POST /api/cowork/sessions`
- `GET /api/cowork/sessions` (refresh list)

#### 4.2 Edit Session Title

**Steps**:
1. Hover over session in sidebar
2. Click edit (pencil) icon
3. Enter new title: "My Coding Session"
4. Press Enter or click away

**Expected Results**:
- [ ] Title updates in sidebar
- [ ] Title persists after page refresh
- [ ] Session details reflect new title

**API Calls**:
- `PATCH /api/cowork/sessions/:id/rename`

#### 4.3 Pin Session

**Steps**:
1. Hover over session
2. Click pin icon
3. Refresh page

**Expected Results**:
- [ ] Pinned sessions appear at top of list
- [ ] Pin state persists after refresh
- [ ] Unpin works correctly

**API Calls**:
- `PATCH /api/cowork/sessions/:id/pin`

#### 4.4 Delete Single Session

**Steps**:
1. Hover over session
2. Click delete (trash) icon
3. Confirm deletion

**Expected Results**:
- [ ] Session removed from sidebar
- [ ] If active session, view clears
- [ ] Database no longer contains session

**API Calls**:
- `DELETE /api/cowork/sessions/:id`

#### 4.5 Batch Delete Sessions

**Steps**:
1. Select multiple sessions (Shift+click)
2. Click bulk delete
3. Confirm

**Expected Results**:
- [ ] All selected sessions removed
- [ ] Confirmation dialog shows correct count
- [ ] Active session handling correct

**API Calls**:
- `DELETE /api/cowork/sessions` with body `{sessionIds: [...]}`

---

### 5. Configure Skills and MCP Servers

#### 5.1 Skills Configuration

**Steps**:
1. Navigate to Skills view (sidebar icon)
2. Observe list of installed skills
3. Toggle a skill enable/disable
4. Click skill settings icon
5. Modify skill configuration
6. Save changes

**Expected Results**:
- [ ] All installed skills listed
- [ ] Enable/disable toggle works
- [ ] Skill config modal opens
- [ ] Configuration saves successfully
- [ ] Skill becomes available in sessions

**API Calls**:
- `GET /api/skills`
- `PATCH /api/skills/:id/enabled`
- `GET /api/skills/:id/config`
- `PUT /api/skills/:id/config`

**Test Cases**:
- Enable docx skill → Available in sessions
- Configure email skill → Settings persist
- Download new skill → Installs successfully

#### 5.2 MCP Server Configuration

**Steps**:
1. Navigate to MCP view
2. Click "Add Server" button
3. Fill in server details:
   - Name: "filesystem"
   - Transport: "stdio"
   - Command: `npx`
   - Args: `-y @modelcontextprotocol/server-filesystem /allowed/path`
4. Save server
5. Enable server

**Expected Results**:
- [ ] Server appears in list
- [ ] Configuration is saved
- [ ] Server can be enabled/disabled
- [ ] Server status shows connected/working
- [ ] MCP tools available in sessions

**API Calls**:
- `GET /api/mcp`
- `POST /api/mcp`
- `PUT /api/mcp/:id`
- `PATCH /api/mcp/:id/enabled`

**Test Cases**:
- Add filesystem server → File tools available
- Add Brave search server → Search tools available
- Delete server → Removed from list

---

### 6. Image Attachments

**Purpose**: Verify image upload and handling

**Steps**:
1. Click attachment icon in chat input
2. Select an image file
3. Send prompt: "Describe this image"
4. Verify image is displayed in chat

**Expected Results**:
- [ ] File picker opens
- [ ] Image preview appears in input
- [ ] Image sent with message
- [ ] AI recognizes and describes image
- [ ] Image displays in message history

**API Calls**:
- `POST /api/cowork/sessions` with `imageAttachments`

**Validation**:
- Image size < 5MB works
- PNG, JPEG formats supported
- Base64 encoding correct

---

### 7. Settings Persistence

**Purpose**: Verify settings are saved and restored

**Test Cases**:

#### 7.1 Theme Switching

1. Open Settings → General
2. Switch theme to Light
3. Close settings
4. Refresh page
5. Verify theme persists

**Expected**: Light theme active after refresh

#### 7.2 Language Switching

1. Open Settings → General
2. Switch language to English
3. Close and refresh
4. Verify UI is in English

**Expected**: Language persists

#### 7.3 API Configuration

1. Open Settings → Model
2. Change API key
3. Save settings
4. Refresh page
5. Verify API key is saved

**Expected**: API key persists, stored securely in server database

#### 7.4 Cowork Configuration

1. Open Settings → Cowork
2. Change working directory (server path)
3. Toggle memory features
4. Save and refresh
5. Verify all settings persist

**Expected**: All cowork settings saved

---

### 8. Memory System

**Purpose**: Verify memory extraction and management

**Steps**:
1. Send a message with personal info: "I prefer TypeScript over JavaScript"
2. Navigate to Settings → Memory
3. Verify memory was extracted
4. Edit the memory entry
5. Start a new session
6. Send: "What do I prefer for web development?"

**Expected Results**:
- [ ] Memory automatically extracted
- [ ] Memory appears in Settings → Memory
- [ ] Can edit memory text and confidence
- [ ] New session references the memory
- [ ] AI remembers the preference

**API Calls**:
- `GET /api/cowork/memory`
- `POST /api/cowork/memory`
- `PATCH /api/cowork/memory/:id`

---

### 9. Scheduled Tasks

**Purpose**: Verify task scheduling and execution

**Steps**:
1. Navigate to Scheduled Tasks view
2. Click "New Task"
3. Configure:
   - Name: "Daily Summary"
   - Schedule: Cron "0 9 * * *" (daily 9am)
   - Prompt: "Generate a summary of yesterday's work"
4. Enable task
5. Click "Run Now" to test
6. Verify task execution creates a session

**Expected Results**:
- [ ] Task created and listed
- [ ] Cron schedule parses correctly
- [ ] "Run Now" creates session
- [ ] Task runs on schedule (check next day)
- [ ] Run history shows executions

**API Calls**:
- `POST /api/scheduled-tasks`
- `POST /api/scheduled-tasks/:id/run`
- `GET /api/scheduled-tasks/:id/runs`

---

### 10. WebSocket Reconnection

**Purpose**: Verify graceful handling of server disconnection

**Steps**:
1. Start a session with streaming response
2. While streaming, restart the backend server:
   ```bash
   # Kill and restart server
   pkill -f "node.*server"
   npm run server:dev
   ```
3. Observe client behavior

**Expected Results**:
- [ ] Client detects disconnection
- [ ] Reconnection indicator appears
- [ ] Client attempts reconnection
- [ ] When server back, connection restores
- [ ] Can continue using the app

**Validation**:
```javascript
// In browser console, observe WebSocket state
// Should see: connecting → connected → disconnected → reconnecting → connected
```

---

### 11. Error Handling

**Test Cases**:

#### 11.1 API Error

1. Configure invalid API key
2. Try to start a session

**Expected**: Error message displayed, not a crash

#### 11.2 Network Error

1. Start backend with different port
2. Try to use app (wrong port configured)

**Expected**: Network error message, connection failed indicator

#### 11.3 Server Error (500)

1. Trigger a server error (e.g., invalid path)

**Expected**: User-friendly error message

---

### 12. File Operations

**Purpose**: Verify file operation adaptors work correctly

**Test Cases**:

#### 12.1 File Selection

1. Click attachment in chat
2. Select a file
3. Verify file is attached

**Expected**: File name displayed, can be sent

#### 12.2 Directory Selection

1. In cowork config, click "Choose Directory"
2. Select a directory
3. Verify files are accessible

**Expected**: Directory name shown, files listed

#### 12.3 Log Export

1. Open Settings → About
2. Click "Export Logs"
3. Verify zip file downloads

**Expected**: Browser downloads `lobsterai-logs-{timestamp}.zip`

---

### 13. IM Gateway (Optional)

**Purpose**: Verify IM integration if configured

**Steps**:
1. Open Settings → IM
2. Configure gateway (e.g., DingTalk)
3. Enable gateway
4. Send test message from IM platform
5. Verify cowork session is created

**Expected Results**:
- [ ] Gateway connects successfully
- [ ] Status shows "connected"
- [ ] Incoming IM message creates session
- [ ] Response sent back to IM

---

## Automated Testing Commands

### API Testing with curl

```bash
# Health check
curl http://localhost:3001/api/health

# List sessions
curl -H "x-auth-token: token" http://localhost:3001/api/cowork/sessions

# Start session
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-auth-token: token" \
  -d '{"prompt":"Hello"}' \
  http://localhost:3001/api/cowork/sessions

# Get config
curl -H "x-auth-token: token" http://localhost:3001/api/cowork/config
```

### WebSocket Testing

```javascript
// In browser console
const ws = new WebSocket('ws://localhost:3001/ws?token=token');

ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Message:', JSON.parse(e.data));
ws.onerror = (e) => console.error('Error:', e);
```

---

## Test Results Template

| Test Case | Status | Notes | Date |
|-----------|--------|-------|------|
| Start session | ☐ Pass / ☐ Fail | | |
| Streaming response | ☐ Pass / ☐ Fail | | |
| Permission modal | ☐ Pass / ☐ Fail | | |
| Session CRUD | ☐ Pass / ☐ Fail | | |
| Skills config | ☐ Pass / ☐ Fail | | |
| MCP config | ☐ Pass / ☐ Fail | | |
| Image attachments | ☐ Pass / ☐ Fail | | |
| Settings persistence | ☐ Pass / ☐ Fail | | |
| Memory system | ☐ Pass / ☐ Fail | | |
| Scheduled tasks | ☐ Pass / ☐ Fail | | |
| WebSocket reconnect | ☐ Pass / ☐ Fail | | |
| Error handling | ☐ Pass / ☐ Fail | | |
| File operations | ☐ Pass / ☐ Fail | | |
| IM gateway | ☐ Pass / ☐ Fail | | |

---

## Continuous Testing

For ongoing development, run these tests after each significant change:

1. **Smoke tests**: Always run (start session, send message)
2. **Feature tests**: Run for changed features
3. **Regression tests**: Run full suite before releases

### Pre-Release Checklist

- [ ] All integration tests pass
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Known limitations documented
- [ ] Security review completed
- [ ] Performance acceptable
- [ ] Browser compatibility verified (Chrome, Firefox, Safari, Edge)
