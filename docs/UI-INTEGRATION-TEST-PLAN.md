# LobsterAI Web UI Integration Test Plan

Created: 2026-03-10 | Last Updated: 2026-03-10

---

## Overview

This document defines the UI integration test plan for LobsterAI Web, covering all interactive UI components and user workflows. Tests should verify both happy paths and edge cases.

---

## Test Environment

| Item | Value |
|------|-------|
| Server URL | http://localhost:3001 |
| Web UI | http://localhost:5176 (dev) / http://localhost:3001 (prod) |
| Default Workspace | User home directory |
| User Data | `~/.lobsterai/web` |
| Node Version | >= 20 |

---

## Test Modules

### 1. Navigation & Sidebar

**Component:** `src/renderer/components/Sidebar.tsx`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| NAV-001 | Sidebar collapse/expand | Click sidebar toggle button | Sidebar collapses to width 0, toggle icon changes |
| NAV-002 | New Chat button | Click "New Chat" button | Creates new cowork session, switches to cowork view |
| NAV-003 | Search button | Click "Search" button | Opens CoworkSearchModal |
| NAV-004 | Scheduled Tasks nav | Click "Scheduled Tasks" button | Switches to ScheduledTasksView |
| NAV-005 | Skills nav | Click "Skills" button | Switches to SkillsView |
| NAV-006 | MCP Servers nav | Click "MCP Servers" button | Switches to McpView |
| NAV-007 | Settings button | Click "Settings" button | Opens Settings panel |
| NAV-008 | Active view indicator | Navigate between views | Current view button shows accent color highlight |
| NAV-009 | Cowork history list | View session list in sidebar | Shows pinned sessions first, then by date |
| NAV-010 | Session selection | Click on a session in history | Loads and displays selected session |

---

### 2. Task Search (Cowork Sessions)

**Component:** `src/renderer/components/cowork/CoworkSearchModal.tsx`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SEARCH-001 | Open search modal | Click Search button or use shortcut | Modal opens with focus on search input |
| SEARCH-002 | Search by title | Type query matching session title | Filters sessions to matching results |
| SEARCH-003 | Search no results | Type query with no matches | Shows "No results" message |
| SEARCH-004 | Clear search | Delete all text | Shows all sessions |
| SEARCH-005 | Select session from results | Click a session in results | Loads session, closes modal |
| SEARCH-006 | Delete session from results | Click delete on session in search | Session is deleted |
| SEARCH-007 | Pin session from results | Click pin on session | Session pin status toggles |
| SEARCH-008 | Rename session from results | Double-click title, edit, press Enter | Session title is updated |
| SEARCH-009 | Close modal - X button | Click X button | Modal closes |
| SEARCH-010 | Close modal - backdrop | Click outside modal | Modal closes |
| SEARCH-011 | Close modal - Escape | Press Escape key | Modal closes |

---

### 3. Scheduled Tasks CRUD

**Components:** `src/renderer/components/scheduledTasks/`

#### 3.1 Task List View

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TASK-LIST-001 | Display task list | Navigate to Scheduled Tasks | Shows all tasks with columns: Title, Schedule, Status |
| TASK-LIST-002 | Empty state | View when no tasks exist | Shows empty state with icon and hint |
| TASK-LIST-003 | Task toggle enable/disable | Click toggle switch on task | Task enabled status toggles, schedule updated |
| TASK-LIST-004 | Task toggle - past date warning | Enable a one-time task with past date | Shows warning toast |
| TASK-LIST-005 | Task toggle - expired warning | Enable an expired task | Shows expired warning toast |
| TASK-LIST-006 | View task detail | Click on task row | Shows TaskDetail view |
| TASK-LIST-007 | Open more menu | Click ellipsis button | Shows dropdown with Run, Edit, Delete |
| TASK-LIST-008 | Run task now | Click "Run" from menu | Task starts running, shows spinner |
| TASK-LIST-009 | Edit from menu | Click "Edit" from menu | Opens TaskForm in edit mode |
| TASK-LIST-010 | Delete from menu | Click "Delete" from menu | Opens delete confirmation modal |
| TASK-LIST-011 | Running indicator | View task that is running | Shows spinning indicator |
| TASK-LIST-012 | Back button navigation | In detail/edit view, click back | Returns to task list |

#### 3.2 Create Task

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TASK-CREATE-001 | Open create form | Click "New Task" button | Shows TaskForm in create mode |
| TASK-CREATE-002 | Validation - empty name | Leave name empty, submit | Shows "Name required" error |
| TASK-CREATE-003 | Validation - empty prompt | Leave prompt empty, submit | Shows "Prompt required" error |
| TASK-CREATE-004 | Validation - empty working directory | No directory set, submit | Shows error if no default |
| TASK-CREATE-005 | Validation - past datetime | Select past date for one-time task | Shows "Must be future date" error |
| TASK-CREATE-006 | Schedule type - once | Select "Once", pick date and time | Creates task with datetime schedule |
| TASK-CREATE-007 | Schedule type - daily | Select "Daily", pick time | Creates task with daily cron |
| TASK-CREATE-008 | Schedule type - weekly | Select "Weekly", pick day and time | Creates task with weekly cron |
| TASK-CREATE-009 | Schedule type - monthly | Select "Monthly", pick day and time | Creates task with monthly cron |
| TASK-CREATE-010 | Browse directory | Click "Browse" button | Opens directory picker dialog |
| TASK-CREATE-011 | Set expiry date | Pick expiry date | Task will expire on that date |
| TASK-CREATE-012 | Clear expiry date | Click clear button | Expiry date is cleared |
| TASK-CREATE-013 | Notification platforms | Open dropdown, select platforms | Platforms are selected (only configured ones) |
| TASK-CREATE-014 | Cancel create | Click "Cancel" button | Returns to task list without saving |
| TASK-CREATE-015 | Successful create | Fill all required fields, submit | Task created, returns to list |

#### 3.3 Edit Task

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TASK-EDIT-001 | Open edit from detail | In detail view, click edit button | Opens TaskForm with pre-filled data |
| TASK-EDIT-002 | Open edit from menu | Click "Edit" from task menu | Opens TaskForm with pre-filled data |
| TASK-EDIT-003 | Modify and save | Change fields, click save | Task updated, returns to detail view |
| TASK-EDIT-004 | Cancel edit | Click "Cancel" | Returns to detail view without changes |

#### 3.4 Delete Task

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TASK-DELETE-001 | Request delete | Click delete button | Opens DeleteConfirmModal |
| TASK-DELETE-002 | Confirm delete | Click confirm button | Task deleted, returns to list |
| TASK-DELETE-003 | Cancel delete | Click cancel button | Modal closes, task not deleted |
| TASK-DELETE-004 | Delete from detail view | Delete while viewing detail | Task deleted, returns to list |

#### 3.5 Task Detail View

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TASK-DETAIL-001 | View all sections | Open task detail | Shows Prompt, Configuration, Status, Run History |
| TASK-DETAIL-002 | Edit button | Click pencil icon | Opens TaskForm in edit mode |
| TASK-DETAIL-003 | Run now button | Click play icon | Task starts running immediately |
| TASK-DETAIL-004 | Delete button | Click trash icon | Opens delete confirmation |
| TASK-DETAIL-005 | Run now disabled | Task already running | Button is disabled |
| TASK-DETAIL-006 | View run history | Scroll to history section | Shows list of past runs |
| TASK-DETAIL-007 | View session from run | Click "View Session" link | Navigates to cowork session |
| TASK-DETAIL-008 | Load more runs | Click "Load More" | Loads additional run history |

---

### 4. Task History

**Components:** `AllRunsHistory.tsx`, `TaskRunHistory.tsx`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| HISTORY-001 | View all runs tab | Click "History" tab | Shows AllRunsHistory with all task runs |
| HISTORY-002 | Empty history state | View with no runs | Shows empty state message |
| HISTORY-003 | Run status display | View runs list | Shows success (green), error (red), running (blue) |
| HISTORY-004 | Running indicator | View running task | Shows spinning animation |
| HISTORY-005 | View session | Click on run with session | Navigates to cowork session |
| HISTORY-006 | Load more | Click "Load More" button | Loads next 50 runs |
| HISTORY-007 | Duration display | View completed runs | Shows duration in ms, s, or m |
| HISTORY-008 | Task detail history | Open task detail | Shows task-specific run history |
| HISTORY-009 | Error message display | View failed run | Shows truncated error message |
| HISTORY-010 | Trigger type | View runs | Shows "Manual" or "Scheduled" label |

---

### 5. Skills Management

**Components:** `src/renderer/components/skills/`

#### 5.1 Installed Skills

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SKILL-INST-001 | View installed skills | Navigate to Skills | Shows grid of installed skills |
| SKILL-INST-002 | Empty state | No skills installed | Shows "No skills available" message |
| SKILL-INST-003 | Search skills | Type in search box | Filters skills by name/description |
| SKILL-INST-004 | Toggle skill enabled | Click toggle switch | Skill enabled status changes |
| SKILL-INST-005 | View skill detail | Click on skill card | Opens skill detail modal |
| SKILL-INST-006 | Delete skill | Click trash icon in card | Opens delete confirmation |
| SKILL-INST-007 | Delete built-in skill | Try to delete built-in | Shows error, cannot delete |
| SKILL-INST-008 | Skill badge display | View skill cards | Shows Official, Version, Updated date |

#### 5.2 Add Skills

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SKILL-ADD-001 | Open add menu | Click "Add Skill" button | Shows dropdown with options |
| SKILL-ADD-002 | Upload ZIP | Click "Upload ZIP" option | Opens file picker for .zip |
| SKILL-ADD-003 | Upload folder | Click "Upload Folder" option | Opens directory picker |
| SKILL-ADD-004 | GitHub import | Click "Import from GitHub" | Opens GitHub URL input modal |
| SKILL-ADD-005 | GitHub import - valid URL | Enter valid GitHub URL, submit | Skill downloads and installs |
| SKILL-ADD-006 | GitHub import - invalid URL | Enter invalid URL, submit | Shows error message |
| SKILL-ADD-007 | Cancel GitHub import | Click X or Escape | Modal closes |
| SKILL-ADD-008 | Close add menu | Click outside menu | Menu closes |

#### 5.3 Skill Marketplace

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SKILL-MKT-001 | View marketplace | Click "Marketplace" tab | Shows marketplace skills |
| SKILL-MKT-002 | Filter by category | Click category tag | Filters to selected category |
| SKILL-MKT-003 | Search marketplace | Type in search box | Filters marketplace skills |
| SKILL-MKT-004 | Install from marketplace | Click "Install" button | Skill downloads and installs |
| SKILL-MKT-005 | Already installed badge | View installed skill in marketplace | Shows "Installed" badge |
| SKILL-MKT-006 | View marketplace detail | Click skill card | Opens skill detail modal |
| SKILL-MKT-007 | Install from detail | Click Install in modal | Skill downloads and installs |
| SKILL-MKT-008 | Loading state | Initial marketplace load | Shows loading indicator |

#### 5.4 Skill Detail Modal

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SKILL-MODAL-001 | View installed detail | Click installed skill | Shows name, description, source, version |
| SKILL-MODAL-002 | Toggle from modal | Click toggle in modal | Skill enabled status changes |
| SKILL-MODAL-003 | Delete from modal | Click Delete button | Opens delete confirmation |
| SKILL-MODAL-004 | Close modal - X | Click X button | Modal closes |
| SKILL-MODAL-005 | Close modal - backdrop | Click outside modal | Modal closes |
| SKILL-MODAL-006 | Close modal - Escape | Press Escape | Modal closes |
| SKILL-MODAL-007 | Open source URL | Click URL link | Opens URL in external browser |

#### 5.5 Delete Skill Confirmation

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SKILL-DEL-001 | Request delete | Click delete on skill | Opens confirmation modal |
| SKILL-DEL-002 | Confirm delete | Click confirm button | Skill deleted, modal closes |
| SKILL-DEL-003 | Cancel delete | Click cancel button | Modal closes, skill not deleted |
| SKILL-DEL-004 | Delete error | Delete fails | Shows error message in modal |

---

### 6. MCP Servers Management

**Components:** `src/renderer/components/mcp/`

#### 6.1 Installed MCP Servers

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| MCP-INST-001 | View installed servers | Navigate to MCP | Shows grid of installed servers |
| MCP-INST-002 | Empty state | No servers installed | Shows "No installed servers" message |
| MCP-INST-003 | Search servers | Type in search box | Filters servers by name/description |
| MCP-INST-004 | Toggle server enabled | Click toggle switch | Server enabled status changes |
| MCP-INST-005 | Edit server | Click pencil icon | Opens McpServerFormModal |
| MCP-INST-006 | Delete server | Click trash icon | Opens delete confirmation |
| MCP-INST-007 | Transport type badge | View server cards | Shows stdio/sse/http badge |
| MCP-INST-008 | Required keys indicator | Server requires env keys | Shows count of required keys |

#### 6.2 MCP Marketplace

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| MCP-MKT-001 | View marketplace | Click "Marketplace" tab | Shows available MCP servers |
| MCP-MKT-002 | Filter by category | Click category pill | Filters to selected category |
| MCP-MKT-003 | Search marketplace | Type in search box | Filters marketplace entries |
| MCP-MKT-004 | Install from marketplace | Click "Install" button | Opens form modal pre-filled |
| MCP-MKT-005 | Already installed | View installed server in marketplace | Shows "Installed" badge |
| MCP-MKT-006 | View transport info | View server card | Shows transport type and command |

#### 6.3 Custom MCP Servers

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| MCP-CUST-001 | View custom tab | Click "Custom" tab | Shows custom servers + add button |
| MCP-CUST-002 | Add custom server | Click "+ Add Server" card | Opens empty form modal |
| MCP-CUST-003 | Edit custom server | Click edit on custom server | Opens form modal with data |
| MCP-CUST-004 | Delete custom server | Click delete on custom server | Opens delete confirmation |
| MCP-CUST-005 | Toggle custom server | Click toggle on custom server | Server enabled status changes |

#### 6.4 MCP Server Form Modal

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| MCP-FORM-001 | Create new server | Fill form, click save | Server created, modal closes |
| MCP-FORM-002 | Edit existing server | Modify form, click save | Server updated, modal closes |
| MCP-FORM-003 | Install from registry | Pre-filled from marketplace | Form shows registry defaults |
| MCP-FORM-004 | Validation - name required | Empty name, submit | Shows validation error |
| MCP-FORM-005 | Validation - duplicate name | Enter existing name | Shows validation error |
| MCP-FORM-006 | Transport type change | Select different transport | Form shows relevant fields |
| MCP-FORM-007 | Cancel form | Click cancel or close | Modal closes without saving |
| MCP-FORM-008 | Environment variables | View/edit env vars | Shows key-value pairs |

#### 6.5 Delete MCP Server Confirmation

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| MCP-DEL-001 | Request delete | Click delete on server | Opens confirmation modal |
| MCP-DEL-002 | Confirm delete | Click confirm button | Server deleted, modal closes |
| MCP-DEL-003 | Cancel delete | Click cancel button | Modal closes, server not deleted |
| MCP-DEL-004 | Delete error | Delete fails | Shows error message in modal |

---

### 7. Batch Operations (Cowork Sessions)

**Component:** `Sidebar.tsx`, `CoworkSessionList.tsx`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| BATCH-001 | Enter batch mode | Long-press or context menu on session | Enters batch mode, session selected |
| BATCH-002 | Toggle selection | Click session checkbox | Selection toggles |
| BATCH-003 | Select all | Click "Select All" checkbox | All sessions selected |
| BATCH-004 | Deselect all | Click "Select All" when all selected | All deselected |
| BATCH-005 | Batch delete button | With selections, click delete | Opens batch delete confirmation |
| BATCH-006 | Batch delete disabled | No selections | Delete button disabled |
| BATCH-007 | Confirm batch delete | Click confirm in modal | Selected sessions deleted |
| BATCH-008 | Cancel batch delete | Click cancel in modal | Modal closes, nothing deleted |
| BATCH-009 | Exit batch mode | Click "Cancel" button | Exits batch mode |
| BATCH-010 | Exit on sidebar collapse | Collapse sidebar | Exits batch mode |

---

### 8. Cowork Session Operations

**Components:** `CoworkSessionList.tsx`, `CoworkSessionItem.tsx`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| COWORK-001 | Select session | Click on session | Session loads, becomes current |
| COWORK-002 | Delete session | Click delete on session | Session deleted from list |
| COWORK-003 | Pin session | Click pin icon | Session pinned, moves to top |
| COWORK-004 | Unpin session | Click pin icon on pinned | Session unpinned |
| COWORK-005 | Rename session | Double-click title, edit | Session title updated |
| COWORK-006 | Cancel rename | Double-click, press Escape | Title not changed |
| COWORK-007 | Pinned section | View list with pinned | Pinned sessions shown first |
| COWORK-008 | Date grouping | View list | Sessions grouped by date |

---

### 9. Settings Panel

**Component:** `src/renderer/components/Settings.tsx`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SET-001 | Open settings | Click Settings button | Settings panel opens |
| SET-002 | Tab navigation | Click different tabs | Tab content switches |
| SET-003 | General tab | View General tab | Shows theme, language options |
| SET-004 | Model tab | View Model tab | Shows API key, model selection |
| SET-005 | Email tab | View Email tab | Shows email configuration |
| SET-006 | Memory tab | View Memory tab | Shows memory entries |
| SET-007 | Shortcuts tab | View Shortcuts tab | Shows keyboard shortcuts |
| SET-008 | About tab | View About tab | Shows version, info |
| SET-009 | Theme toggle | Toggle dark/light | Theme changes immediately |
| SET-010 | Language toggle | Switch language | All UI text updates |
| SET-011 | API key visibility | Click show/hide | API key visibility toggles |
| SET-012 | Save settings | Modify and save | Settings saved, toast shown |
| SET-013 | Close settings | Click X or outside | Settings panel closes |

---

### 10. Cowork Session Core - Message Input

**Component:** `src/renderer/components/cowork/CoworkPromptInput.tsx`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| INPUT-001 | Basic prompt submission | Type text, press Enter or click Send | Message sent, input cleared |
| INPUT-002 | Submit with keyboard shortcut | Press Ctrl/Cmd+Enter | Message sent |
| INPUT-003 | Empty prompt validation | Try to submit empty input | Submit button disabled, no action |
| INPUT-004 | Multi-line input | Type multiple lines, Shift+Enter | Newlines preserved in textarea |
| INPUT-005 | Auto-resize textarea | Type long text | Textarea expands, max height limited |
| INPUT-006 | File attachment - drag and drop | Drag file onto input area | File attached, preview shown |
| INPUT-007 | File attachment - clipboard | Paste image from clipboard | Image attached, preview shown |
| INPUT-008 | File attachment - browse | Click attachment button | File picker opens |
| INPUT-009 | Image attachment preview | Attach image file | Thumbnail preview shown |
| INPUT-010 | Remove attached file | Click X on attached file | File removed from attachment |
| INPUT-011 | Working directory selector | Click directory dropdown | Shows workspace subdirectories |
| INPUT-012 | Change working directory | Select different directory | Working directory updated |
| INPUT-013 | Skill toggle | Click skill badge/button | Skills panel opens |
| INPUT-014 | Skill selection | Enable/disable skills | Selected skills shown as badges |
| INPUT-015 | Model selector | Click model dropdown | Shows available models |
| INPUT-016 | Model change | Select different model | Model selection updated |
| INPUT-017 | Input while streaming | Type while session active | Input disabled or queued |
| INPUT-018 | Large file attachment | Attach large file (>10MB) | Shows warning or progress |
| INPUT-019 | Invalid file type | Attach unsupported file type | Shows error message |
| INPUT-020 | Clear input | Clear all text | Submit button becomes disabled |

---

### 11. Cowork Session Core - Message Display

**Component:** `src/renderer/components/cowork/CoworkSessionDetail.tsx`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| MSG-001 | User message display | Send a message | Message appears with user icon |
| MSG-002 | Assistant message display | Receive response | Message appears with assistant icon |
| MSG-003 | Markdown rendering | View message with markdown | Properly formatted (bold, italic, links) |
| MSG-004 | Code block rendering | View message with code | Syntax highlighted code block |
| MSG-005 | Code block copy | Click copy on code block | Code copied to clipboard |
| MSG-006 | Code block language label | View code block | Language label shown |
| MSG-007 | Message timestamp | View any message | Timestamp displayed |
| MSG-008 | Auto-scroll on new message | Receive new message | Scrolls to bottom |
| MSG-009 | Scroll position retention | Scroll up, receive message | Position maintained if not at bottom |
| MSG-010 | Long message handling | View very long message | Message properly contained, scrollable |
| MSG-011 | Message with images | View message with images | Images displayed inline |
| MSG-012 | Message with links | View message with links | Links are clickable, open in new tab |
| MSG-013 | Copy message content | Click copy on message | Full message copied |
| MSG-014 | Regenerate response | Click regenerate button | New response generated |
| MSG-015 | Delete message | Click delete on message | Message removed from history |
| MSG-016 | Empty session state | View new/empty session | Shows welcome/empty state |
| MSG-017 | Loading skeleton | Load session with history | Skeleton shown while loading |
| MSG-018 | Message error state | View failed message | Error indicator shown with retry option |
| MSG-019 | Retry failed message | Click retry on failed | Message resent |
| MSG-020 | Message model indicator | View message | Shows which model was used |

---

### 12. Cowork Session Core - Streaming

**Component:** WebSocket streaming via `webSocketClient.ts`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| STREAM-001 | Streaming starts | Send prompt | Streaming indicator appears |
| STREAM-002 | Content appears progressively | Watch streaming response | Text appears character by character |
| STREAM-003 | Stop streaming - button | Click stop button | Streaming stops, partial message saved |
| STREAM-004 | Stop streaming - Escape | Press Escape key | Streaming stops |
| STREAM-005 | Streaming completion | Wait for completion | Streaming indicator removed |
| STREAM-006 | Streaming with code blocks | Stream response with code | Code blocks render correctly |
| STREAM-007 | Streaming with artifacts | Stream response with artifact | Artifact renders progressively |
| STREAM-008 | Network interruption | Disconnect during stream | Error shown, retry option available |
| STREAM-009 | Reconnection during stream | Reconnect during stream | Stream resumes or restarts |
| STREAM-010 | Multiple sequential streams | Send multiple prompts | Each streams independently |
| STREAM-011 | Large response streaming | Stream very long response | No performance issues |
| STREAM-012 | Streaming with tool use | Stream includes tool calls | Tool use displayed inline |

---

### 13. Cowork Session Core - Tool Permissions

**Component:** `src/renderer/components/cowork/CoworkPermissionModal.tsx`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| PERM-001 | Permission modal appears | Claude requests tool use | Modal shows tool details |
| PERM-002 | Tool name display | View permission modal | Tool name clearly shown |
| PERM-003 | Tool parameters display | View permission modal | Parameters shown in readable format |
| PERM-004 | Allow tool - once | Click "Allow" button | Tool executes, modal closes |
| PERM-005 | Deny tool | Click "Deny" button | Tool denied, modal closes |
| PERM-006 | Allow tool - always | Check "Remember", click Allow | Tool auto-approved in future |
| PERM-007 | Multiple tools request | Multiple tools requested | Each shown in sequence |
| PERM-008 | Question wizard - single | Single question asked | Input field shown |
| PERM-009 | Question wizard - multiple | Multiple questions asked | All questions displayed |
| PERM-010 | Question wizard - submit | Answer questions, submit | Answers sent to Claude |
| PERM-011 | Question validation | Leave required field empty | Validation error shown |
| PERM-012 | Cancel permission | Click outside or X | Permission denied, modal closes |
| PERM-013 | Dangerous tool warning | Request for file delete | Warning shown prominently |
| PERM-014 | Path display | Tool accesses file | Full file path shown |
| PERM-015 | Command display | Tool runs command | Full command shown |

---

### 14. Artifacts Rendering

**Component:** `src/renderer/components/artifacts/`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| ART-001 | HTML artifact | View HTML artifact | Renders in sandboxed iframe |
| ART-002 | HTML artifact - scripts | HTML contains scripts | Scripts blocked or sandboxed |
| ART-003 | SVG artifact | View SVG artifact | Renders with DOMPurify sanitization |
| ART-004 | SVG artifact - malicious | Malicious SVG content | Sanitized, safe display |
| ART-005 | Mermaid diagram | View Mermaid artifact | Diagram renders correctly |
| ART-006 | Mermaid - complex | Complex Mermaid diagram | No rendering errors |
| ART-007 | React component | View React artifact | Compiles and renders in iframe |
| ART-008 | React component - error | Invalid React code | Error boundary shown |
| ART-009 | Code artifact | View code artifact | Syntax highlighted |
| ART-010 | Code artifact - copy | Click copy button | Code copied to clipboard |
| ART-011 | Artifact fullscreen | Click fullscreen button | Opens in fullscreen modal |
| ART-012 | Artifact download | Click download button | Artifact downloaded |
| ART-013 | Large artifact | View very large artifact | No performance issues |
| ART-014 | Artifact refresh | Click refresh button | Artifact re-renders |
| ART-015 | Artifact close | Click close button | Artifact view closes |

---

### 15. File Browser

**Component:** `src/renderer/components/FileBrowser/`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| FILE-001 | View file browser | Navigate to Files view | Shows workspace directory |
| FILE-002 | Navigate directory | Click on folder | Shows folder contents |
| FILE-003 | Navigate up | Click ".." or back | Goes to parent directory |
| FILE-004 | Breadcrumb navigation | Click breadcrumb item | Navigates to that path |
| FILE-005 | File list display | View directory | Shows name, size, date, type |
| FILE-006 | File type icons | View different file types | Appropriate icons shown |
| FILE-007 | Sort by name | Click name column | Files sorted alphabetically |
| FILE-008 | Sort by date | Click date column | Files sorted by date |
| FILE-009 | Sort by size | Click size column | Files sorted by size |
| FILE-010 | File search | Type in search box | Files filtered by name |
| FILE-011 | View text file | Click on text file | Content displayed |
| FILE-012 | View image file | Click on image | Image preview shown |
| FILE-013 | View code file | Click on code file | Syntax highlighted content |
| FILE-014 | View binary file | Click on binary file | Shows "cannot display" message |
| FILE-015 | Download file | Click download button | File downloads |
| FILE-016 | File path copy | Click copy path | Path copied to clipboard |
| FILE-017 | Refresh directory | Click refresh button | Directory reloaded |
| FILE-018 | Large directory | Open directory with many files | Pagination or virtual scroll |
| FILE-019 | Hidden files toggle | Toggle hidden files | Shows/hides hidden files |
| FILE-020 | File in cowork | Drag file to cowork input | File attached to message |
| FILE-021 | Directory validation | Navigate to invalid path | Error message shown |
| FILE-022 | Permission denied | Navigate to restricted path | Error message shown |

---

### 16. WebSocket & Connection Handling

**Component:** `src/renderer/services/webSocketClient.ts`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| WS-001 | Initial connection | Start application | WebSocket connects successfully |
| WS-002 | Connection status indicator | View UI | Shows connected status |
| WS-003 | Connection lost | Stop server | Shows disconnected status |
| WS-004 | Auto-reconnect | Restart server after disconnect | Reconnects automatically |
| WS-005 | Reconnect attempts | Server down for extended time | Multiple reconnect attempts |
| WS-006 | Reconnect backoff | Watch reconnect timing | Exponential backoff observed |
| WS-007 | Connection restored | After reconnect | All data synced |
| WS-008 | Message during disconnect | Send message while disconnected | Queued or error shown |
| WS-009 | Multiple tabs | Open in multiple tabs | Each has own connection |
| WS-010 | Connection timeout | Slow network | Timeout error shown |
| WS-011 | Heartbeat/ping-pong | Idle connection | Connection maintained |

---

### 17. API Error Handling

**Component:** `src/renderer/services/apiClient.ts`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| API-001 | 400 Bad Request | Trigger bad request | Error message shown |
| API-002 | 401 Unauthorized | Invalid/expired session | Redirects to login or shows error |
| API-003 | 403 Forbidden | Access denied resource | Permission error shown |
| API-004 | 404 Not Found | Request non-existent resource | Not found error shown |
| API-005 | 500 Server Error | Server crash | Server error message shown |
| API-006 | Network timeout | Slow/timeout request | Timeout error shown |
| API-007 | Network offline | Disable network | Offline indicator shown |
| API-008 | Network restored | Re-enable network | Requests resume |
| API-009 | Invalid JSON response | Malformed response | Parse error handled |
| API-010 | Rate limited | Hit rate limit | Rate limit message shown |
| API-011 | Retry on failure | Transient error | Automatic retry |
| API-012 | Request cancellation | Cancel pending request | Request aborted |

---

### 18. Keyboard Shortcuts

**Component:** Global keyboard handlers

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| KB-001 | New Chat (Ctrl/Cmd+N) | Press shortcut | New session created |
| KB-002 | Search (Ctrl/Cmd+F) | Press shortcut | Search modal opens |
| KB-003 | Settings (Ctrl/Cmd+,) | Press shortcut | Settings panel opens |
| KB-004 | Send message (Enter) | Press Enter in input | Message sent |
| KB-005 | New line (Shift+Enter) | Press Shift+Enter | New line in input |
| KB-006 | Stop generation (Escape) | Press Escape during stream | Streaming stops |
| KB-007 | Close modal (Escape) | Press Escape in modal | Modal closes |
| KB-008 | Navigate up (Arrow Up) | Press up in session list | Previous session selected |
| KB-009 | Navigate down (Arrow Down) | Press down in session list | Next session selected |
| KB-010 | Copy (Ctrl/Cmd+C) | Select text, press shortcut | Text copied |
| KB-011 | Paste (Ctrl/Cmd+V) | Press shortcut in input | Content pasted |
| KB-012 | Select all (Ctrl/Cmd+A) | Press shortcut in input | All text selected |
| KB-013 | Undo (Ctrl/Cmd+Z) | Press shortcut in input | Last action undone |
| KB-014 | Toggle sidebar (Ctrl/Cmd+B) | Press shortcut | Sidebar toggles |
| KB-015 | Focus input (Ctrl/Cmd+I) | Press shortcut | Input focused |

---

### 19. Theme & Responsive Design

**Component:** Theme provider, responsive layouts

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| THEME-001 | Toggle dark mode | Click theme toggle | UI switches to dark |
| THEME-002 | Toggle light mode | Click theme toggle in dark | UI switches to light |
| THEME-003 | System preference | Match system dark mode | App uses dark mode |
| THEME-004 | Theme persistence | Restart app | Theme setting retained |
| THEME-005 | All components in dark | View all views in dark mode | No visibility issues |
| THEME-006 | Responsive - desktop | View at 1920px | Full layout displayed |
| THEME-007 | Responsive - tablet | Resize to 768px | Layout adapts |
| THEME-008 | Responsive - mobile | Resize to 375px | Mobile layout shown |
| THEME-009 | Sidebar auto-collapse | Resize to mobile | Sidebar collapses |
| THEME-010 | Touch interactions | Use touch on tablet | Touch works correctly |
| THEME-011 | Text scaling | Increase font size | Layout adjusts |
| THEME-012 | High contrast mode | Enable high contrast | Colors adjust |
| THEME-013 | Reduced motion | Enable reduced motion | Animations disabled |

---

### 20. Accessibility (A11y)

**Component:** All interactive components

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| A11Y-001 | Tab navigation | Press Tab repeatedly | Focus moves through interactive elements |
| A11Y-002 | Focus indicator | Focus on element | Visible focus ring |
| A11Y-003 | Focus trap in modal | Tab in modal | Focus stays within modal |
| A11Y-004 | Escape closes modal | Press Escape in modal | Modal closes |
| A11Y-005 | Button labels | Inspect buttons | All have accessible names |
| A11Y-006 | Image alt text | Inspect images | All have alt text |
| A11Y-007 | ARIA labels | Inspect with screen reader | Proper ARIA labels present |
| A11Y-008 | Form labels | Inspect form inputs | All have associated labels |
| A11Y-009 | Error announcements | Trigger form error | Screen reader announces error |
| A11Y-010 | Heading hierarchy | Inspect headings | Proper h1-h6 hierarchy |
| A11Y-011 | Landmark regions | Inspect page structure | Main, nav, aside regions present |
| A11Y-012 | Skip links | Tab from top | Skip link available |
| A11Y-013 | Color contrast | Check with contrast tool | Meets WCAG AA |

---

### 21. Notifications & Toasts

**Component:** Toast notification system

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TOAST-001 | Success toast | Complete successful action | Green success toast shown |
| TOAST-002 | Error toast | Trigger error | Red error toast shown |
| TOAST-003 | Warning toast | Trigger warning | Yellow warning toast shown |
| TOAST-004 | Info toast | Trigger info notification | Blue info toast shown |
| TOAST-005 | Toast auto-dismiss | Wait for toast | Toast dismisses after timeout |
| TOAST-006 | Toast manual dismiss | Click X on toast | Toast dismisses immediately |
| TOAST-007 | Multiple toasts | Trigger multiple notifications | Toasts stack vertically |
| TOAST-008 | Toast action button | View toast with action | Action button works |
| TOAST-009 | Toast position | View toast | Appears in correct position |
| TOAST-010 | Toast persistence | Navigate while toast shown | Toast remains visible |

---

### 22. Loading & Performance States

**Component:** Various loading indicators

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| LOAD-001 | App initial load | Start app | Loading spinner shown |
| LOAD-002 | Session list loading | Open app with sessions | Skeleton/skeleton shown |
| LOAD-003 | Session content loading | Select session | Content loads progressively |
| LOAD-004 | Skills loading | Navigate to Skills | Loading state shown |
| LOAD-005 | MCP loading | Navigate to MCP | Loading state shown |
| LOAD-006 | File browser loading | Open large directory | Loading indicator shown |
| LOAD-007 | Infinite scroll | Scroll long session | More content loads |
| LOAD-008 | Debounced search | Type in search | Search debounced (waits) |
| LOAD-009 | Lazy loading | Scroll to artifact | Artifact lazy loads |
| LOAD-010 | Progress indicator | Upload large file | Progress bar shown |

---

### 23. Data Persistence

**Component:** LocalStorage, IndexedDB, SQLite

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| PERSIST-001 | Settings persistence | Change settings, restart | Settings retained |
| PERSIST-002 | Session history | Create sessions, restart | Sessions retained |
| PERSIST-003 | Current session | Reload page | Current session restored |
| PERSIST-004 | Theme preference | Set theme, restart | Theme retained |
| PERSIST-005 | Sidebar state | Collapse sidebar, restart | State retained |
| PERSIST-006 | Draft message | Type message, reload | Draft preserved |
| PERSIST-007 | Clear data | Clear app data | All data removed |
| PERSIST-008 | Data export | Export app data | JSON file downloaded |
| PERSIST-009 | Data import | Import app data | Data restored |

---

### 24. End-to-End Workflows

**Component:** Full user workflows

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-001 | Complete chat workflow | New chat → Send prompt → Get response → Continue conversation | All steps work smoothly |
| E2E-002 | Chat with file | Attach file → Send prompt with file → View response | File context used |
| E2E-003 | Chat with artifact | Request artifact → View artifact → Interact with artifact | Artifact renders correctly |
| E2E-004 | Tool approval workflow | Prompt requiring tool → Approve tool → View result | Tool executes correctly |
| E2E-005 | Schedule task workflow | Create task → Enable → Wait for run → View result | Task runs on schedule |
| E2E-006 | Install skill workflow | Browse marketplace → Install skill → Use skill | Skill works correctly |
| E2E-007 | Configure MCP workflow | Add MCP server → Configure → Test connection | MCP server works |
| E2E-008 | Error recovery workflow | Trigger error → View error → Retry → Success | Recovery works |
| E2E-009 | Multi-session workflow | Create multiple chats → Switch between them | Context preserved |
| E2E-010 | Export workflow | Create content → Export session → Verify export | Export works correctly |

---

## Test Execution Checklist

### Pre-requisites
- [ ] Server running on port 3001
- [ ] Clean database (or known state)
- [ ] Test workspace directory exists
- [ ] Browser dev tools available for debugging

### Test Run Summary Template

| Module | Total | Passed | Failed | Blocked |
|--------|-------|--------|--------|---------|
| Navigation | 10 | | | |
| Search | 11 | | | |
| Task List | 12 | | | |
| Task Create | 15 | | | |
| Task Edit | 4 | | | |
| Task Delete | 4 | | | |
| Task Detail | 8 | | | |
| Task History | 10 | | | |
| Skills Installed | 8 | | | |
| Skills Add | 8 | | | |
| Skills Marketplace | 8 | | | |
| Skills Modal | 7 | | | |
| Skills Delete | 4 | | | |
| MCP Installed | 8 | | | |
| MCP Marketplace | 6 | | | |
| MCP Custom | 5 | | | |
| MCP Form | 8 | | | |
| MCP Delete | 4 | | | |
| Batch Operations | 10 | | | |
| Cowork Sessions | 8 | | | |
| Settings | 13 | | | |
| Message Input | 20 | | | |
| Message Display | 20 | | | |
| Streaming | 12 | | | |
| Tool Permissions | 15 | | | |
| Artifacts | 15 | | | |
| File Browser | 22 | | | |
| WebSocket | 11 | | | |
| API Errors | 12 | | | |
| Keyboard Shortcuts | 15 | | | |
| Theme & Responsive | 13 | | | |
| Accessibility | 13 | | | |
| Notifications | 10 | | | |
| Loading States | 10 | | | |
| Data Persistence | 9 | | | |
| E2E Workflows | 10 | | | |
| **TOTAL** | **388** | | | |

---

## Bug Reporting Template

```markdown
## Bug: [Short Description]

**Test ID:** [e.g., TASK-CREATE-003]
**Severity:** Critical / High / Medium / Low
**Priority:** P1 / P2 / P3

### Steps to Reproduce
1.
2.
3.

### Expected Result


### Actual Result


### Environment
- Browser:
- OS:
- Node Version:
- App Version:

### Screenshots/Logs


### Additional Notes

```

---

## Automated Testing Notes

### Recommended Tools
- **Playwright** or **Cypress** for E2E testing
- **Testing Library** for component testing
- **MSW** for API mocking

### Key Selectors (data-testid recommendations)

```html
<!-- Navigation -->
<button data-testid="nav-new-chat">
<button data-testid="nav-search">
<button data-testid="nav-scheduled-tasks">
<button data-testid="nav-skills">
<button data-testid="nav-mcp">
<button data-testid="nav-settings">

<!-- Search Modal -->
<div data-testid="search-modal">
<input data-testid="search-input">
<button data-testid="search-close">

<!-- Tasks -->
<button data-testid="task-new">
<div data-testid="task-list">
<div data-testid="task-item-{id}">
<button data-testid="task-toggle-{id}">
<button data-testid="task-menu-{id}">
<div data-testid="task-form">
<button data-testid="task-submit">

<!-- Skills -->
<div data-testid="skill-list">
<div data-testid="skill-item-{id}">
<button data-testid="skill-toggle-{id}">
<button data-testid="skill-delete-{id}">
<button data-testid="skill-add">
<div data-testid="skill-marketplace">

<!-- MCP -->
<div data-testid="mcp-list">
<div data-testid="mcp-item-{id}">
<button data-testid="mcp-toggle-{id}">
<button data-testid="mcp-edit-{id}">
<button data-testid="mcp-delete-{id}">
<div data-testid="mcp-form">
```

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-03-11 | Added 15 new test modules covering cowork core (input, display, streaming, permissions, artifacts), file browser, WebSocket/API errors, keyboard shortcuts, theme/responsive, accessibility, notifications, loading states, data persistence, and E2E workflows. Total increased from 171 to 388 test cases. |
| 2026-03-10 | Initial test plan created |
